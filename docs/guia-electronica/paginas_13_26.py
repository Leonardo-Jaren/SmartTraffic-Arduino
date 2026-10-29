"""Cableado completo, puesta en marcha, web, diagnóstico y límites reales."""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

from pdf_estilo import ANCHO, MARGEN, VERDE, TINTA, GRIS, ROJO, AZUL


PINES = [
    (1, 1, "Rojo", "D2"), (1, 1, "Amarillo", "D3"), (1, 1, "Verde", "D4"),
    (2, 2, "Rojo", "D5"), (2, 2, "Amarillo", "D6"), (2, 2, "Verde", "D7"),
    (3, 3, "Rojo", "D8"), (3, 3, "Amarillo", "D9"), (3, 3, "Verde", "D10"),
    (4, 4, "Rojo", "D11"), (4, 4, "Amarillo", "D12"), (4, 4, "Verde", "D13"),
    (5, 5, "Rojo", "A0"), (5, 5, "Amarillo", "A1"), (5, 5, "Verde", "A2"),
    (6, 6, "Rojo", "A3"), (6, 6, "Amarillo", "A4"), (6, 6, "Verde", "A5"),
]
COLOR_CABLE = {"Rojo": "Rojo", "Amarillo": "Amarillo", "Verde": "Verde"}


def filas_cableado(desde, hasta):
    return [(f"S{s} / I{i}", luz, f"Ánodo (+) del LED {luz.lower()}", pin,
             COLOR_CABLE[luz], "Cátodo (−) → 2,2 kΩ propio → GND común")
            for s, i, luz, pin in PINES if desde <= s <= hasta]


