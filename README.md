# SmartTraffic Arduino

Sistema educativo para explorar una maqueta de seis intersecciones, simular vehículos y consultar un Arduino UNO por USB. El frontend usa Vue 3, Vite y Three.js; la API y el puente local usan Django REST Framework y pySerial.

La maqueta física mide **160 cm de ancho × 120 cm de fondo** según indicó el usuario; el tablero 3D se ajusta a ese tamaño. La distribución interna es una **aproximación** basada en el croquis. Las direcciones H1 ←, H2 →, V1 ↑, V2 ↓ y V3 ↑ fueron confirmadas. La escena base tiene exactamente seis semáforos fijos, uno por cruce, en los puntos y mirando en los sentidos marcados: S1→I1 al sur, S2→I2 al este, S3→I3 al sur, S4→I4 al oeste, S5→I5 al norte y S6→I6 al oeste. La simulación aplica la fase del eje observado en cada luz. El mapa eléctrico del Arduino no está confirmado y el sketch arranca en rojo hasta revisar el cableado.

## Requisitos

- Python 3.12 o superior compatible con las versiones de `backend/requirements.txt`.
- Node.js `^22.18.0` o `>=24.12.0`, npm y un navegador con WebGL.
- Para USB: Arduino UNO R3, cable USB de datos y permiso para acceder al puerto. Django y el puente deben ejecutarse en la computadora que tiene el Arduino conectado.

## Instalar y ejecutar

En una terminal, desde la raíz del repositorio:

```bash
cd backend
python3 -m venv env
./env/bin/python -m pip install -r requirements.txt
./env/bin/python manage.py migrate
./env/bin/python manage.py runserver 127.0.0.1:8000
```

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abre la dirección local que Vite imprime en su terminal. En Windows sustituye `./env/bin/python` por `env\Scripts\python.exe`. Vite envía las peticiones `/api` a Django mediante su proxy de desarrollo. La API no tiene autenticación: esta configuración es **solo para desarrollo local** y no debe exponerse a Internet.

## Sin Arduino

Selecciona **Simulación**. Puedes pausar, reiniciar, ocultar vehículos, variar cantidad y velocidad, seleccionar y cerrar un tramo, seleccionar un cruce y añadir luces virtuales. Los vehículos buscan otra ruta o salida y, si no existe, esperan; un vehículo que ya está en un tramo cerrado se detiene. La tabla de intersecciones muestra fases virtuales H/V, no el estado físico de S1–S6.

Los autos frenan con el frente detrás de la línea, mantienen espacio en las colas y esperan antes de entrar si no hay lugar para salir del cruce. Un vehículo que ya recibió paso termina de despejarlo aunque cambie la fase. Las calles conservan un color neutro salvo selección o cierre; los colores de paso se muestran en las luces. Los accesos perpendiculares sin luz física tienen señales visuales de ceda el paso; la simulación sigue reservando fases H/V para evitar movimientos incompatibles.

Usa **Pantalla completa** sobre la maqueta para ampliar la vista y conservar los controles de simulación y selección. Puedes volver con el botón de salida o con Escape. Si el navegador no permite la pantalla completa nativa, la vista se amplía dentro de la ventana.

Selecciona S1–S6 en el modelo o en su tarjeta para cambiar su esquina dentro del cruce y girarlo en pasos de 90°. La distribución visual se guarda en este navegador y puede restaurarse. Estos movimientos no cambian el cruce asignado, el eje de simulación ni los pines del Arduino. Un traslado a otro cruce requiere revisar también esa asignación lógica y el montaje físico.

La escala de cálculo es **1 unidad 3D = 5 metros simulados**. Por ejemplo, a 30 km/h se recorren 8,33 m/s, es decir 1,67 unidades 3D/s. Esta conversión de velocidad es independiente del tamaño visual del tablero de 160 × 120 cm. Los desfases horizontales usan 30 km/h como velocidad objetivo virtual; no se ha validado una ola verde física.

## Conectar un Arduino por USB

1. Sigue [electrónica y conexiones](docs/ELECTRONICA.md) y [código Arduino](docs/CODIGO_ARDUINO.md). El sketch arranca en rojo mientras `MAPA_CONFIRMADO` sea `false`.
2. Conecta el UNO a la **misma computadora que ejecuta Django**. Cierra el monitor serial del IDE antes de abrir el puente.
3. En otra terminal del backend ejecuta:

```bash
./env/bin/python manage.py puente_serial --listar
./env/bin/python manage.py puente_serial --puerto /dev/ttyACM0
```

Reemplaza el puerto por el que aparezca en tu equipo, por ejemplo `COM3` en Windows. Selecciona **Dispositivo** en la web: solo se muestran colores informados recientemente por el dispositivo. Un cambio de tiempos queda pendiente hasta recibir `ACK, …, APLICADO`.

Para probar el puente sin hardware en Linux/macOS, ejecuta `./env/bin/python scripts/simulador_arduino.py`, toma el puerto `/dev/pts/...` que muestra y pásalo a `puente_serial --puerto`. La interfaz lo identifica como **simulador serial**, no como Arduino físico.

## Pruebas

```bash
cd backend && ./env/bin/python manage.py test trafico.tests
cd ../frontend && npm test && npm run build
npx playwright install chromium   # una vez, para las pruebas de navegador
npm run test:e2e
cd .. && python3 arduino/tests/test_firmware.py
```

Las pruebas de navegador reutilizan Django y Vite si ya están funcionando localmente, o los arrancan si faltan; en CI necesitan los puertos libres. Se puede indicar un Chromium ya instalado con `CHROMIUM_PATH=/ruta/a/chromium npm run test:e2e`. Los resultados y límites están en [pruebas](docs/PRUEBAS.md).

## Documentación

- [Análisis de la maqueta y mapa](docs/ANALISIS_MAQUETA.md)
- [Electrónica y tabla de conexiones](docs/ELECTRONICA.md)
- [Guía visual PDF para soldar y conectar los seis semáforos](docs/GUIA_VISUAL_CONEXIONES_ARDUINO.pdf)
- [Código completo para Arduino IDE](docs/CODIGO_ARDUINO.md)
- [Arquitectura, protocolo y modos](docs/ARQUITECTURA.md)
- [Pruebas y limitaciones](docs/PRUEBAS.md)

La guía PDF conserva las orientaciones del diseño anterior con todos los ejes H. Para la posición y la cara actuales de cada semáforo usa [el mapa actualizado](docs/ANALISIS_MAQUETA.md); la correspondencia física de los pines sigue pendiente de comprobación.

El modelo es procedural en Three.js, con tramos y cruces seleccionables; no se exportó un GLB. La comunicación Wi-Fi con ESP32 es una arquitectura futura, no una funcionalidad implementada.
