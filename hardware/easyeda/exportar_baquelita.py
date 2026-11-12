"""Verifica y exporta el cobre inferior del borrador UART para baquelita."""

import argparse
from itertools import combinations
from math import cos, radians, sin
from pathlib import Path
from xml.etree import ElementTree

from reportlab.lib.colors import HexColor, black
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from shapely.geometry import LineString, Point, box
from shapely.ops import polygonize, unary_union


BASE = Path(__file__).resolve().parent
PCB = BASE / "SmartTraffic_Shield_UNO_R3_Baquelita.brd"
REFERENCIA = BASE / "SmartTraffic_Shield_UNO_R3.brd"
ESQUEMA = BASE / "SmartTraffic_Shield_UNO_R3.sch"
PDF = BASE.parents[1] / "output" / "pdf" / "SmartTraffic_PCB_Baquelita_1_Cara_1a1.pdf"
ANCHO, ALTO = 68.58, 53.34
ORIGEN_X, ORIGEN_Y = (210 - ANCHO) / 2, 155
MARGEN_ATAQUE = 0.04
TOLERANCIA_TALADRO = 0.10
DIAMETRO_GUIA = 0.30

NETLIST = {
    "UNO_TX": {"J2.2", "U1.5"},
    "UNO_RX": {"J2.1", "U1.4"},
    "ESP_RX": {"J5.3", "U1.8"},
    "ESP_TX": {"J5.4", "U1.1"},
    "5V_UNO": {"J3.5", "U1.3", "C1.1", "JP1.1"},
    "3V3_ESP": {"J5.2", "U1.7", "C2.1"},
    "GND": {"J3.6", "J5.1", "U1.2", "C1.2", "C2.2", "R1.2"},
    "UART_OE": {"JP1.2", "U1.6", "R1.1"},
}


def comprobar(condicion, mensaje):
    if not condicion:
        raise ValueError(mensaje)


def punto(nodo, sufijo=""):
    return float(nodo.get("x" + sufijo)), float(nodo.get("y" + sufijo))


def centros_y_pads(placa):
    paquetes = {p.get("name"): p for p in placa.findall("libraries/library/packages/package")}
    pads, taladros = {}, {}
    for elemento in placa.findall("elements/element"):
        ref = elemento.get("name")
        x, y = punto(elemento)
        rotacion = elemento.get("rot", "R0")
        angulo = int(rotacion.split("R")[-1])
        espejado = rotacion.startswith("M")
        giro = radians(-angulo if espejado else angulo)
        for pad in paquetes[elemento.get("package")]:
            if pad.tag not in ("pad", "smd"):
                continue
            dx, dy = punto(pad)
            if espejado:
                dx = -dx
            cx = round(x + dx * cos(giro) - dy * sin(giro), 6)
            cy = round(y + dx * sin(giro) + dy * cos(giro), 6)
            clave = f"{ref}.{pad.get('name')}"
            if pad.tag == "smd":
                comprobar(espejado and pad.get("layer") == "1", f"{clave} queda fuera del cobre inferior")
                ancho, alto = float(pad.get("dx")), float(pad.get("dy"))
                if angulo % 180:
                    ancho, alto = alto, ancho
                pads[clave] = box(cx - ancho / 2, cy - alto / 2, cx + ancho / 2, cy + alto / 2)
            else:
                radio = float(pad.get("diameter")) / 2
                pads[clave] = (
                    box(cx - radio, cy - radio, cx + radio, cy + radio)
                    if pad.get("shape") == "square" else Point(cx, cy).buffer(radio)
                )
                taladros[clave] = (Point(cx, cy), float(pad.get("drill")) / 2)
    return pads, taladros


def redes_del_esquema():
    esquema = ElementTree.parse(ESQUEMA).find("drawing/schematic")
    bibliotecas = {lib.get("name"): lib for lib in esquema.findall("libraries/library")}
    pines_a_pads = {}
    for parte in esquema.findall("parts/part"):
        biblioteca = bibliotecas[parte.get("library")]
        dispositivos = biblioteca.find(f"devicesets/deviceset[@name='{parte.get('deviceset')}']/devices")
        dispositivo = next(d for d in dispositivos if d.get("name") == parte.get("device"))
        pines_a_pads[parte.get("name")] = {
            (c.get("gate"), c.get("pin")): c.get("pad") for c in dispositivo.findall("connects/connect")
        }
    redes = {}
    for red in esquema.findall("sheets/sheet/nets/net"):
        contactos = redes.setdefault(red.get("name"), set())
        for pin in red.findall("segment/pinref"):
            parte = pin.get("part")
            pad = pines_a_pads[parte][pin.get("gate"), pin.get("pin")]
            contactos.add(f"{parte}.{pad}")
    return redes


