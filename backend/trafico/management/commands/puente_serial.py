import time

import serial
from django.core.management.base import BaseCommand
from serial.tools import list_ports

from trafico.repositories.dispositivo import RepositorioDispositivo
from trafico.services.dispositivo import ServicioDispositivo
from trafico.services.protocolo import formar_configuracion


def abrir_puerto(nombre, baud):
    # DTR/RTS pueden provocar un reinicio al abrir el puerto en placas Arduino.
    puerto = serial.Serial(port=None, baudrate=baud, timeout=0.2, write_timeout=1)
    puerto.dtr = True
    puerto.rts = False
    puerto.port = nombre
    return puerto


class Command(BaseCommand):
    help = 'Conecta un Arduino por USB al Django que se ejecuta en esta misma computadora.'

    def add_arguments(self, parser):
        parser.add_argument('--puerto', help='Puerto serial, por ejemplo /dev/ttyACM0 o COM3')
        parser.add_argument('--listar', action='store_true', help='Lista los puertos disponibles')
        parser.add_argument('--baud', type=int, default=115200)

    def handle(self, *args, **opciones):
        if opciones['listar']:
            for puerto in list_ports.comports():
                self.stdout.write(f'{puerto.device}: {puerto.description}')
            return
        if not opciones['puerto']:
            self.stderr.write('Indica --puerto o usa --listar.')
            return
        repositorio = RepositorioDispositivo()
        servicio = ServicioDispositivo(repositorio)
        try:
            while True:
                try:
                    with abrir_puerto(opciones['puerto'], opciones['baud']) as puerto:
                        repositorio.iniciar_puente(opciones['puerto'])
                        self.stdout.write('Puerto abierto. Esperando un estado válido del Arduino…')
                        # DTR reinicia el UNO. Espera a que termine el arranque y lee un reporte nuevo.
                        time.sleep(2)
                        puerto.reset_input_buffer()
                        while True:
                            linea = puerto.readline(160)
                            if linea:
                                try:
                                    linea = linea.decode('ascii').strip()
                                    evento = servicio.procesar_linea(linea)
                                    if evento['tipo'] in {'inicio', 'estado', 'ack'}:
                                        self.stdout.write(f'Recibido: {linea}')
                                except (UnicodeDecodeError, ValueError) as error:
                                    self.stderr.write(f'Línea ignorada: {error}')
                            if servicio.esta_conectado(repositorio.obtener_estado()):
                                repositorio.vencer_comandos()
                                comando = repositorio.tomar_pendiente()
                                if comando:
                                    configuracion = formar_configuracion(comando)
                                    puerto.write(configuracion)
                                    puerto.flush()
                                    self.stdout.write(f'Enviado: {configuracion.decode("ascii").strip()}')
                            else:
                                repositorio.interrumpir_comandos('No llegan reportes recientes del Arduino.')
                except (serial.SerialException, OSError) as error:
                    repositorio.desconectar(str(error))
                    self.stderr.write(f'Serial desconectado: {error}. Reintentando…')
                    time.sleep(2)
        except KeyboardInterrupt:
            repositorio.desconectar('Puente detenido.')
            self.stdout.write('Puente detenido.')
