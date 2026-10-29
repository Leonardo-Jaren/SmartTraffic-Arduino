from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from trafico.models import ComandoConfiguracion, EstadoDispositivo


class RepositorioDispositivo:
    def obtener_estado(self):
        estado, _ = EstadoDispositivo.objects.get_or_create(pk=1)
        return estado

    def iniciar_puente(self, puerto):
        estado = self.obtener_estado()
        estado.puente_activo = True
        estado.puerto = puerto
        estado.ultimo_reporte = None
        estado.tiempos_confirmados = None
        estado.error = ''
        estado.save()
        self.interrumpir_comandos('El puente se reinició; vuelve a solicitar la configuración.')

    def desconectar(self, mensaje):
        estado = self.obtener_estado()
        estado.puente_activo = False
        estado.error = mensaje[:240]
        estado.save(update_fields=['puente_activo', 'error'])
        self.interrumpir_comandos('Se perdió la conexión antes de confirmar la configuración.')

    def reiniciar_dispositivo(self):
        estado = self.obtener_estado()
        estado.ultimo_reporte = None
        estado.tiempos_confirmados = None
        estado.save(update_fields=['ultimo_reporte', 'tiempos_confirmados'])
        self.interrumpir_comandos('El dispositivo se reinició antes de confirmar la configuración.')

    def guardar_reporte(self, modo, colores):
        estado = self.obtener_estado()
        estado.puente_activo = True
        estado.ultimo_reporte = timezone.now()
        estado.modo = modo
        estado.colores = colores
        estado.error = ''
        estado.save()

    def ultimo_comando(self):
        return ComandoConfiguracion.objects.order_by('-id').first()

    @transaction.atomic
    def crear_comando(self, tiempos):
        if ComandoConfiguracion.objects.filter(estado__in=['PENDIENTE', 'ENVIADO']).exists():
            return None
        return ComandoConfiguracion.objects.create(**tiempos)

    @transaction.atomic
    def tomar_pendiente(self):
        if ComandoConfiguracion.objects.filter(estado='ENVIADO').exists():
            return None
        comando = ComandoConfiguracion.objects.filter(estado='PENDIENTE').order_by('id').first()
        if comando:
            comando.estado = 'ENVIADO'
            comando.save(update_fields=['estado', 'actualizado'])
        return comando

    @transaction.atomic
    def confirmar(self, identificador, resultado, mensaje):
        comando = ComandoConfiguracion.objects.filter(pk=identificador, estado='ENVIADO').first()
        if not comando:
            return False
        comando.estado = resultado
        comando.mensaje = mensaje[:160]
        comando.save(update_fields=['estado', 'mensaje', 'actualizado'])
        if resultado == 'APLICADO':
            estado = self.obtener_estado()
            estado.tiempos_confirmados = comando.tiempos()
            estado.save(update_fields=['tiempos_confirmados'])
        return True

    def interrumpir_comandos(self, mensaje):
        ComandoConfiguracion.objects.filter(estado__in=['PENDIENTE', 'ENVIADO']).update(
            estado='INTERRUMPIDO', mensaje=mensaje, actualizado=timezone.now()
        )

    def vencer_comandos(self):
        limite = timezone.now() - timedelta(seconds=150)
        ComandoConfiguracion.objects.filter(estado='ENVIADO', actualizado__lt=limite).update(
            estado='INTERRUMPIDO', mensaje='El Arduino no confirmó la solicitud a tiempo.', actualizado=timezone.now()
        )
