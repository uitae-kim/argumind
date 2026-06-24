from django.test import TestCase

from api.models import Game, Score, Turn
from api.views import _parse_scores


class ParseScoresTests(TestCase):
    def test_parses_all_axes(self):
        raw = '논리적 일관성: 80, 관련성: 70, 창의성: 60, 반박 효과: 90, 요약력: 50'
        parsed = _parse_scores(raw)
        self.assertEqual(
            parsed,
            {
                'logical_consistency': 80,
                'relevance': 70,
                'creativity': 60,
                'rebuttal': 90,
                'summarization': 50,
            },
        )
        self.assertEqual(sum(parsed.values()), 350)

    def test_ignores_list_markers_and_clamps(self):
        # Leading "1." style markers must not be summed; values clamp to 0..100.
        raw = '1. 논리적 일관성: 120\n2. 관련성: 70\n3. 창의성: 60\n4. 반박 효과: 90\n5. 요약력: 50'
        parsed = _parse_scores(raw)
        self.assertEqual(parsed['logical_consistency'], 100)
        self.assertEqual(parsed['relevance'], 70)

    def test_missing_axis_defaults_to_zero(self):
        parsed = _parse_scores('논리적 일관성: 80')
        self.assertEqual(parsed['relevance'], 0)


class ModelTests(TestCase):
    def test_turn_and_score_relations(self):
        game = Game.objects.create(
            topic='AI는 인간의 창의성을 감소시킨다.',
            user_position=Game.FOR,
            opponent_position=Game.AGAINST,
        )
        turn = Turn.objects.create(game=game, index=0, user_text='첫 주장')
        Score.objects.create(
            turn=turn,
            side=Score.USER,
            logical_consistency=80,
            relevance=70,
            creativity=60,
            rebuttal=90,
            summarization=50,
            total=350,
        )
        self.assertEqual(game.turns.count(), 1)
        self.assertEqual(turn.scores.first().total, 350)
