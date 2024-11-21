import json
import os
import openai

from django.http import JsonResponse

from openai import OpenAI
from dotenv import load_dotenv

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class GetTopic(APIView):
    permission_classes = [AllowAny]

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
        topic = _OpenAIHelper.generate(
            system="당신은 창의적인 논쟁 주제를 생성하는 AI입니다.",
            prompt=prompt
        )
        return JsonResponse(
            {
                'topic': topic
            },
            status=200
        )


class GetScores(APIView):
    permission_classes = [AllowAny]

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
            scores = _OpenAIHelper.generate(
                system="당신은 논리를 평가하는 심판 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            return JsonResponse(
                {
                    'scores': scores
                },
                status=200
            )
        except Exception as e:
            return JsonResponse(
                {
                    'error': str(e)
                },
                status=400
            )


class GetArgument(APIView):
    permission_classes = [AllowAny]

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
            argument = _OpenAIHelper.generate(
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
        except Exception as e:
            return JsonResponse(
                {
                    'error': str(e)
                },
                status=400
            )

class GetHistoricalFigure(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            figure = data['figure']
            prompt = f"""
                당신은 {figure}입니다. 당신의 말투, 성격, 그리고 역사적 맥락을 반영하여 사용자와 대화를 진행하세요.
                사용자에게 자신을 간단히 소개한 후 대화를 시작하세요.
            """
            introduction = _OpenAIHelper.generate(
                system=f"당신은 {figure}로서 행동하고 대화하는 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            return JsonResponse(
                {
                    'introduction': introduction
                },
                status=200
            )
        except Exception as e:
            return JsonResponse(
                {
                    'error': str(e)
                },
                status=400
            )


class GetHistoricalResponse(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            figure = data['figure']
            history = data['history']
            message = data['message']
            prompt = f"""
                당신은 {figure}입니다. 아래는 지금까지의 대화 기록입니다:
                {history}
                사용자 메시지:
                {message}
                위의 메시지에 {figure}로서 응답하세요.
            """
            response = _OpenAIHelper.generate(
                system=f"당신은 {figure}로서 행동하고 대화하는 AI입니다.",
                prompt=prompt,
                temperature=0.7
            )
            return JsonResponse(
                {
                    'response': response
                },
                status=200
            )
        except Exception as e:
            return JsonResponse(
                {
                    'error': str(e)
                },
                status=400
            )


class _OpenAIHelper:
    _client = None
    _is_loaded = False

    @classmethod
    def _load(cls):
        load_dotenv()
        cls._client = OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )

        cls._is_loaded = True

    @classmethod
    def generate(cls, system, prompt, temperature=0.9):
        if not cls._is_loaded:
            cls._load()

        response = openai.chat.completions.create(
            model='gpt-4o',
            messages=[
                {'role': 'system', "content": system},
                {'role': "user", "content": prompt}
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
