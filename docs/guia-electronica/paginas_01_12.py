"""Portada, análisis, componentes y armado del primer semáforo."""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

from pdf_estilo import ANCHO, ALTO, MARGEN, VERDE, TINTA, GRIS, ROJO, VERDE_OSCURO


def portada(g):
    p = g.pdf
    p.setFillColor(colors.HexColor("#F3F8F5"))
    p.rect(0, 0, ANCHO, ALTO, fill=1, stroke=0)
    p.setFillColor(VERDE_OSCURO)
    p.rect(0, ALTO - 175, ANCHO, 175, fill=1, stroke=0)
    p.setFillColor(colors.HexColor("#D8F1E6"))
    p.setFont("Sans-Bold", 9)
    p.drawString(MARGEN, ALTO - 46, "SMARTTRAFFIC  ·  GUÍA DIDÁCTICA DE ELECTRÓNICA")
    p.setFillColor(colors.white)
    p.setFont("Sans-Bold", 24)
    p.drawString(MARGEN, ALTO - 87, "Seis semáforos")
    p.drawString(MARGEN, ALTO - 119, "con Arduino UNO R3")
    p.setFont("Sans", 11)
    p.drawString(MARGEN, ALTO - 151, "Cableado soldado paso a paso · 18 LEDs individuales · comunicación USB")
    y = g.imagen("portada_maqueta.png", MARGEN, ALTO - 195, ANCHO - 2 * MARGEN, 355)
    p.setFillColor(colors.white)
    p.setStrokeColor(colors.HexColor("#D5E4DD"))
    p.roundRect(MARGEN, 74, ANCHO - 2 * MARGEN, 94, 10, fill=1, stroke=1)
    p.setFillColor(VERDE)
    p.setFont("Sans-Bold", 12)
    p.drawString(MARGEN + 18, 144, "Circuito implementado en el repositorio")
    p.setFillColor(TINTA)
    p.setFont("Sans", 9.5)
    for i, linea in enumerate([
        "18 salidas directas · 18 resistencias de 2,2 kΩ · GND común",
        "Sin protoboard, sin 74HC595 y sin transistores para LEDs indicadores",
        "El dibujo de portada es ilustrativo; las páginas siguientes fijan cada pin y retorno.",
    ]):
        p.drawString(MARGEN + 18, 123 - i * 15, linea)
    p.setFillColor(GRIS)
    p.setFont("Sans", 8)
    p.drawString(MARGEN, 50, "SmartTraffic · Material didáctico · Antes de soldar, desconecta el USB.")
    p.drawRightString(ANCHO - MARGEN, 50, "2026")
    g.numero += 1


