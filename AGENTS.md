# Guía de trabajo del proyecto

- Mantener separadas las capas del backend: repositorios, servicios, serializers y vistas. Las vistas no deben contener reglas de negocio ni acceso serial directo.
- Organizar el frontend por componentes, vistas, router, composables, servicios y tipos. La lógica de los componentes Vue debe vivir en composables o módulos reutilizables.
- Usar nombres descriptivos; preferir nombres de funciones en español, conservando términos técnicos comunes en inglés cuando sean más claros.
- Mantener los archivos enfocados y, como regla, por debajo de 400 líneas. Dividir responsabilidades en vez de añadir código de relleno para alcanzar un mínimo.
- Distinguir siempre datos de simulación de datos confirmados por el dispositivo. No representar datos antiguos como actuales tras una desconexión.
- No inventar el mapa físico: documentar lo observado y las posiciones o sentidos pendientes de confirmación. El hardware debe iniciar en rojo y permanecer bloqueado si no está configurado el mapa verificado.
- Mantener las validaciones y las pruebas de seguridad del protocolo, semáforos, rutas y cierres. Documentar lo probado y las limitaciones de hardware.
- No guardar claves, entornos virtuales, dependencias instaladas ni datos locales en Git.
