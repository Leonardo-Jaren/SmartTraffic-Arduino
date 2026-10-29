from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from serial.tools import list_ports

from trafico.serializers.dispositivo import ConfiguracionSerializer
from trafico.services.dispositivo import ServicioDispositivo


class EstadoDispositivoView(APIView):
    def get(self, request):
        return Response(ServicioDispositivo().consultar())


class PuertosView(APIView):
    def get(self, request):
        puertos = [{'puerto': p.device, 'descripcion': p.description} for p in list_ports.comports()]
        return Response({'puertos_del_servidor': puertos})


class ConfiguracionView(APIView):
    def post(self, request):
        serializer = ConfiguracionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            comando = ServicioDispositivo().solicitar_configuracion(serializer.validated_data)
        except (ConnectionError, RuntimeError) as error:
            return Response({'detalle': str(error)}, status=status.HTTP_409_CONFLICT)
        return Response(comando, status=status.HTTP_202_ACCEPTED)