def pagina_01_12(g):
    portada(g)
    g.nueva()

    y = g.pagina("A · Vista general", "Qué vas a construir", "El proyecto conecta la maqueta física, el Arduino y el panel web.")
    y = g.imagen("mapa_sistema.png", MARGEN, y, ANCHO - 2 * MARGEN, 320)
    g.lista(MARGEN + 6, y - 18, [
        "Cada semáforo usa tres LEDs individuales: rojo, amarillo y verde.",
        "Un cable por ánodo lleva la señal desde un pin; los tres cátodos regresan por resistencias separadas a un GND común.",
        "La placa se alimenta por USB. La aplicación lee su puerto mediante un puente serial local en la misma computadora.",
        "Ruta general propuesta: llevar cada mazo por debajo de la base y por el borde hasta el Arduino. La longitud y fijación dependen de tu maqueta.",
    ], tam=9.0)
    g.tarjeta(MARGEN, 156, ANCHO - 2 * MARGEN,
              "Asignación física propuesta (debe verificarse al instalar)",
              "S1→I1, S2→I2, S3→I3, S4→I4, S5→I5 y S6→I6. Los seis controlan las vías horizontales principales; las verticales llevan ceda el paso.", tam=8.7)
    g.nueva()

    y = g.pagina("B · Materiales", "Lista de piezas y herramientas", "Las cantidades son para seis semáforos de tres LEDs cada uno.")
    filas = [
        ("1", "Arduino UNO R3", "Seis digitales D2–D13 y seis analógicos A0–A5 usados como salidas."),
        ("6", "LED rojo individual, 2 patas", "Uno por semáforo; comprobar polaridad y hoja de datos."),
        ("6", "LED amarillo individual, 2 patas", "Uno por semáforo; no usar módulo RGB común."),
        ("6", "LED verde individual, 2 patas", "Uno por semáforo; brillo depende de Vf."),
        ("18", "Resistencia 2,2 kΩ, ¼ W", "Una resistencia en serie por cada LED."),
        ("18 + bus", "Cable flexible de señal y cable negro de retorno", "Rojo, amarillo y verde por S1–S6; negro para GND común. Etiquetas en ambos extremos."),
        ("1", "Cable USB de datos compatible", "Alimenta el UNO y ofrece comunicación serial; no usar cable solo de carga."),
        ("1", "Condensador cerámico 100 nF (104)", "Recomendado cerca del mazo entre 5V y GND; no tiene polaridad."),
        ("1", "Cautín, soporte y estaño", "Trabaja ventilado y sobre superficie resistente al calor."),
        ("Varios", "Termorretráctil, cortacables, etiquetas y multímetro", "Aislar soldaduras, recortar patas, marcar cables y revisar continuidad."),
    ]
    g.tabla(MARGEN, y, [38, 177, ANCHO - 2 * MARGEN - 215],
            ["Cant.", "Material", "Uso"], filas, tam=7.4, primera_negrita=True)
    y2 = 162
    g.tarjeta(MARGEN, y2, ANCHO - 2 * MARGEN,
              "Piezas que no lleva este circuito",
              "El firmware no usa 74HC595, transistores ni una fuente externa para LEDs indicadores. No compres esos componentes para este cableado.", color=ROJO, tam=8.5)
    g.nueva()

    y = g.pagina("B · Diseño eléctrico", "Por qué el UNO alcanza", "La tabla del firmware y el circuito descrito en ELECTRONICA.md coinciden.")
    y = g.lista(MARGEN + 5, y, [
        "6 semáforos × 3 luces = 18 salidas. El UNO tiene 20 pines que pueden actuar como digitales; D0/RX y D1/TX se reservan para USB serial.",
        "Quedan exactamente D2–D13 (12 pines) y A0–A5 (6 pines). El programa los configura como OUTPUT; no se deja una salida física libre.",
        "Cada pin alimenta solo un LED indicador de baja corriente a través de su resistencia. El retorno termina en GND del mismo UNO.",
        "Los 74HC595 no forman parte del montaje final. Harían falta si se añadieran luces físicas, pero cambiarían cableado y firmware.",
        "El LED de D13 puede hacer que también se encienda el indicador integrado de la placa cuando S4 está verde o rojo.",
    ], tam=9.2)
    y = g.tarjeta(MARGEN, y - 8, ANCHO - 2 * MARGEN,
              "Alimentación elegida", "USB de la computadora → placa UNO → pines digitales → LEDs y resistencias → GND. El condensador cerámico 100 nF va entre 5V y GND, cerca del mazo; no conecta LEDs directamente a 5V.", tam=9)
    y = g.titulo_bloque(MARGEN, y - 24, "No uses la maqueta como señal vial real", color=ROJO)
    g.texto(MARGEN, y, "El arranque puede tener un instante con salidas apagadas. Este diseño sirve para una maqueta educativa, no para dirigir tráfico real.", tam=9.5, color=TINTA)
    g.nueva()

    y = g.pagina("C · Reconocer componentes", "Ánodo, cátodo y resistencia", "Las patas largas ayudan si aún no se recortaron; después revisa la forma del LED.")
    y = g.imagen("polaridad_componentes.png", MARGEN, y, ANCHO - 2 * MARGEN, 310)
    g.lista(MARGEN + 6, y - 15, [
        "Ánodo (+): normalmente pata larga y electrodo interno más pequeño. Va al cable de señal del Arduino.",
        "Cátodo (−): normalmente pata corta y lado plano del cuerpo. Va a una resistencia propia de 2,2 kΩ y luego a GND.",
        "La resistencia no tiene polaridad. En una de 4 bandas y 5 %: rojo-rojo-rojo-dorado indica 2,2 kΩ.",
        "Si el LED tiene marcas distintas, está recortado o es un módulo RGB, confirma su hoja de datos antes de soldar.",
    ], tam=9.2)
    g.nueva()

    y = g.pagina("B · Cálculo", "Por qué proponemos 2,2 kΩ", "Sin la ficha de tus LEDs no se puede afirmar su caída de tensión exacta.")
    g.tarjeta(MARGEN, y, ANCHO - 2 * MARGEN,
              "Fórmula de un LED en serie", "R = (Vfuente − Vf del LED) / I. Ejemplo rojo: (5−2)/2200 ≈ 1,36 mA. Potencia: P≈I²R≈4 mW, por debajo de una resistencia común de ¼ W.", tam=9.2)
    y -= 122
    filas = [
        ("Rojo · Vf ejemplo 2,0 V", "(5−2,0)/2200", "1,36 mA"),
        ("Amarillo · Vf ejemplo 2,1 V", "(5−2,1)/2200", "1,32 mA"),
        ("Verde · Vf ejemplo 2,2 V", "(5−2,2)/2200", "1,27 mA"),
    ]
    y = g.tabla(MARGEN, y, [205, 185, 90], ["Ejemplo, no medido", "Cálculo", "Corriente"], filas, tam=8.1)
    g.lista(MARGEN + 5, y - 22, [
        "Estas corrientes son bajas y reducen la carga; el brillo depende de cada LED. 2,2 kΩ, ¼ W es la elección conservadora descrita en el proyecto.",
        "20 mA es una corriente de trabajo recomendada máxima por pin en el UNO, no una meta. 40 mA es un límite absoluto del microcontrolador: no diseñes para acercarte.",
        "Con seis LEDs encendidos a la vez y alrededor de 1,3 mA cada uno, la carga estimada es cerca de 8 mA, más el indicador integrado de D13.",
        "Sin ficha técnica no se puede cerrar el cálculo del LED real: necesitas Vf y la corriente indicada. Si el brillo queda bajo, no reduzcas R sin esa ficha. No uses tiras ni LEDs de potencia directamente en los pines.",
    ], tam=8.7)
    g.nueva()

    y = g.pagina("C · Localizar los destinos", "Pines que aparecen en la tabla", "El dibujo agrupa conectores para que ubiques las etiquetas; no está a escala.")
    y = g.imagen("mapa_pines.png", MARGEN, y, ANCHO - 2 * MARGEN, 315)
    filas = [
        ("S1 / I1", "D2", "D3", "D4"),
        ("S2 / I2", "D5", "D6", "D7"),
        ("S3 / I3", "D8", "D9", "D10"),
        ("S4 / I4", "D11", "D12", "D13"),
        ("S5 / I5", "A0", "A1", "A2"),
        ("S6 / I6", "A3", "A4", "A5"),
    ]
    y = g.tabla(MARGEN, y - 7, [110, 105, 105, 105], ["Semáforo", "Rojo (+)", "Amarillo (+)", "Verde (+)"], filas, tam=8, primera_negrita=True)
    g.texto(MARGEN, y - 18,
            "D0/RX y D1/TX quedan para USB serial. A0–A5 funcionan como salidas digitales en el UNO R3. Cada destino de la tabla es el ánodo (+) del LED.",
            tam=8.5, ancho=ANCHO - 2 * MARGEN)
    g.nueva()

    y = g.pagina("D · Entender el circuito", "La ruta completa de una luz", "Ejemplo: rojo de S1. Las otras dos luces repiten la misma ruta con D3 y D4.")
    y = g.imagen("circuito_s1.png", MARGEN, y, ANCHO - 2 * MARGEN, 335)
    g.lista(MARGEN + 6, y - 15, [
        "Señal roja S1: pin D2 → cable rojo → ánodo largo del LED rojo.",
        "Desde el cátodo corto: resistencia individual 2,2 kΩ → cable/bus negro → pin GND del Arduino.",
        "S1 amarillo usa D3 y su propio resistor; S1 verde usa D4 y su propio resistor.",
        "El GND común se forma después de cada resistor. No compartas una resistencia entre LEDs ni unas los cátodos antes de ellas.",
    ], tam=9.0)
    g.nueva()

    y = g.pagina("D · Armar un semáforo", "Paso 1 · ordenar los tres LEDs", "Haz una sola unidad completa y pruébala antes de repetirla seis veces.")
    y = g.imagen("polaridad_componentes.png", MARGEN, y, ANCHO - 2 * MARGEN, 300)
    g.lista(MARGEN + 6, y - 16, [
        "Prepara un soporte con tres orificios en columna: rojo arriba, amarillo al medio y verde abajo.",
        "Inserta cada LED desde el frente y separa sus patas por detrás para que no se toquen.",
        "Antes de cortar, identifica ánodo y cátodo. Deja suficiente metal para soldar; no cortes al ras del encapsulado.",
        "Si ya no distingues las patas, usa la cara plana/estructura interna o el modo de diodo del multímetro. Marca A (+) y K (−) antes de seguir.",
    ], tam=9.0)
    g.tarjeta(MARGEN, 152, ANCHO - 2 * MARGEN,
              "Vista del frente", "Orden de colores: ROJO · AMARILLO · VERDE. La orientación de las patas se trabaja desde la parte trasera del soporte.", tam=8.8)
    g.nueva()

    y = g.pagina("D · Armar un semáforo", "Paso 2 · una resistencia en cada cátodo", "Haz las tres uniones con el cable USB desconectado.")
    y = g.imagen("pasos_soldadura.png", MARGEN, y, ANCHO - 2 * MARGEN, 325)
    g.lista(MARGEN + 6, y - 14, [
        "En el LED rojo, junta solo su pata corta/cátodo con una pata de una resistencia de 2,2 kΩ.",
        "Repite por separado con el LED amarillo y el verde. Obtendrás tres resistencias, una para cada LED.",
        "El otro extremo de cada resistencia todavía queda libre: luego se conectará al retorno común negro.",
        "Toca la unión con el cautín el tiempo mínimo necesario; deja enfriar antes de mover. No calientes el cuerpo plástico del LED.",
    ], tam=9.0)
    g.nueva()

    y = g.pagina("D · Armar un semáforo", "Paso 3 · llevar cada señal al ánodo", "Los tres cables de señal salen del Arduino y terminan en los ánodos largos.")
    filas = [
        ("LED rojo", "Ánodo (+)", "D2", "Rojo", "S1-R / D2"),
        ("LED amarillo", "Ánodo (+)", "D3", "Amarillo", "S1-A / D3"),
        ("LED verde", "Ánodo (+)", "D4", "Verde", "S1-V / D4"),
    ]
    y = g.tabla(MARGEN, y, [102, 96, 64, 88, 175],
                ["Luz", "Sale de", "Llega a", "Cable", "Etiqueta en ambos extremos"], filas, tam=8.1)
    y -= 26
    g.lista(MARGEN + 6, y, [
        "Suelda un cable rojo al ánodo del LED rojo; el extremo opuesto llegará al pin D2.",
        "Suelda un cable amarillo al ánodo del amarillo; el otro extremo llegará a D3.",
        "Suelda un cable verde al ánodo del verde; el otro extremo llegará a D4.",
        "Antes de cerrar el soporte, marca cada cable por color y por ambos extremos. No cruces señales aunque los cables compartan el mismo color entre semáforos.",
    ], tam=9.1)
    g.tarjeta(MARGEN, 160, ANCHO - 2 * MARGEN,
              "Recuento de cables de este semáforo", "Salen cuatro conductores: rojo, amarillo, verde y un negro de retorno común. Los retornos de los tres LEDs pasan antes por sus tres resistencias individuales.", tam=8.7)
    g.nueva()

    y = g.pagina("D · Armar un semáforo", "Paso 4 · formar el retorno GND", "La resistencia pertenece a su LED; solo el otro extremo comparte tierra.")
    y = g.imagen("circuito_s1.png", MARGEN, y, ANCHO - 2 * MARGEN, 325)
    g.lista(MARGEN + 6, y - 14, [
        "Suelda el extremo libre del resistor rojo a una zona expuesta del conductor negro común.",
        "Haz lo mismo con el resistor amarillo y luego con el verde. Cada rama debe conservar su resistencia.",
        "Desde ese conductor negro sale un solo cable hacia cualquiera de los pines GND del UNO.",
        "Aísla cada ramificación con tubo termorretráctil y fija el mazo al soporte para que un tirón no llegue a las patas del LED.",
    ], tam=9.0)
    g.tarjeta(MARGEN, 144, ANCHO - 2 * MARGEN,
              "Condensador de desacoplo", "El cerámico de 100 nF se conecta entre 5V y GND cerca de la distribución. No tiene polaridad; no reemplaza las resistencias.", tam=8.6)
    g.nueva()
