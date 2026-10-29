# Pruebas y límites

Comprobaciones realizadas en este entorno:

- Django: 7 pruebas automatizadas de validación, desconexión/caducidad, reinicio, rechazo, ACK y protocolo; `manage.py check` y migraciones.
- Vue/Vitest: 14 pruebas de sentidos, rutas, cierres, prioridad, fases incompatibles, validación, reserva de cruces y representación y fuente de los seis semáforos.
- Chromium/Playwright: 7 pruebas de renderizado WebGL, selección de calle, cierre/reapertura, adición virtual, movimiento de cámara, tiempos inválidos, desconexión, pantalla completa, reubicación persistente de semáforos y ancho móvil.
- Puente serial: prueba de extremo a extremo con PTY, simulador identificado, `CONFIG`, `ACK` y desconexión; se usó una base SQLite temporal.
- Firmware: compilado y enlazado para ATmega328P con el núcleo Arduino AVR y GCC AVR de Debian; 4.672 bytes de programa y 422 bytes de datos estáticos con el mapa bloqueado. Una prueba nativa con reloj y GPIO simulados verificó el bloqueo, prueba individual de LED, el mapa horizontal, fases H/V mixtas sin verdes incompatibles y ACK/rechazo.

No se conectó un UNO físico ni se midieron tensiones, resistencias, LED, brillo o funcionamiento en la maqueta. El tamaño exterior de 160 × 120 cm es un dato del usuario; las calles y edificios internos y la escala de velocidad no se midieron. El sketch deja preparado el mapa S1–S6 de las horizontales, pero inicia bloqueado para comprobar el cableado; ceder el paso no se puede imponer eléctricamente con un único semáforo. No se probó hardware real, Wi-Fi ESP32 ni despliegue remoto.

El build pasa con un aviso de Vite por el tamaño del módulo 3D: aproximadamente 590 kB minificados (149 kB comprimidos). Se carga de forma diferida, pero podría optimizarse más para conexiones móviles lentas.

Para repetir las pruebas consulta los comandos del [README](../README.md). El simulador PTY requiere Linux/macOS; es una prueba de software, no representa sensores ni valida soldaduras.
