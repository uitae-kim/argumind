import json

from django.test import TestCase
from django.urls import reverse

from api.models import Game, Score, Turn
from api.views import _parse_scores, _parse_comment


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

    def test_parse_comment_extracts_after_label(self):
        raw = (
            '논리적 일관성: 80, 관련성: 70, 창의성: 60, 반박 효과: 90, 요약력: 50\n'
            '한 줄 총평: 논리는 탄탄하나 근거가 부족합니다.'
        )
        self.assertEqual(_parse_comment(raw), '논리는 탄탄하나 근거가 부족합니다.')

    def test_parse_comment_missing_returns_empty(self):
        self.assertEqual(_parse_comment('논리적 일관성: 80'), '')


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

    def test_new_field_defaults(self):
        game = Game.objects.create(
            topic='기본값 확인',
            user_position=Game.FOR,
            opponent_position=Game.AGAINST,
        )
        self.assertEqual(game.category, Game.RANDOM)
        self.assertEqual(game.opponent_persona, Game.PROVOCATEUR)
        self.assertEqual(game.max_turns, 3)
        self.assertEqual(game.status, Game.ACTIVE)

    def test_score_comment_default_blank(self):
        game = Game.objects.create(
            topic='코멘트 기본값',
            user_position=Game.FOR,
            opponent_position=Game.AGAINST,
        )
        turn = Turn.objects.create(game=game, index=0)
        score = Score.objects.create(
            turn=turn, side=Score.USER,
            logical_consistency=10, relevance=10, creativity=10,
            rebuttal=10, summarization=10, total=50,
        )
        self.assertEqual(score.comment, '')


def _make_score(turn, side, total, axis=None, comment=''):
    axis = axis or {}
    return Score.objects.create(
        turn=turn,
        side=side,
        logical_consistency=axis.get('logical_consistency', total // 5),
        relevance=axis.get('relevance', total // 5),
        creativity=axis.get('creativity', total // 5),
        rebuttal=axis.get('rebuttal', total // 5),
        summarization=axis.get('summarization', total // 5),
        total=total,
        comment=comment,
    )


class GameDetailTests(TestCase):
    def _build_game(self):
        game = Game.objects.create(
            topic='AI 토론',
            user_position=Game.FOR,
            opponent_position=Game.AGAINST,
            category=Game.TECH,
            opponent_persona=Game.LOGICIAN,
            max_turns=2,
        )
        t0 = Turn.objects.create(game=game, index=0, user_text='u0', opponent_text='o0')
        _make_score(t0, Score.USER, 300, axis={
            'logical_consistency': 60, 'relevance': 60, 'creativity': 60,
            'rebuttal': 60, 'summarization': 60,
        }, comment='good')
        _make_score(t0, Score.OPPONENT, 250)
        t1 = Turn.objects.create(game=game, index=1, user_text='u1', opponent_text='o1')
        _make_score(t1, Score.USER, 200, axis={
            'logical_consistency': 40, 'relevance': 40, 'creativity': 40,
            'rebuttal': 40, 'summarization': 40,
        })
        _make_score(t1, Score.OPPONENT, 300)
        return game

    def test_detail_aggregation(self):
        game = self._build_game()
        resp = self.client.get(reverse('game-detail', args=[game.pk]))
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content)

        # Headline total = mean per-turn total: user (300+200)/2=250, opp (250+300)/2=275.
        self.assertEqual(body['user_total'], 250)
        self.assertEqual(body['opponent_total'], 275)
        self.assertEqual(body['winner'], 'opponent')
        # Trend = per-turn totals (each 0..500), not cumulative.
        self.assertEqual(body['user_trend'], [300, 200])
        self.assertEqual(body['opponent_trend'], [250, 300])
        # Per-axis mean across turns (rounded int): (60+40)/2 = 50.
        self.assertEqual(body['user_axis_avg']['logical_consistency'], 50)
        self.assertEqual(len(body['turns']), 2)
        self.assertEqual(body['turns'][0]['user']['comment'], 'good')
        # max_turns reached -> auto-finished.
        self.assertEqual(body['status'], Game.FINISHED)

    def test_detail_404(self):
        resp = self.client.get(reverse('game-detail', args=[99999]))
        self.assertEqual(resp.status_code, 404)


class GameListTests(TestCase):
    def test_list_result_field(self):
        winning = Game.objects.create(
            topic='이긴 게임', user_position=Game.FOR, opponent_position=Game.AGAINST,
        )
        t = Turn.objects.create(game=winning, index=0)
        _make_score(t, Score.USER, 400)
        _make_score(t, Score.OPPONENT, 200)

        pending = Game.objects.create(
            topic='진행중 게임', user_position=Game.FOR, opponent_position=Game.AGAINST,
        )

        resp = self.client.get(reverse('games'))
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content)
        results = {item['id']: item['result'] for item in body}
        self.assertEqual(results[winning.pk], 'win')
        self.assertEqual(results[pending.pk], 'pending')
