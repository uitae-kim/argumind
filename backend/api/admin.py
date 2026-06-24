from django.contrib import admin

from api.models import Game, Turn, Score


class TurnInline(admin.TabularInline):
    model = Turn
    extra = 0


class ScoreInline(admin.TabularInline):
    model = Score
    extra = 0


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'topic', 'user_position', 'opponent_position', 'created_at')
    search_fields = ('topic',)
    inlines = [TurnInline]


@admin.register(Turn)
class TurnAdmin(admin.ModelAdmin):
    list_display = ('id', 'game', 'index', 'created_at')
    list_filter = ('game',)
    inlines = [ScoreInline]


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ('id', 'turn', 'side', 'total', 'created_at')
    list_filter = ('side',)
