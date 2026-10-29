"""Componentes de maquetación del PDF de conexiones SmartTraffic."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader, simpleSplit


ANCHO, ALTO = A4
MARGEN = 38
VERDE = colors.HexColor("#14785F")
VERDE_OSCURO = colors.HexColor("#105943")
TINTA = colors.HexColor("#18352F")
GRIS = colors.HexColor("#647770")
BORDE = colors.HexColor("#D5E4DD")
FONDO = colors.HexColor("#F5F9F7")
ROJO = colors.HexColor("#B44343")
AMARILLO = colors.HexColor("#9B6A08")
AZUL = colors.HexColor("#285D8C")
NEGRO = colors.HexColor("#283A34")
CARPETA = Path(__file__).resolve().parent
IMAGENES = CARPETA / "imagenes"

pdfmetrics.registerFont(TTFont("Sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))


class GuiaPDF:
    def __init__(self, destino):
        self.destino = str(destino)
        self.pdf = canvas.Canvas(self.destino, pagesize=A4, pageCompression=1)
        self.numero = 0

    def pagina(self, seccion, titulo, bajada=None):
        self.numero += 1
        p = self.pdf
        p.setFillColor(FONDO)
        p.rect(0, 0, ANCHO, ALTO, fill=1, stroke=0)
        p.setFillColor(VERDE)
        p.rect(0, ALTO - 82, ANCHO, 82, fill=1, stroke=0)
        p.setFillColor(colors.HexColor("#D8F1E6"))
        p.setFont("Sans-Bold", 8)
        p.drawString(MARGEN, ALTO - 23, seccion.upper())
        p.setFillColor(colors.white)
        p.setFont("Sans-Bold", 16)
        lineas = simpleSplit(titulo, "Sans-Bold", 16, ANCHO - 2 * MARGEN)
        p.drawString(MARGEN, ALTO - 49, lineas[0])
        if len(lineas) > 1:
            p.setFont("Sans-Bold", 12)
            p.drawString(MARGEN, ALTO - 66, lineas[1])
        if bajada:
            p.setFillColor(GRIS)
            p.setFont("Sans", 9)
            p.drawString(MARGEN, ALTO - 101, bajada)
        self.pie()
        return ALTO - (117 if bajada else 103)

    def pie(self):
        p = self.pdf
        p.setStrokeColor(BORDE)
        p.line(MARGEN, 39, ANCHO - MARGEN, 39)
        p.setFillColor(GRIS)
        p.setFont("Sans", 7.5)
        p.drawString(MARGEN, 25, "SMARTTRAFFIC  ·  Guía física Arduino UNO R3  ·  Revisa el hardware real antes de soldar")
        p.drawRightString(ANCHO - MARGEN, 25, str(self.numero))

    def texto(self, x, y, texto, ancho=None, tam=10, interlinea=None, color=TINTA, negrita=False):
        ancho = ancho or ANCHO - 2 * MARGEN - (x - MARGEN)
        interlinea = interlinea or tam * 1.48
        fuente = "Sans-Bold" if negrita else "Sans"
        p = self.pdf
        p.setFillColor(color)
        p.setFont(fuente, tam)
        for linea in simpleSplit(str(texto), fuente, tam, ancho):
            p.drawString(x, y, linea)
            y -= interlinea
        return y

    def titulo_bloque(self, x, y, texto, color=VERDE):
        self.pdf.setFillColor(color)
        self.pdf.setFont("Sans-Bold", 11)
        self.pdf.drawString(x, y, texto)
        return y - 20

    def lista(self, x, y, items, ancho=None, tam=9.3, paso=4):
        ancho = ancho or ANCHO - x - MARGEN
        for item in items:
            self.pdf.setFillColor(VERDE)
            self.pdf.circle(x + 3, y + 3, 2.2, fill=1, stroke=0)
            y = self.texto(x + 13, y, item, ancho - 13, tam=tam, interlinea=tam * 1.42) - paso
        return y

    def imagen(self, nombre, x, y_superior, ancho, alto_max):
        ruta = IMAGENES / nombre
        img = ImageReader(str(ruta))
        iw, ih = img.getSize()
        escala = min(ancho / iw, alto_max / ih)
        w, h = iw * escala, ih * escala
        self.pdf.drawImage(img, x + (ancho - w) / 2, y_superior - h, w, h,
                           preserveAspectRatio=True, mask="auto")
        return y_superior - h

    def tarjeta(self, x, y_superior, ancho, titulo, cuerpo, color=VERDE, tam=9.2):
        lineas = simpleSplit(cuerpo, "Sans", tam, ancho - 24)
        alto = 24 + 13 + len(lineas) * (tam * 1.42) + 13
        p = self.pdf
        p.setFillColor(colors.white)
        p.setStrokeColor(BORDE)
        p.roundRect(x, y_superior - alto, ancho, alto, 9, fill=1, stroke=1)
        p.setFillColor(color)
        p.setFont("Sans-Bold", 9.5)
        p.drawString(x + 12, y_superior - 20, titulo)
        y = y_superior - 41
        p.setFillColor(TINTA)
        p.setFont("Sans", tam)
        for linea in lineas:
            p.drawString(x + 12, y, linea)
            y -= tam * 1.42
        return y_superior - alto

    def tabla(self, x, y_superior, anchos, encabezados, filas, tam=8.2, primera_negrita=False):
        p = self.pdf
        h_enc = 27
        alto_total = h_enc
        medidas = []
        for fila in filas:
            celdas = []
            lineas_max = 1
            for i, celda in enumerate(fila):
                fuente = "Sans-Bold" if primera_negrita and i == 0 else "Sans"
                lineas = simpleSplit(str(celda), fuente, tam, anchos[i] - 12)
                celdas.append((lineas, fuente))
                lineas_max = max(lineas_max, len(lineas))
            alto = max(27, lineas_max * (tam * 1.35) + 12)
            medidas.append((alto, celdas))
            alto_total += alto
        p.setFillColor(VERDE)
        p.roundRect(x, y_superior - h_enc, sum(anchos), h_enc, 5, fill=1, stroke=0)
        cursor_x = x
        for i, (titulo, ancho) in enumerate(zip(encabezados, anchos)):
            p.setFillColor(colors.white)
            p.setFont("Sans-Bold", 7.6)
            for j, linea in enumerate(simpleSplit(str(titulo), "Sans-Bold", 7.6, ancho - 12)[:2]):
                p.drawString(cursor_x + 6, y_superior - 12 - j * 9, linea)
            cursor_x += ancho
        y = y_superior - h_enc
        for idx, (alto, celdas) in enumerate(medidas):
            p.setFillColor(colors.white if idx % 2 else colors.HexColor("#EDF4F0"))
            p.rect(x, y - alto, sum(anchos), alto, fill=1, stroke=0)
            cursor_x = x
            for j, (lineas, fuente) in enumerate(celdas):
                p.setFillColor(TINTA)
                p.setFont(fuente, tam)
                for k, linea in enumerate(lineas):
                    p.drawString(cursor_x + 6, y - 13 - k * (tam * 1.35), linea)
                cursor_x += anchos[j]
            y -= alto
        p.setStrokeColor(BORDE)
        p.roundRect(x, y_superior - alto_total, sum(anchos), alto_total, 5, fill=0, stroke=1)
        return y_superior - alto_total

    def casillas(self, x, y, items, ancho=None, tam=9.2):
        ancho = ancho or ANCHO - x - MARGEN
        for item in items:
            self.pdf.setStrokeColor(VERDE)
            self.pdf.roundRect(x, y - 3, 10, 10, 2, fill=0, stroke=1)
            y = self.texto(x + 18, y, item, ancho - 18, tam=tam, interlinea=tam * 1.42) - 8
        return y

    def nueva(self):
        self.pdf.showPage()

    def guardar(self):
        self.pdf.save()
