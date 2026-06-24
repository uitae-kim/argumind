import os
import random
import re

from django.http import JsonResponse

from openai import OpenAI
from dotenv import load_dotenv

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from api.models import Game, Turn, Score

# Maps the Korean score labels produced by the judge prompt to model fields.
SCORE_LABELS = [
    ('logical_consistency', '논리적 일관성'),
    ('relevance', '관련성'),
    ('creativity', '창의성'),
    ('rebuttal', '반박 효과'),
    ('summarization', '요약력'),
]


def _parse_scores(raw):
    """Parse the judge's free-text scores into a {field: int} dict.

    Each axis is matched by its label so stray numbers (e.g. list markers)
    no longer pollute the total. Missing axes default to 0.
    """
    parsed = {}
    for field, label in SCORE_LABELS:
        match = re.search(re.escape(label) + r'\s*[:：]?\s*(\d{1,3})', raw)
        value = int(match.group(1)) if match else 0
        parsed[field] = max(0, min(100, value))
    return parsed


class GetTopic(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'get_topic'

    def post(self, request):
        prompt = """
            재미있고 논쟁을 유발할 수 있는 주제를 하나 생성해주세요.
            주제는 간단하고 명확하며, 다양한 입장이 가능해야 합니다.
            예시:
            - "AI 기술의 발전이 인간의 창의성을 감소시킬 것이다."
            - "화성 이주는 인간 생존의 필수 조건이다."
            - "온라인 교육은 전통적인 교실 교육을 대체할 것이다."
            주제를 하나만 생성하세요.
            """
        topic = _GoogleAIHelper.generate(
            system="당신은 창의적인 논쟁 주제를 생성하는 AI입니다.",
            prompt=prompt
        )

        # Positions are assigned server-side so a persisted Game is self-contained.
        user_position = random.choice([Game.FOR, Game.AGAINST])
        opponent_position = Game.AGAINST if user_position == Game.FOR else Game.FOR

        game = Game.objects.create(
            topic=topic,
            user_position=user_position,
            opponent_position=opponent_position,
        )

        return JsonResponse(
            {
                'game_id': game.pk,
                'topic': topic,
                'user_position': user_position,
                'opponent_position': opponent_position,
            },
            status=200
        )


class GetScores(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'get_scores'

    def post(self, request):
        try:
            data = request.data
            topic = data['topic']
            position = data['position']
            history = data['history']
            text = data['text']
            prompt = f"""
                주제: {topic}
                입장: {position}
                지금까지의 발언 기록:
                {history}
                평가할 주장: {text}
                아래 항목에 따라 각각 0~100 점수를 평가해주세요.
                1. 논리적 일관성
                2. 관련성
                3. 창의성
                4. 반박 효과
                5. 요약력
                형식: 논리적 일관성: 점수, 관련성: 점수, 창의성: 점수, 반박 효과: 점수, 요약력: 점수
                반드시 형식을 준수하세요.
                """
            raw = _GoogleAIHelper.generate(
                system="당신은 논리를 평가하는 심판 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            scores = _parse_scores(raw)
            total = sum(scores.values())

            # Optional persistence: only when the client supplies a game context.
            self._persist(data, text, scores, total, raw)

            return JsonResponse(
                {
                    'scores': scores,
                    'total': total,
                    'max_total': 100 * len(SCORE_LABELS),
                    'raw': raw,
                },
                status=200
            )
        except KeyError as e:
            return JsonResponse({'error': f'missing field: {e.args[0]}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    @staticmethod
    def _persist(data, text, scores, total, raw):
        """Persist the turn statement and its score; failures never break the response."""
        game_id = data.get('game_id')
        turn_index = data.get('turn_index')
        side = data.get('side')
        if not game_id or turn_index is None or side not in (Score.USER, Score.OPPONENT):
            return
        try:
            turn, _ = Turn.objects.get_or_create(game_id=game_id, index=turn_index)
            if side == Score.USER:
                turn.user_text = text
            else:
                turn.opponent_text = text
            turn.save()
            Score.objects.update_or_create(
                turn=turn,
                side=side,
                defaults={**scores, 'total': total, 'raw': raw},
            )
        except Exception:
            # Persistence is best-effort; the game must keep working regardless.
            pass


class GetArgument(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'get_argument'

    def post(self, request):
        try:
            data = request.data
            topic = data['topic']
            position = data['opposite_position']
            history = data['history']
            prompt = f"""
                주제: {topic}
                입장: {position}
                지금까지의 발언 기록:
                {history}
                상대방의 주장에 대응할 반박을 생성하세요.
            """
            argument = _GoogleAIHelper.generate(
                system="당신은 논쟁에서 상대방의 주장을 반박하는 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            return JsonResponse(
                {
                    'argument': argument
                },
                status=200
            )
        except KeyError as e:
            return JsonResponse({'error': f'missing field: {e.args[0]}'}, status=400)
        except Exception as e:
            return JsonResponse(
                {
                    'error': str(e)
                },
                status=400
            )


class _GoogleAIHelper:
    """Wraps Google AI Studio (Gemini API) via its OpenAI-compatible endpoint.

    The endpoint speaks the OpenAI chat-completions protocol, so the existing
    `openai` client is reused. Gemma models do not accept a separate system
    instruction, so the system prompt is folded into the user message.
    """
    _BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
    _DEFAULT_MODEL = 'gemma-4-31b-it'
    # Gemma models sometimes prefix replies with a <thought>...</thought>
    # reasoning block. This strips it (and any unclosed leading block) so the
    # raw reasoning never reaches users or pollutes _parse_scores.
    _THOUGHT_RE = re.compile(r'<thought\b[^>]*>.*?</thought>', re.DOTALL | re.IGNORECASE)
    _OPEN_THOUGHT_RE = re.compile(r'^\s*<thought\b[^>]*>.*', re.DOTALL | re.IGNORECASE)
    _client = None
    _model = None
    _is_loaded = False

    @classmethod
    def _load(cls):
        load_dotenv()
        cls._client = OpenAI(
            api_key=os.getenv('GOOGLE_API_KEY'),
            base_url=cls._BASE_URL,
        )
        cls._model = os.getenv('GOOGLE_AI_MODEL', cls._DEFAULT_MODEL)
        cls._is_loaded = True

    @classmethod
    def generate(cls, system, prompt, temperature=0.9):
        if not cls._is_loaded:
            cls._load()

        response = cls._client.chat.completions.create(
            model=cls._model,
            messages=[
                {'role': 'user', 'content': f'{system}\n\n{prompt}'}
            ],
            temperature=temperature,
        )
        return cls._strip_thoughts(response.choices[0].message.content)

    @classmethod
    def _strip_thoughts(cls, text):
        """Remove Gemma <thought> reasoning blocks from a model reply.

        Handles well-formed <thought>...</thought> blocks anywhere in the
        text, plus an unclosed block at the start (model cut off mid-thought).
        """
        if not text:
            return ''
        cleaned = cls._THOUGHT_RE.sub('', text)
        cleaned = cls._OPEN_THOUGHT_RE.sub('', cleaned)
        return cleaned.strip()
