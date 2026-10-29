from datetime import timedelta

from django.utils import timezone

from trafico.repositories.dispositivo import RepositorioDispositivo
from trafico.services.protocolo import interpretar_linea

MAX_SIN_REPORTE = timedelta(seconds=4)


class ServicioDispositivo:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or RepositorioDispositivo()

    def esta_conectado(self, estado):
        return bool(estado.puente_activo and estado.ultimo_reporte and
                    timezone.now() - estado.ultimo_reporte <= MAX_SIN_REPORTE)

    def consultar(self):
        estado = self.repositorio.obtener_estado()
        conectado = self.esta_conectado(estado)
        comando = self.repositorio.ultimo_comando()
        return {
            'fuente': 'simulado' if conectado and estado.modo == 'SIMULADO' else 'arduino', 'conectado': conectado,
            'modo': estado.modo if conectado else 'DESCONECTADO',
            'colores': estado.colores if conectado else [],
            'ultimo_reporte': estado.ultimo_reporte, 'puerto': estado.puerto,
            'error': estado.error if not conectado else '',
            'tiempos_confirmados': estado.tiempos_confirmados if conectado else None,
            'ultimo_comando': self.resumir_comando(comando),
        }

    def solicitar_configuracion(self, tiempos):
        if not self.esta_conectado(self.repositorio.obtener_estado()):
            raise ConnectionError('El dispositivo no ha enviado un estado reciente.')
        comando = self.repositorio.crear_comando(tiempos)
        if comando is None:
            raise RuntimeError('Ya hay una configuración pendiente de confirmación.')
        return self.resumir_comando(comando)

    @staticmethod
    def resumir_comando(comando):
        if not comando:
            return None
        return {'id': comando.id, 'estado': comando.estado, 'mensaje': comando.mensaje,
                'tiempos': comando.tiempos(), 'actualizado': comando.actualizado}

    def procesar_linea(self, linea):
        evento = interpretar_linea(linea)
        if evento['tipo'] == 'inicio':
            self.repositorio.reiniciar_dispositivo()
        elif evento['tipo'] == 'estado':
            self.repositorio.guardar_reporte(evento['modo'], evento['colores'])
        elif evento['tipo'] == 'ack':
            self.repositorio.confirmar(evento['id'], evento['resultado'], evento['mensaje'])
        return evento