def validar():
    placa = ElementTree.parse(PCB).find("drawing/board")
    referencia = ElementTree.parse(REFERENCIA).find("drawing/board")
    for selector in ("plain/wire[@layer='20']", "plain/hole"):
        comprobar(
            [n.attrib for n in placa.findall(selector)] == [n.attrib for n in referencia.findall(selector)],
            "Cambió la geometría de apilado",
        )
    for ref in ("J1", "J2", "J3", "J4"):
        selector = f"elements/element[@name='{ref}']"
        comprobar(placa.find(selector).attrib == referencia.find(selector).attrib, f"Cambió la posición de {ref}")

    bordes = [LineString([punto(w, "1"), punto(w, "2")]) for w in placa.findall("plain/wire[@layer='20']")]
    contornos = list(polygonize(bordes))
    comprobar(len(contornos) == 1 and contornos[0].bounds == (0, 0, ANCHO, ALTO), "Contorno inesperado")
    zona = contornos[0].buffer(-0.75)
    montaje = unary_union([Point(punto(h)).buffer(float(h.get("drill")) / 2) for h in placa.findall("plain/hole")])
    pads, taladros = centros_y_pads(placa)
    comprobar(len(pads) == 52 and len(taladros) == 38, "Cambió la cantidad de pads")
    senales = {s.get("name"): s for s in placa.findall("signals/signal")}
    contactos = {
        nombre: {f"{r.get('element')}.{r.get('pad')}" for r in senal.findall("contactref")}
        for nombre, senal in senales.items()
    }
    comprobar(contactos == redes_del_esquema() == NETLIST, "La placa, el esquema y el pinout UART no coinciden")
    asignados = set().union(*contactos.values())
    cobre = {nombre: forma for nombre, forma in pads.items() if nombre not in asignados}
    for nombre, senal in senales.items():
        comprobar(all(e.tag in ("contactref", "wire") for e in senal), f"{nombre} contiene vías o cobre adicional")
        pistas = []
        for wire in senal.findall("wire"):
            ancho = float(wire.get("width"))
            comprobar(wire.get("layer") == "16" and ancho >= 0.28, f"Pista incompatible en {nombre}")
            pistas.append(LineString([punto(wire, "1"), punto(wire, "2")]).buffer(ancho / 2))
        comprobar(all(zona.covers(pista) for pista in pistas), f"{nombre} se acerca al contorno")
        cobre[nombre] = unary_union(pistas + [pads[clave] for clave in contactos[nombre]])

    comprobar(all(zona.covers(forma) for forma in cobre.values()), "Hay cobre fuera del margen del borde")
    comprobar(all(forma.distance(montaje) >= 0.17 for forma in cobre.values()), "Cobre cerca de un agujero de montaje")
    separacion = min(a.distance(b) for a, b in combinations(cobre.values(), 2))
    comprobar(separacion >= 0.17, "Separación entre cobres inferior a 0,17 mm")
    perforaciones = unary_union([centro.buffer(radio + TOLERANCIA_TALADRO) for centro, radio in taladros.values()])
    for nombre, forma in cobre.items():
        comprobacion = forma.buffer(-MARGEN_ATAQUE).difference(perforaciones)
        comprobar(
            comprobacion.geom_type == "Polygon" and not comprobacion.is_empty,
            f"{nombre} queda abierto al aplicar el modelo de taladro y pérdida de cobre",
        )
    return cobre, taladros, separacion


