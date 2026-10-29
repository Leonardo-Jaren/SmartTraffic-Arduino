from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from trafico.models import ComandoConfiguracion
from trafico.repositories.dispositivo import RepositorioDispositivo
from trafico.services.dispositivo import ServicioDispositivo
from trafico.services.protocolo import formar_configuracion, interpretar_linea


class PruebasDispositivo(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.repo = RepositorioDispositivo()
        self.servicio = ServicioDispositivo(self.repo)
        self.tiempos = {'principal': 30, 'secundaria': 15, 'amarillo': 3, 'todo_rojo': 2}

    def conectar(self):
        self.repo.iniciar_puente('/dev/simulado')
        self.servicio.procesar_linea('ESTADO,BLOQUEADO,R,R,R,R,R,R')

    def test_desconectado_oculta_colores_y_rechaza_configuracion(self):
        self.conectar()
        estado = self.repo.obtener_estado()
        estado.ultimo_reporte = timezone.now() - timedelta(seconds=10)
        estado.save()
        respuesta = self.api.get('/api/dispositivo/').json()
        self.assertFalse(respuesta['conectado'])
        self.assertEqual(respuesta['colores'], [])
        self.assertEqual(self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json').status_code, 409)

    def test_valida_limites_y_prioridad(self):
        self.conectar()
        for cambios in ({'amarillo': 1}, {'todo_rojo': 1}, {'principal': 15, 'secundaria': 20}, {'principal': 121}):
            respuesta = self.api.post('/api/dispositivo/configuraciones/', {**self.tiempos, **cambios}, format='json')
            self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(ComandoConfiguracion.objects.count(), 0)

    def test_solicitud_requiere_ack_del_dispositivo_simulado(self):
        self.conectar()
        respuesta = self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json')
        self.assertEqual(respuesta.status_code, 202)
        self.assertEqual(respuesta.json()['estado'], 'PENDIENTE')
        self.assertIsNone(self.api.get('/api/dispositivo/').json()['tiempos_confirmados'])
        comando = self.repo.tomar_pendiente()
        self.assertEqual(formar_configuracion(comando), f'CONFIG,{comando.id},30,15,3,2\n'.encode())
        self.servicio.procesar_linea(f'ACK,{comando.id},APLICADO,OK')
        estado = self.api.get('/api/dispositivo/').json()
        self.assertEqual(estado['ultimo_comando']['estado'], 'APLICADO')
        self.assertEqual(estado['tiempos_confirmados'], self.tiempos)

    def test_reinicio_interrumpe_configuracion_y_oculta_estado(self):
        self.conectar()
        self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json')
        comando = self.repo.tomar_pendiente()
        self.servicio.procesar_linea('INICIO,1')
        comando.refresh_from_db()
        self.assertEqual(comando.estado, 'INTERRUMPIDO')
        self.assertFalse(self.api.get('/api/dispositivo/').json()['conectado'])
        self.servicio.procesar_linea(f'ACK,{comando.id},APLICADO,OK')
        comando.refresh_from_db()
        self.assertEqual(comando.estado, 'INTERRUMPIDO')

    def test_rechazo_y_solicitud_duplicada(self):
        self.conectar()
        self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json')
        self.assertEqual(self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json').status_code, 409)
        comando = self.repo.tomar_pendiente()
        self.servicio.procesar_linea(f'ACK,{comando.id},RECHAZADO,VALORES')
        estado = self.api.get('/api/dispositivo/').json()
        self.assertEqual(estado['ultimo_comando']['estado'], 'RECHAZADO')
        self.assertIsNone(estado['tiempos_confirmados'])

    def test_comando_sin_ack_vence(self):
        self.conectar()
        self.api.post('/api/dispositivo/configuraciones/', self.tiempos, format='json')
        comando = self.repo.tomar_pendiente()
        ComandoConfiguracion.objects.filter(pk=comando.pk).update(actualizado=timezone.now() - timedelta(seconds=151))
        self.repo.vencer_comandos()
        comando.refresh_from_db()
        self.assertEqual(comando.estado, 'INTERRUMPIDO')

    def test_protocolo_rechaza_telemetria_malformada(self):
        for linea in ('ESTADO,ACTIVO,R,R,R,R,R,X', 'ACK,0,APLICADO,OK', 'ACK,2,OTRO,OK'):
            with self.assertRaises(ValueError):
                interpretar_linea(linea)
