from django.urls import path

from trafico.views.dispositivo import ConfiguracionView, EstadoDispositivoView, PuertosView

urlpatterns = [
    path('dispositivo/', EstadoDispositivoView.as_view()),
    path('dispositivo/puertos/', PuertosView.as_view()),
    path('dispositivo/configuraciones/', ConfiguracionView.as_view()),
]
