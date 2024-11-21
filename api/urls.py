from django.urls import path

from api.views import GetTopic, GetScores, GetArgument, GetHistoricalFigure, GetHistoricalResponse

urlpatterns = [
    path('get-topic', GetTopic.as_view(), name='get-topic'),
    path('get-scores', GetScores.as_view(), name='get-scores'),
    path('get-argument', GetArgument.as_view(), name='get-argument'),
    path('get-historical-figure', GetHistoricalFigure.as_view(), name='get-historical-figure'),
    path('get-historical-respond', GetHistoricalResponse.as_view(), name='get-historical-respond'),
]