def pagina_13_26(g):
    y = g.pagina("E · Primer semáforo", "S1 completo: señal y retorno", "Este ejemplo repite el circuito que usarás en las seis unidades.")
    y = g.imagen("circuito_s1.png", MARGEN, y, ANCHO - 2 * MARGEN, 340)
    filas = [
        ("S1", "Rojo", "Ánodo LED rojo", "D2", "Rojo", "Cátodo → R 2,2 kΩ → GND"),
        ("S1", "Amarillo", "Ánodo LED amarillo", "D3", "Amarillo", "Cátodo → R 2,2 kΩ → GND"),
        ("S1", "Verde", "Ánodo LED verde", "D4", "Verde", "Cátodo → R 2,2 kΩ → GND"),
        ("S1", "Retorno", "Extremo libre de las 3 R", "GND UNO", "Negro", "Cada LED conserva su resistor propio"),
    ]
    y = g.tabla(MARGEN, y - 10, [44, 62, 113, 61, 70, 169],
                ["S", "Luz", "Sale de", "Llega a", "Cable", "Retorno"], filas, tam=7.1)
    g.texto(MARGEN, y - 17,
            "Comprueba cada etiqueta antes de soldar el otro extremo a la placa. El color del conductor identifica la señal, no el número del pin.",
            tam=8.6)
    g.nueva()

    y = g.pagina("F · Repetir el montaje", "Tabla de conexiones · S1, S2 y S3", "Las patas largas de los LEDs llegan a los pines indicados; cada cátodo tiene su resistor.")
    y = g.tabla(MARGEN, y, [48, 58, 125, 55, 61, 172],
                ["Semáforo", "Luz", "Sale de", "Llega a", "Color", "Retorno del cátodo (−)"],
                filas_cableado(1, 3), tam=7.4, primera_negrita=True)
    y -= 26
    g.lista(MARGEN + 4, y, [
        "S1 repite el ejemplo de la página anterior; S2 y S3 usan su propia terna de pines.",
        "Para cada fila, suelda el cable de color al ánodo. La columna Retorno describe una segunda ruta desde el cátodo a través de una resistencia propia.",
        "No conectes los 9 LEDs de este grupo a la vez: son salidas separadas y el firmware las gobierna por fase.",
    ], tam=8.8)
    g.nueva()

    y = g.pagina("F · Repetir el montaje", "Tabla de conexiones · S4, S5 y S6", "Los pines analógicos se usan como digitales; D0 y D1 siguen reservados al USB serial.")
    y = g.tabla(MARGEN, y, [48, 58, 125, 55, 61, 172],
                ["Semáforo", "Luz", "Sale de", "Llega a", "Color", "Retorno del cátodo (−)"],
                filas_cableado(4, 6), tam=7.4, primera_negrita=True)
    y -= 24
    g.lista(MARGEN + 4, y, [
        "S4 usa D11, D12 y D13. D13 comparte función con el LED indicador integrado del UNO.",
        "S5 usa A0–A2 y S6 usa A3–A5; en Arduino IDE se llaman A0…A5 aunque funcionen como digitales.",
        "Hay 18 salidas físicas en total y ninguna sobra para sensores. Los vehículos y cierres de la aplicación son simulación.",
    ], tam=8.8)
    g.nueva()

    y = g.pagina("F · Ordenar el mazo", "Agrupa y etiqueta los cables", "La posición física exacta del Arduino en la base depende de tu maqueta.")
    y = g.imagen("agrupacion_pines.png", MARGEN, y, ANCHO - 2 * MARGEN, 300)
    y = g.titulo_bloque(MARGEN, y - 6, "Etiqueta cada punta con semáforo, luz y pin")
    filas = [
        ("S1-R / D2", "Rojo S1", "cable rojo"), ("S2-A / D6", "Amarillo S2", "cable amarillo"),
        ("S4-V / D13", "Verde S4", "cable verde"), ("S5-R / A0", "Rojo S5", "cable rojo"),
        ("S6-V / A5", "Verde S6", "cable verde"), ("TODOS-GND", "Retornos después de resistores", "negro"),
    ]
    g.tabla(MARGEN, y, [150, 205, 164], ["Etiqueta ejemplo", "Identifica", "Color conductor"], filas, tam=7.8)
    g.texto(MARGEN, 73, "Sujeta los mazos al tablero con una abrazadera o fijación aislante; deja un pequeño alivio de tensión en cada semáforo.", tam=8.3)
    g.nueva()

    y = g.pagina("G · Antes de encender", "Lista de comprobación eléctrica", "Haz cualquier modificación con la alimentación desconectada.")
    g.casillas(MARGEN + 4, y, [
        "Hay 18 LEDs individuales de dos patas, colocados rojo/amarillo/verde.",
        "Cada ánodo está en el pin asignado por la tabla; cada cátodo tiene una resistencia de 2,2 kΩ.",
        "Ningún resistor se comparte entre LEDs. Solo los extremos posteriores de los resistores se unen a GND.",
        "Todos los empalmes están aislados; no queda cobre de señales tocando otro cable o la base metálica.",
        "El cable negro de retorno termina en un pin GND del UNO. No se conectó por error a 5V.",
        "El condensador cerámico 100 nF, si se instala, va entre 5V y GND y no tiene polaridad.",
        "No hay cortocircuito entre las señales y GND. Con multímetro, revisa continuidad y valor de resistencias con el USB quitado.",
        "El cable USB alimentará solo el UNO y los LEDs de baja corriente descritos; no hay tiras ni lámparas de potencia.",
        "D0/RX y D1/TX no se usaron para las luces. La serigrafía de la placa coincide con el pin de cada etiqueta.",
        "El firmware aún tiene MAPA_CONFIRMADO=false durante la revisión inicial.",
    ], tam=8.6)
    g.tarjeta(MARGEN, 198, ANCHO - 2 * MARGEN,
              "Si una soldadura está mal", "No la corrijas con el Arduino conectado. Desconecta el USB, deja enfriar el cautín, corrige, aísla y vuelve a revisar con multímetro.", color=ROJO, tam=8.7)
    g.nueva()

    y = g.pagina("H · Cargar y comprobar", "Cargar el programa del proyecto", "Código fuente: arduino/SmartTraffic/SmartTraffic.ino. El apéndice de este PDF copia el mismo archivo.")
    g.lista(MARGEN + 4, y, [
        "Instala Arduino IDE y conecta el UNO con un cable USB de datos. Comprueba que el sistema operativo detecte el puerto.",
        "En Arduino IDE, abre el archivo SmartTraffic.ino y selecciona Herramientas → Placa → Arduino AVR Boards → Arduino Uno.",
        "Selecciona Herramientas → Puerto y el puerto recién conectado. Si no aparece, revisa cable, conector y controlador USB-serial de la placa.",
        "Pulsa Verificar para compilar. Luego pulsa Subir y espera el mensaje de carga completada.",
        "Con MAPA_CONFIRMADO=false, las seis luces rojas se encienden y la secuencia automática permanece bloqueada.",
        "Abre el Monitor serie a 115200 baudios, con final de línea Nueva línea. Debe aparecer INICIO,1 y estados BLOQUEADO.",
        "Cierra el Monitor serie antes de abrir el puente del sistema web; el puerto serial admite un solo programa a la vez.",
    ], tam=9.0)
    g.tarjeta(MARGEN, 237, ANCHO - 2 * MARGEN,
              "No habilites aún la secuencia", "MAPA_CONFIRMADO está desactivado intencionalmente. Prueba los 18 LEDs y revisa en la maqueta que S1–S6 correspondan a I1–I6 antes de activarlo.", color=ROJO, tam=8.7)
    g.nueva()

    y = g.pagina("H · Prueba de LEDs", "Probar cada color por separado", "El comando dura 2 segundos; envía una línea por vez en el Monitor serie.")
    g.tarjeta(MARGEN, y, ANCHO - 2 * MARGEN,
              "Formato del comando", "TEST,<número de semáforo>,<color>  ·  color: R (rojo), A (amarillo), V (verde). Ejemplo: TEST,1,R", tam=9)
    y -= 105
    filas = [(f"S{i}", f"TEST,{i},R  ·  TEST,{i},A  ·  TEST,{i},V", f"I{i} · {pin}")
             for i, pin in enumerate(["D2–D4", "D5–D7", "D8–D10", "D11–D13", "A0–A2", "A3–A5"], 1)]
    y = g.tabla(MARGEN, y, [66, 300, 153], ["Unidad", "Escribe en líneas separadas", "Cruce / pines"], filas, tam=7.8)
    y -= 22
    g.lista(MARGEN + 4, y, [
        "Para cada S, envía primero R, espera dos segundos y confirma el rojo; repite con A y luego V.",
        "Durante la prueba, los semáforos no seleccionados quedan en rojo. Deja la maqueta inmóvil y libre de vehículos.",
        "Si se enciende otro color, comprueba el cable y pin con la tabla. Desconecta el USB antes de cambiar soldaduras.",
        "Cuando termines, el firmware vuelve a rojo bloqueado. Repite cualquier prueba que no sea clara.",
    ], tam=8.8)
    g.nueva()

    y = g.pagina("H · Activar el mapa físico", "Habilitar la secuencia solo después de verificar", "Este paso activa seis salidas físicas a la vez según el eje horizontal.")
    g.lista(MARGEN + 4, y, [
        "Confirma que cada semáforo está en el cruce propuesto: S1→I1, S2→I2, S3→I3, S4→I4, S5→I5, S6→I6.",
        "Orienta las caras hacia los vehículos que usan las vías horizontales. En la vía perpendicular instala una señal de ceda el paso.",
        "Revisa que las flechas de la maqueta siguen las direcciones confirmadas: horizontal superior ←, horizontal inferior →; verticales ↑, ↓, ↑.",
        "En el código, cambia const bool MAPA_CONFIRMADO = false; a true. Mantén VIA_SIN_SEMAFORO_CEDE = true.",
        "Verifica CRUCE = {1,2,3,4,5,6} y EJE = {'H','H','H','H','H','H'}. Si cambias la orientación de un semáforo, revisa su EJE y la seguridad del cruce.",
        "Vuelve a cargar el sketch. El ciclo concede más verde a la horizontal y usa amarillo y todo-rojo antes de cambiar de eje.",
        "Como los seis EJE son H, en la fase secundaria V no se enciende ninguna luz: los seis semáforos quedan rojos. El ceda es una señal pasiva, no un verde controlado por el Arduino.",
    ], tam=9.0)
    g.tarjeta(MARGEN, 236, ANCHO - 2 * MARGEN,
              "No cambies esta constante por probar", "Si todavía no has confirmado montaje, dirección de cada cara y señales de ceda, deja MAPA_CONFIRMADO=false: todos quedarán en rojo.", color=ROJO, tam=8.8)
    g.nueva()

    y = g.pagina("H · Integración con la web", "Conectar el UNO a SmartTraffic", "El USB se lee con un puente serial local; un servidor remoto no puede acceder al puerto de tu computadora.")
    y = g.imagen("secuencia_usb.png", MARGEN, y, ANCHO - 2 * MARGEN, 206)
    g.texto(MARGEN, y - 5, "Desde la raíz del repositorio, abre tres terminales en la misma computadora y ejecuta:", tam=9.0, negrita=True)
    y -= 27
    comandos = [
        ("1 · Backend", "cd backend\n./env/bin/python manage.py migrate\n./env/bin/python manage.py runserver 127.0.0.1:8000"),
        ("2 · Puente USB", "cd backend\n./env/bin/python manage.py puente_serial --listar\n./env/bin/python manage.py puente_serial --puerto /dev/ttyACM0"),
        ("3 · Frontend", "cd frontend\nnpm install\nnpm run dev -- --host 127.0.0.1"),
    ]
    for titulo, bloque in comandos:
        y = g.titulo_bloque(MARGEN, y - 8, titulo)
        g.pdf.setFillColor(colors.HexColor("#E8EFEB"))
        lineas = bloque.splitlines()
        alto = len(lineas) * 12 + 13
        g.pdf.roundRect(MARGEN, y - alto + 5, ANCHO - 2 * MARGEN, alto, 5, fill=1, stroke=0)
        g.pdf.setFillColor(TINTA)
        g.pdf.setFont("Mono", 7.4)
        for k, linea in enumerate(lineas):
            g.pdf.drawString(MARGEN + 10, y - 7 - k * 12, linea)
        y -= alto + 7
    g.texto(MARGEN, y - 2,
        "En macOS el puerto suele ser /dev/cu.usbmodem…; en Windows, COM3 (reemplaza el ejemplo). En Windows usa env\\Scripts\\python.exe si creaste allí el entorno virtual. Vite abre http://127.0.0.1:5173. Cierra el Monitor serie antes de iniciar el puente.",
            tam=8.1)
    g.nueva()

    y = g.pagina("H · Confirmación de datos", "Qué ver en la aplicación", "La interfaz diferencia estados confirmados por Arduino de valores que solo pertenecen a la simulación.")
    y = g.lista(MARGEN + 4, y, [
        "Si el puente abre el puerto, Django recibe ESTADO y la web marca la fuente Arduino. La API de estado es /api/dispositivo/.",
        "Mientras MAPA_CONFIRMADO=false, el dispositivo informa BLOQUEADO. La comunicación funciona, pero la secuencia física no arranca.",
        "Con EJE={H,H,H,H,H,H}, las seis luces horizontales comparten verde/amarillo. En la fase reservada a V las seis permanecen rojas; no existe un verde físico para la vía secundaria.",
        "Si no llegan mensajes durante 4 s, Django marca desconexión y la interfaz limpia los datos viejos; no muestra colores antiguos como actuales.",
        "El reporte serial refleja lo que ordena el programa; no mide ópticamente el LED ni comprueba el cableado.",
        "Los vehículos, cierres y velocidad del panel son simulados. Sin sensores físicos, el tráfico simulado no modifica el Arduino automáticamente.",
    ], tam=9)
    y -= 8
    filas = [
        ("Solicitud web", "CONFIG,17,30,15,3,2"),
        ("Respuesta aplicada", "ACK,17,APLICADO,OK"),
        ("Respuesta rechazada", "ACK,17,RECHAZADO,VALORES"),
    ]
    g.tabla(MARGEN, y, [165, 354], ["Acción", "Mensaje serial"], filas, tam=8.2)
    g.texto(MARGEN, 157, "La configuración se considera aplicada en la web después del ACK del firmware. Con el mapa bloqueado, el ACK no arranca el ciclo.", tam=8.4, color=ROJO)
    g.nueva()

    y = g.pagina("I · Solución de problemas", "Fallos de luces y cableado", "Desconecta USB antes de tocar conductores o rehacer una soldadura.")
    filas = [
        ("Un LED no enciende", "Polaridad invertida, resistor/empalme abierto, pin equivocado o soldadura fría.", "Desconecta USB; revisa ánodo, cátodo, resistor y etiqueta. Prueba ese LED con TEST,s,color."),
        ("Se enciende otro color", "Los cables de señal intercambiaron D2/D3/D4 (o la terna de otro S).", "Sigue el rótulo desde el ánodo al pin de la tabla. Corrige sin alimentación y repite el test."),
        ("No funciona todo un semáforo", "Retorno GND abierto, cuatro cables sin continuidad o S conectado a otra terna.", "Mide los tres caminos y el bus común; confirma que el cable negro llega a GND del UNO."),
        ("Varias señales inesperadas", "Etiquetas repetidas, retornos unidos antes de resistores o cruce de mazos.", "Revisa que cada LED tenga su resistor y que S1–S6 usen grupos distintos de tres pines."),
    ]
    g.tabla(MARGEN, y, [108, 183, 228], ["Síntoma", "Causa posible", "Qué comprobar"], filas, tam=7.0)
    g.texto(MARGEN, 84, "Si huele a quemado, un pin se calienta o ves un cable pelado, desconecta USB de inmediato y no continúes hasta corregir la causa.", tam=8.4, color=ROJO)
    g.nueva()

    y = g.pagina("I · Solución de problemas", "Fallos de USB, carga o aplicación", "Comprueba primero que solo haya un programa abierto sobre el puerto serial.")
    filas = [
        ("La PC no ve el UNO", "Cable USB solo de carga, puerto físico o controlador USB-serial.", "Prueba cable de datos y otro puerto; revisa Administrador de dispositivos o lista de puertos del IDE."),
        ("Arduino IDE no carga", "Placa/puerto incorrectos, cable o puerto ocupado por Monitor serie/puente.", "Cierra los otros programas seriales, selecciona Arduino Uno y el puerto correcto, compila y sube otra vez."),
        ("La página no recibe datos", "Puente no iniciado, puerto equivocado o Django no está activo.", "Ejecuta --listar, inicia puente_serial, revisa la terminal del backend y visita /api/dispositivo/."),
        ("Tiempo no aplicado", "Mapa bloqueado, valor fuera de rango, puerto desconectado o rechazo/timeout.", "Lee el aviso y ACK; revisa principal 15–120 s, secundaria 10–90 s y principal > secundaria."),
    ]
    y = g.tabla(MARGEN, y, [108, 183, 228], ["Síntoma", "Causa posible", "Qué comprobar"], filas, tam=7.0)
    y -= 25
    g.lista(MARGEN + 4, y, [
        "Amarillo permitido: 3–10 s. Intervalo todo-rojo: 2–10 s.",
        "El puerto puede ser /dev/ttyACM0 en Linux, /dev/cu.usbmodem… en macOS o COM3 en Windows.",
        "El Monitor serie, Arduino IDE y el puente no pueden compartir simultáneamente el mismo puerto.",
    ], tam=8.6)
    g.nueva()

    y = g.pagina("Revisión y límites", "Qué se verificó y qué falta probar", "Esta guía se basó en el firmware y las tablas que están dentro del repositorio.")
    g.titulo_bloque(MARGEN, y, "Verificado en el código y la documentación")
    y = g.lista(MARGEN + 4, y - 19, [
        "18 salidas directas, orden rojo/amarillo/verde, D0/D1 reservados y pines exactos S1–S6.",
        "Retorno individual a través de 18 resistencias, común GND, USB serial a 115200 y protocolo INICIO/ESTADO/CONFIG/ACK/TEST.",
        "Inicio bloqueado con todos los rojos y la constante MAPA_CONFIRMADO=false; tests automatizados de protocolo/firmware ya descritos en docs/PRUEBAS.md.",
    ], tam=8.8)
    g.titulo_bloque(MARGEN, y - 5, "Suposiciones o pruebas físicas pendientes", color=ROJO)
    y = g.lista(MARGEN + 4, y - 23, [
        "Las fotografías muestran puntos de ubicación, pero no confirman la cara exacta de cada semáforo. La guía propone una luz por cruce mirando a la horizontal; confirma esto en la maqueta.",
        "No se proporcionó la hoja de datos ni una foto de tus LEDs/resistencias. El cálculo con Vf es un ejemplo; verifica que tus LEDs sean indicadores de baja corriente de dos patas y confirma 2,2 kΩ.",
        "No hubo Arduino conectado ni se midieron corrientes, soldaduras, caída de tensión, brillo, detección de puerto o ACK con hardware real.",
        "Durante la fase secundaria del programa, las salidas quedan en rojo porque los seis semáforos están asignados al eje H; no hay una luz verde vertical física.",
        "El firmware se compiló y probó en entorno simulado/documentado; las fotos de circuito y el mapa no son una inspección física de tu placa.",
    ], tam=8.6)
    g.tarjeta(MARGEN, 132, ANCHO - 2 * MARGEN,
              "Dibujo de portada e imágenes", "La portada fue generada como ilustración basada en la maqueta. Los pines y rutas eléctricas se dibujaron como esquemas vectoriales y se cotejaron con el firmware; no se usan imágenes generadas para afirmar conexiones.", tam=8.4)
    g.nueva()
