# Pruebas y límites

## Revisión de orientación y escena 3D — 28 de octubre de 2026

- `npm test`: **41 pruebas** en seis archivos. Incluyen la cara real de las seis luces contra el flujo de su calle, la fase de cada eje, las esquinas del croquis, parada en rojo/amarillo a 120 km/h, tamaño de la carrocería respecto a la línea y la separación, reservas exclusivas y espacio suficiente para salir del cruce.
- Se simularon cinco minutos con objetivos de 8 y 24 autos, fases y cierres: sin reservas duplicadas, entradas sin verde ni pérdida de separación en una misma calle. Otros dos recorridos detienen los ingresos, reabren las calles y comprueban que todos los autos terminan saliendo.
- `npm run test:e2e -- --workers=1`: **7 pruebas** de navegador aprobadas. Cubren WebGL, selección, cierres, cámara, edición persistente de las luces, pantalla completa, controles, desconexión y disposición móvil. La configuración admite el entorno Python de Windows y reutiliza servidores locales fuera de CI.
- `npm run build`: compilación y chequeo de tipos aprobados. El módulo diferido de Three.js mide aproximadamente 621 kB sin comprimir (159 kB gzip); Vite mantiene su aviso de paquete mayor a 500 kB.
- Revisión visual en Chromium aislado: vista normal, ampliada, girada y móvil de 390 px, sin errores de JavaScript. Se cotejaron los seis giros iniciales: `0°, 90°, 0°, 270°, 180°, 270°`. Se revisaron las fachadas desde varios lados, las luces, los autos y el encuadre del tablero completo.

Estas comprobaciones corresponden a la simulación y la vista web. No se conectó ni se activó un Arduino físico en esta revisión.

## Registros anteriores

Registro de comprobaciones de la versión anterior a la revisión actual de orientación y modelos 3D. Estos resultados no verifican por sí solos los cambios posteriores:

- Django: 7 pruebas automatizadas de validación, desconexión/caducidad, reinicio, rechazo, ACK y protocolo; `manage.py check` y migraciones.
- Vue/Vitest: 14 pruebas de sentidos, rutas, cierres, prioridad, fases incompatibles, validación, reserva de cruces y representación y fuente de los seis semáforos.
- Chromium/Playwright: 7 pruebas de renderizado WebGL, selección de calle, cierre/reapertura, adición virtual, movimiento de cámara, tiempos inválidos, desconexión, pantalla completa, reubicación persistente de semáforos y ancho móvil.
- Puente serial: prueba de extremo a extremo con PTY, simulador identificado, `CONFIG`, `ACK` y desconexión; se usó una base SQLite temporal.
- Firmware: compilado y enlazado para ATmega328P con el núcleo Arduino AVR y GCC AVR de Debian; 4.672 bytes de programa y 422 bytes de datos estáticos con el mapa bloqueado. Una prueba nativa con reloj y GPIO simulados verificó el bloqueo, prueba individual de LED, el mapa horizontal, fases H/V mixtas sin verdes incompatibles y ACK/rechazo.

No se conectó un UNO físico ni se midieron tensiones, resistencias, LED, brillo o funcionamiento en la maqueta. El tamaño exterior de 160 × 120 cm es un dato del usuario; las calles y edificios internos y la escala de velocidad no se midieron. El sketch conserva la asignación inicial de ejes H con `MAPA_CONFIRMADO=false`, pendiente de comprobar y adaptar al croquis actualizado `{V,H,V,H,V,H}`. Ceder el paso no se puede imponer eléctricamente con un único semáforo. No se probó hardware real, Wi-Fi ESP32 ni despliegue remoto.

El módulo 3D se carga de forma diferida. Vite puede advertir por su tamaño al compilar; el resultado y tamaño de la versión actual deben consultarse en la salida de su compilación.

Para repetir las pruebas consulta los comandos del [README](../README.md). El simulador PTY requiere Linux/macOS; es una prueba de software, no representa sensores ni valida soldaduras.
