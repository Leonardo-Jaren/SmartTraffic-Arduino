from django.db import models


class EstadoDispositivo(models.Model):
    """Último reporte recibido por el puente serial local."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    puente_activo = models.BooleanField(default=False)
    puerto = models.CharField(max_length=160, blank=True)
    ultimo_reporte = models.DateTimeField(null=True, blank=True)
    modo = models.CharField(max_length=20, default='DESCONOCIDO')
    colores = models.JSONField(default=list)
    tiempos_confirmados = models.JSONField(null=True, blank=True)
    error = models.CharField(max_length=240, blank=True)


class ComandoConfiguracion(models.Model):
    ESTADOS = [(s, s) for s in ('PENDIENTE', 'ENVIADO', 'APLICADO', 'RECHAZADO', 'INTERRUMPIDO')]

    principal = models.PositiveSmallIntegerField()
    secundaria = models.PositiveSmallIntegerField()
    amarillo = models.PositiveSmallIntegerField()
    todo_rojo = models.PositiveSmallIntegerField()
    estado = models.CharField(max_length=16, choices=ESTADOS, default='PENDIENTE')
    mensaje = models.CharField(max_length=160, blank=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def tiempos(self):
        return {k: getattr(self, k) for k in ('principal', 'secundaria', 'amarillo', 'todo_rojo')}
