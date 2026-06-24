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

# Korean phrases used to bias the topic prompt toward a chosen category.
# 'random' carries no bias (the AI picks any topic).
CATEGORY_PROMPTS = {
    Game.ETHICS: '사회와 윤리',
    Game.TECH: '기술과 인공지능',
    Game.CULTURE: '문화와 예술',
    Game.RANDOM: '',
}

# Korean system-prompt persona instructions for the debater AI.
PERSONA_PROMPTS = {
    Game.LOGICIAN: (
        '당신은 논리주의자입니다. 감정에 휘둘리지 말고 명확한 근거와 '
        '논리적 추론, 일관된 전제로만 상대를 반박하세요.'
    ),
    Game.PROVOCATEUR: (
        '당신은 도발가입니다. 날카롭고 도발적인 어조로 상대 주장의 '
        '허점을 공격적으로 파고들어 반박하세요.'
    ),
    Game.SOCRATIC: (
        '당신은 소크라테스식 토론자입니다. 단정적으로 주장하기보다 '
        '날카로운 질문을 던져 상대 논리의 모순을 스스로 드러내게 하세요.'
    ),
    Game.HISTORICAL: (
        '당신은 역사 속 위대한 사상가의 관점을 빌려 토론합니다. 해당 주제에 '
        '어울리는 역사적 인물의 시각과 사상을 차용하여 깊이 있게 반박하세요.'
    ),
}


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


def _parse_comment(raw):
    """Extract the judge's one-line summary from the raw scoring text.

    Returns everything after the '총평' label (one line), or '' if absent.
    """
    match = re.search(r'총평\s*[:：]?\s*(.+)', raw)
    return match.group(1).strip() if match else ''