def exportar(cobre, taladros, salida):
    salida.parent.mkdir(parents=True, exist_ok=True)
    lienzo = Canvas(str(salida), pagesize=A4)
    lienzo.setTitle("SmartTraffic - Máscara de cobre de una cara")
    lienzo.setViewerPreference("PrintScaling", "None")
    gris = HexColor("#426169")
    verde = HexColor("#006A60")

    def texto(x, y, mensaje, tamano=9, negrita=False, color=black):
        lienzo.setFont("Helvetica-Bold" if negrita else "Helvetica", tamano)
        lienzo.setFillColor(color)
        lienzo.drawString(x * mm, y * mm, mensaje)

    def linea(x1, y1, x2, y2, ancho=0.6):
        lienzo.setStrokeColor(gris)
        lienzo.setLineWidth(ancho)
        lienzo.line(x1 * mm, y1 * mm, x2 * mm, y2 * mm)

    texto(20, 277, "SMARTTRAFFIC / SHIELD ARDUINO UNO", 9, True, verde)
    texto(20, 262, "Máscara de cobre para baquelita", 22, True)
    texto(20, 250, "Una cara · A4 · Escala 1:1 · Borrador de la UART", 11, color=gris)
    linea(20, 243, 190, 243)
    texto(20, 232, "Dentro de las marcas se imprime únicamente el cobre.", 9.5)
    texto(20, 225, "Las marcas exteriores ubican un tablero de 68,58 × 53,34 mm.", 9.5)

    pilotos = unary_union([centro.buffer(DIAMETRO_GUIA / 2) for centro, _ in taladros.values()])
    mascara = unary_union(list(cobre.values())).difference(pilotos)
    lienzo.saveState()
    lienzo.translate(ORIGEN_X * mm, ORIGEN_Y * mm)
    lienzo.scale(mm, mm)
    lienzo.setFillColor(black)
    for poligono in mascara.geoms:
        trazado = lienzo.beginPath()
        for anillo in (poligono.exterior, *poligono.interiors):
            puntos = list(anillo.coords)
            trazado.moveTo(*puntos[0])
            for posicion in puntos[1:]:
                trazado.lineTo(*posicion)
            trazado.close()
        lienzo.drawPath(trazado, fill=1, stroke=0, fillMode=0)
    lienzo.restoreState()

    for x, signo_x in ((ORIGEN_X, -1), (ORIGEN_X + ANCHO, 1)):
        for y, signo_y in ((ORIGEN_Y, -1), (ORIGEN_Y + ALTO, 1)):
            linea(x + signo_x * 1.8, y, x + signo_x * 5, y)
            linea(x, y + signo_y * 1.8, x, y + signo_y * 5)
    linea(80, 137, 130, 137, 0.8)
    for x in (80, 130):
        linea(x, 135, x, 139)
    texto(100, 130, "50 mm", 8.5, True)

    linea(20, 118, 190, 118)
    texto(20, 107, "Impresión y orientación", 12, True, verde)
    texto(20, 99, "Imprime a tamaño real (100 %) y comprueba la barra de 50 mm.")
    texto(20, 92, "La vista es desde la cara sin cobre. Para transferencia por contacto,")
    texto(20, 85, "coloca el tóner hacia el cobre e imprime sin aplicar espejo adicional.")
    texto(20, 78, "Los puntos blancos de 0,30 mm son guías. Las tiras se taladran a 1,00 mm.")
    texto(20, 71, "Usa la plantilla mecánica aparte para el contorno y los cuatro agujeros de 3,20 mm.")
    texto(20, 57, "Comprobación del prototipo", 12, True, verde)
    texto(20, 49, "U1 tiene paso de 0,50 mm. Comprueba el resultado en una muestra de baquelita.")
    texto(20, 42, "U1, R1, C1 y C2 van del lado del cobre. Comprueba la holgura sobre el Arduino.")
    texto(20, 35, "Este borrador contiene la UART. Las salidas de los semáforos siguen pendientes.")
    linea(20, 22, 190, 22)
    texto(20, 15, "Arte vectorial generado desde el archivo Eagle de una cara.", 8, color=gris)
    lienzo.showPage()
    lienzo.save()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=PDF)
    args = parser.parse_args()
    cobre, taladros, separacion = validar()
    exportar(cobre, taladros, args.output)
    print(f"8 redes, {len(taladros)} taladros, {len(cobre)} islas de cobre, separación mínima {separacion:.3f} mm")
    print(args.output.resolve())


if __name__ == "__main__":
    main()
