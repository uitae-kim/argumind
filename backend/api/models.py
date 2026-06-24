from django.db import models


class Game(models.Model):
    """A single debate session: a topic plus the two assigned positions."""

    FOR = '찬성'
    AGAINST = '반대'
    POSITION_CHOICES = [(FOR, FOR), (AGAINST, AGAINST)]

    # Topic category (english key stored; matches frontend constants).
    ETHICS = 'ethics'
    TECH = 'tech'
    CULTURE = 'culture'
    RANDOM = 'random'
    CATEGORY_CHOICES = [
        (ETHICS, ETHICS),
        (TECH, TECH),
        (CULTURE, CULTURE),
        (RANDOM, RANDOM),
    ]

    # Opponent debater persona (english key stored).
    LOGICIAN = 'logician'
    PROVOCATEUR = 'provocateur'
    SOCRATIC = 'socratic'
    HISTORICAL = 'historical'
    PERSONA_CHOICES = [
        (LOGICIAN, LOGICIAN),
        (PROVOCATEUR, PROVOCATEUR),
        (SOCRATIC, SOCRATIC),
        (HISTORICAL, HISTORICAL),
    ]

    # Game lifecycle status.
    ACTIVE = 'active'
    FINISHED = 'finished'
    STATUS_CHOICES = [(ACTIVE, ACTIVE), (FINISHED, FINISHED)]

    topic = models.TextField()
    user_position = models.CharField(max_length=8, choices=POSITION_CHOICES)
    opponent_position = models.CharField(max_length=8, choices=POSITION_CHOICES)
    category = models.CharField(max_length=16, choices=CATEGORY_CHOICES, default=RANDOM)
    opponent_persona = models.CharField(
        max_length=16, choices=PERSONA_CHOICES, default=PROVOCATEUR
    )
    # 0 = unlimited (no auto verdict).
    max_turns = models.PositiveSmallIntegerField(default=3)
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default=ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Game #{self.pk}: {self.topic[:40]}'


class Turn(models.Model):
    """One round of the debate: the user's argument and the opponent's rebuttal."""

    game = models.ForeignKey(Game, related_name='turns', on_delete=models.CASCADE)
    index = models.PositiveIntegerField(help_text='0-based turn order within the game.')
    user_text = models.TextField(blank=True)
    opponent_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['game', 'index']
        unique_together = ('game', 'index')

    def __str__(self):
        return f'Game #{self.game_id} turn {self.index}'


class Score(models.Model):
    """The judge AI's 5-axis evaluation of one side's statement in a turn."""

    USER = 'user'
    OPPONENT = 'opponent'
    SIDE_CHOICES = [(USER, USER), (OPPONENT, OPPONENT)]

    turn = models.ForeignKey(Turn, related_name='scores', on_delete=models.CASCADE)
    side = models.CharField(max_length=8, choices=SIDE_CHOICES)

    logical_consistency = models.PositiveSmallIntegerField()
    relevance = models.PositiveSmallIntegerField()
    creativity = models.PositiveSmallIntegerField()
    rebuttal = models.PositiveSmallIntegerField()
    summarization = models.PositiveSmallIntegerField()
    total = models.PositiveIntegerField()

    comment = models.TextField(blank=True, default='')
    raw = models.TextField(blank=True, help_text='Raw LLM scoring text, kept for auditing.')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('turn', 'side')

    def __str__(self):
        return f'{self.side} score for game #{self.turn.game_id} turn {self.turn.index}: {self.total}/500'