class GetTopic(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'get_topic'

    def post(self, request):
        data = request.data

        # Optional setup options, with contract defaults.
        category = data.get('category') or Game.RANDOM
        if category not in CATEGORY_PROMPTS:
            category = Game.RANDOM
        opponent_persona = data.get('opponent_persona') or Game.PROVOCATEUR
        if opponent_persona not in PERSONA_PROMPTS:
            opponent_persona = Game.PROVOCATEUR
        try:
            max_turns = int(data.get('max_turns', 3))
        except (TypeError, ValueError):
            max_turns = 3
        if max_turns < 0:
            max_turns = 3

        # Bias the topic toward the chosen category (no bias for 'random').
        category_phrase = CATEGORY_PROMPTS.get(category, '')
        category_line = (
            f'주제는 반드시 "{category_phrase}"와 관련된 내용이어야 합니다.\n'
            if category_phrase else ''
        )
        prompt = f"""
            재미있고 논쟁을 유발할 수 있는 주제를 하나 생성해주세요.
            주제는 간단하고 명확하며, 다양한 입장이 가능해야 합니다.
            {category_line}예시:
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
            category=category,
            opponent_persona=opponent_persona,
            max_turns=max_turns,
            status=Game.ACTIVE,
        )

        return JsonResponse(
            {
                'game_id': game.pk,
                'topic': topic,
                'user_position': user_position,
                'opponent_position': opponent_position,
                'category': category,
                'opponent_persona': opponent_persona,
                'max_turns': max_turns,
                'status': game.status,
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
                마지막 줄에는 주장에 대한 짧은 평가를 다음 형식으로 한 줄 작성하세요.
                한 줄 총평: 평가 내용
                """
            raw = _GoogleAIHelper.generate(
                system="당신은 논리를 평가하는 심판 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            scores = _parse_scores(raw)
            total = sum(scores.values())
            comment = _parse_comment(raw)

            # Optional persistence: only when the client supplies a game context.
            self._persist(data, text, scores, total, raw, comment)

            return JsonResponse(
                {
                    'scores': scores,
                    'total': total,
                    'max_total': 100 * len(SCORE_LABELS),
                    'comment': comment,
                    'raw': raw,
                },
                status=200
            )
        except KeyError as e:
            return JsonResponse({'error': f'missing field: {e.args[0]}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    @staticmethod
    def _persist(data, text, scores, total, raw, comment=''):
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
                defaults={**scores, 'total': total, 'raw': raw, 'comment': comment},
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

            # Resolve the debater persona: explicit value wins, else look it up
            # from the persisted Game, else fall back to the default.
            persona = data.get('opponent_persona')
            if persona not in PERSONA_PROMPTS:
                persona = None
            if persona is None:
                game_id = data.get('game_id')
                if game_id:
                    persona = (
                        Game.objects.filter(pk=game_id)
                        .values_list('opponent_persona', flat=True)
                        .first()
                    )
            if persona not in PERSONA_PROMPTS:
                persona = Game.PROVOCATEUR

            persona_instruction = PERSONA_PROMPTS[persona]
            system = (
                f'{persona_instruction}\n'
                '당신은 논쟁에서 상대방의 주장을 반박하는 AI입니다.'
            )
            prompt = f"""
                주제: {topic}
                입장: {position}
                지금까지의 발언 기록:
                {history}
                상대방의 주장에 대응할 반박을 생성하세요.
            """
            argument = _GoogleAIHelper.generate(
                system=system,
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


class GameDetail(APIView):
    """GET /api/games/<id> — full debate detail aggregated from persisted rows."""

    permission_classes = [AllowAny]
    throttle_scope = 'game_read'

    def get(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
        except Game.DoesNotExist:
            return JsonResponse({'error': 'game not found'}, status=404)

        turns = list(game.turns.prefetch_related('scores').order_by('index'))

        # Flip to finished once the configured number of turns is reached
        # (max_turns == 0 means unlimited, so never auto-finish).
        if game.max_turns and len(turns) >= game.max_turns and game.status != Game.FINISHED:
            game.status = Game.FINISHED
            game.save(update_fields=['status'])

        axis_fields = [field for field, _ in SCORE_LABELS]

        turns_payload = []
        # Per-turn totals (each 0..500); the trend sparkline plots these directly
        # and the headline total is their mean, matching the /500 verdict display.
        user_trend = []
        opponent_trend = []
        user_axis_sums = {field: 0 for field in axis_fields}
        opponent_axis_sums = {field: 0 for field in axis_fields}

        for turn in turns:
            scores_by_side = {s.side: s for s in turn.scores.all()}
            user_score = scores_by_side.get(Score.USER)
            opponent_score = scores_by_side.get(Score.OPPONENT)

            def _side_payload(text, score):
                if score is None:
                    return {'text': text, 'scores': None, 'total': None, 'comment': ''}
                return {
                    'text': text,
                    'scores': {f: getattr(score, f) for f in axis_fields},
                    'total': score.total,
                    'comment': score.comment,
                }

            turns_payload.append({
                'index': turn.index,
                'user': _side_payload(turn.user_text, user_score),
                'opponent': _side_payload(turn.opponent_text, opponent_score),
            })

            if user_score is not None:
                user_trend.append(user_score.total)
                for f in axis_fields:
                    user_axis_sums[f] += getattr(user_score, f)
            if opponent_score is not None:
                opponent_trend.append(opponent_score.total)
                for f in axis_fields:
                    opponent_axis_sums[f] += getattr(opponent_score, f)

        user_scored_turns = len(user_trend)
        opponent_scored_turns = len(opponent_trend)

        user_axis_avg = {
            f: round(user_axis_sums[f] / user_scored_turns) if user_scored_turns else 0
            for f in axis_fields
        }
        opponent_axis_avg = {
            f: round(opponent_axis_sums[f] / opponent_scored_turns) if opponent_scored_turns else 0
            for f in axis_fields
        }

        # Headline total = mean per-turn total (0..500), not a cumulative sum.
        user_total = round(sum(user_trend) / user_scored_turns) if user_scored_turns else 0
        opponent_total = round(sum(opponent_trend) / opponent_scored_turns) if opponent_scored_turns else 0

        if user_total > opponent_total:
            winner = 'user'
        elif opponent_total > user_total:
            winner = 'opponent'
        else:
            winner = 'tie'

        return JsonResponse({
            'game_id': game.pk,
            'topic': game.topic,
            'user_position': game.user_position,
            'opponent_position': game.opponent_position,
            'category': game.category,
            'opponent_persona': game.opponent_persona,
            'max_turns': game.max_turns,
            'status': game.status,
            'turns': turns_payload,
            'user_total': user_total,
            'opponent_total': opponent_total,
            'user_axis_avg': user_axis_avg,
            'opponent_axis_avg': opponent_axis_avg,
            'user_trend': user_trend,
            'opponent_trend': opponent_trend,
            'winner': winner,
        }, status=200)


class GameList(APIView):
    """GET /api/games — summary list of all debates, most recent first."""

    permission_classes = [AllowAny]
    throttle_scope = 'game_read'

    def get(self, request):
        games = Game.objects.prefetch_related('turns__scores').order_by('-created_at')

        payload = []
        for game in games:
            user_totals = []
            opponent_totals = []
            for turn in game.turns.all():
                for score in turn.scores.all():
                    if score.side == Score.USER:
                        user_totals.append(score.total)
                    elif score.side == Score.OPPONENT:
                        opponent_totals.append(score.total)

            # Mean per-turn total (0..500), consistent with the verdict display.
            user_total = round(sum(user_totals) / len(user_totals)) if user_totals else 0
            opponent_total = round(sum(opponent_totals) / len(opponent_totals)) if opponent_totals else 0

            # Result from the user's perspective; 'pending' until any score exists.
            if not user_totals and not opponent_totals:
                result = 'pending'
            elif user_total > opponent_total:
                result = 'win'
            elif opponent_total > user_total:
                result = 'lose'
            else:
                result = 'tie'

            payload.append({
                'id': game.pk,
                'topic': game.topic,
                'user_position': game.user_position,
                'category': game.category,
                'opponent_persona': game.opponent_persona,
                'user_total': user_total,
                'opponent_total': opponent_total,
                'result': result,
                'created_at': game.created_at.isoformat(),
            })

        return JsonResponse(payload, safe=False, status=200)


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
