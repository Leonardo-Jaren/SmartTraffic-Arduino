"""Genera el manual PDF desde el firmware y las láminas técnicas del proyecto."""

from pathlib import Path
import textwrap

from reportlab.lib.pagesizes import A4

from pdf_estilo import ALTO, MARGEN, GuiaPDF, GRIS, TINTA
from paginas_01_12 import pagina_01_12
from paginas_13_26 import pagina_13_26


RAIZ = Path(__file__).resolve().parents[2]
FIRMWARE = RAIZ / "arduino" / "SmartTraffic" / "SmartTraffic.ino"
DESTINO = RAIZ / "docs" / "GUIA_VISUAL_CONEXIONES_ARDUINO.pdf"


def codigo_en_paginas(g):
    lineas = []
    for numero, original in enumerate(FIRMWARE.read_text(encoding="utf-8").splitlines(), 1):
        sangria = len(original) - len(original.lstrip(" "))
        cuerpo = original[sangria:]
        prefijo = f"{numero:03d}  " + " " * sangria
        max_caracteres = max(34, 111 - sangria)
        fragmentos = textwrap.wrap(cuerpo, width=max_caracteres, subsequent_indent="",
                                    replace_whitespace=False, drop_whitespace=False) if cuerpo else [""]
        for indice, fragmento in enumerate(fragmentos):
            inicio = prefijo if indice == 0 else "      " + " " * sangria
            lineas.append(inicio + fragmento)
    por_pagina = 82
    paginas = [lineas[i:i + por_pagina] for i in range(0, len(lineas), por_pagina)]
    for indice, bloque in enumerate(paginas, 1):
        y = g.pagina("Anexo · Firmware original", f"SmartTraffic.ino · página {indice} de {len(paginas)}",
                     "Texto tomado del archivo arduino/SmartTraffic/SmartTraffic.ino; no es otro firmware.")
        g.pdf.setFillColor(GRIS)
        g.pdf.setFont("Sans", 7)
        g.pdf.drawString(MARGEN, y, "Líneas del sketch; conserva la indentación al copiarlo al Arduino IDE.")
        y -= 18
        g.pdf.setFont("Mono", 7.0)
        g.pdf.setFillColor(TINTA)
        for linea in bloque:
            g.pdf.drawString(MARGEN, y, linea)
            y -= 8.0
        g.nueva()


def main():
    guia = GuiaPDF(DESTINO)
    pagina_01_12(guia)
    pagina_13_26(guia)
    codigo_en_paginas(guia)
    guia.guardar()
    print(f"PDF guardado: {DESTINO}")
    print(f"Páginas: {guia.numero}")
    print(f"Firmware incluido: {len(FIRMWARE.read_text(encoding='utf-8').splitlines())} líneas")


if __name__ == "__main__":
    main()
