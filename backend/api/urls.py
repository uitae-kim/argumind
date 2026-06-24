from django.urls import path

from api.views import GetTopic, GetScores, GetArgument, GameList, GameDetail

urlpatterns = [
    path('get-topic', GetTopic.as_view(), name='get-topic'),
    path('get-scores', GetScores.as_view(), name='get-scores'),
    path('get-argument', GetArgument.as_view(), name='get-argument'),
    path('games', GameList.as_view(), name='games'),
    path('games/<int:pk>', GameDetail.as_view(), name='game-detail'),
]
