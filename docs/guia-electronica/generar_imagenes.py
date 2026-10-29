"""Crea las ilustraciones técnicas SVG y PNG que usa la guía PDF."""

from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle

from estilos import (AMARILLO, AZUL, BORDE, FONDO, GRIS, NEGRO, ROJO, TINTA,
                     VERDE, VERDE_CLARO, VERDE_LED, caja, figura, flecha,
                     guardar, led_luz)


def dibujar_semaforo(ax, x, y, etiqueta):
    ax.add_patch(FancyBboxPatch((x - 0.18, y - 0.48), 0.36, 0.96,
                                boxstyle="round,pad=0.03,rounding_size=0.08",
                                facecolor="#283833", edgecolor="white", linewidth=1))
    led_luz(ax, x, y + 0.25, 0.07, ROJO)
    led_luz(ax, x, y, 0.07, AMARILLO)
    led_luz(ax, x, y - 0.25, 0.07, VERDE_LED)
    ax.plot([x, x], [y - 0.48, y - 0.62], color=GRIS, linewidth=2)
    ax.add_patch(Circle((x, y - 0.65), 0.07, color=GRIS))
    ax.text(x, y + 0.62, etiqueta, ha="center", fontsize=8, weight="bold", color=TINTA)


def mapa_sistema():
    fig, ax = figura(13, 7.3, "Vista general · 6 cruces y 6 semáforos")
    # Tres filas de manzanas, con parques y edificios sencillos.
    for fila in range(3):
        for col in range(4):
            x, y = 0.55 + col * 2.5, 0.75 + fila * 2.5
            ax.add_patch(Rectangle((x, y), 2.05, 1.92, facecolor="#50AA67", edgecolor="white"))
            ax.add_patch(Rectangle((x + 0.51, y + 0.42), 1.0, 1.05,
                                   facecolor=("#F4EFE6" if (fila + col) % 2 else "#F0B44E"),
                                   edgecolor="#D6DDD8", linewidth=1.2))
            ax.add_patch(Rectangle((x + 0.62, y + 1.22), 0.78, 0.15,
                                   facecolor="white", edgecolor="none"))
            ax.add_patch(Rectangle((x + 0.68, y + 0.65), 0.18, 0.24,
                                   facecolor="#7BB9D4", edgecolor="none"))
            ax.add_patch(Rectangle((x + 1.08, y + 0.65), 0.18, 0.24,
                                   facecolor="#7BB9D4", edgecolor="none"))
    # Dos vías horizontales principales.
    for y in (2.95, 5.45):
        ax.add_patch(Rectangle((0.15, y), 10.2, 0.66, facecolor="#30363B", edgecolor="none"))
        for x in [i * 0.8 + 0.3 for i in range(13)]:
            ax.add_patch(Rectangle((x, y + 0.31), 0.36, 0.035, facecolor="#F3C847", edgecolor="none"))
    # Tres vías verticales.
    for x in (2.35, 5.25, 8.15):
        ax.add_patch(Rectangle((x, 0.25), 0.66, 7.0, facecolor="#30363B", edgecolor="none"))
        for y in [i * 0.8 + 0.38 for i in range(9)]:
            ax.add_patch(Rectangle((x + 0.31, y), 0.035, 0.36, facecolor="#F3C847", edgecolor="none"))
    cruces = [(2.68, 5.78), (5.58, 5.78), (8.48, 5.78),
              (2.68, 3.28), (5.58, 3.28), (8.48, 3.28)]
    for i, (x, y) in enumerate(cruces, 1):
        dibujar_semaforo(ax, x + 0.56, y + 0.05, f"S{i}")
        ax.add_patch(Circle((x, y), 0.23, facecolor="white", edgecolor=VERDE, linewidth=2))
        ax.text(x, y, f"I{i}", ha="center", va="center", fontsize=8, weight="bold", color=VERDE)
    # Flechas de circulación confirmadas por el usuario.
    flecha(ax, (10.0, 5.78), (9.35, 5.78), "white", 2.3)
    flecha(ax, (0.75, 3.28), (1.9, 3.28), "white", 2.3)
    flecha(ax, (2.68, 0.48), (2.68, 2.48), "white", 2.0)
    flecha(ax, (5.58, 7.05), (5.58, 6.38), "white", 2.0)
    flecha(ax, (8.48, 0.48), (8.48, 2.48), "white", 2.0)
    ax.text(4.45, 5.78, "H1  ←  PRINCIPAL", color="white", fontsize=8, weight="bold", ha="center", va="center")
    ax.text(4.45, 3.28, "H2  →  PRINCIPAL", color="white", fontsize=8, weight="bold", ha="center", va="center")
    # Punto de conexión esquemático, fuera del tablero.
    caja(ax, 11.0, 3.3, 4.4, 2.4, "ARDUINO UNO R3\nUSB a la computadora\n18 señales + GND común", color=VERDE_CLARO, fs=12)
    ax.text(11.1, 2.65, "S1–S6 → I1–I6 (propuesta)\nCada semáforo mira a una horizontal.\nLas verticales llevan ceda el paso.",
            fontsize=9, color=TINTA, va="top", linespacing=1.45)
    ax.text(0.25, 0.05, "Esquema aproximado de la maqueta; no representa distancias ni la ruta física del mazo de cables.",
            fontsize=8, color=GRIS)
    guardar(fig, "mapa_sistema")


def polaridad_componentes():
    fig, ax = figura(12, 6.4, "Reconocer el LED, la resistencia y la polaridad")
    # LED en corte lateral.
    ax.add_patch(Circle((3.0, 5.1), 0.85, facecolor="#F8FBFC", edgecolor=AZUL, linewidth=2))
    ax.add_patch(Rectangle((2.42, 4.25), 1.16, 0.35, facecolor="#EAF2F5", edgecolor="none"))
    ax.plot([2.7, 2.7], [4.25, 2.75], color="#A9B2B0", linewidth=5, solid_capstyle="round")
    ax.plot([3.3, 3.3], [4.25, 3.2], color="#A9B2B0", linewidth=4, solid_capstyle="round")
    ax.plot([2.7, 2.7], [2.75, 2.25], color=ROJO, linewidth=3)
    ax.plot([3.3, 3.3], [3.2, 2.55], color=NEGRO, linewidth=3)
    ax.plot([2.42, 2.42], [4.35, 5.2], color=AZUL, linewidth=2)
    ax.text(2.7, 1.95, "ÁNODO (+)\npata larga → pin", color=ROJO, ha="center", fontsize=10, weight="bold")
    ax.text(3.8, 2.35, "CÁTODO (−)\npata corta / lado plano\n→ resistencia", color=NEGRO, ha="left", fontsize=9, weight="bold")
    ax.text(2.45, 5.95, "LED individual de 2 patas\nVista esquemática", ha="center", fontsize=11, color=TINTA, weight="bold")
    # Resistencia axial con bandas.
    ax.plot([6.1, 7.3], [4.9, 4.9], color="#A9B2B0", linewidth=3)
    ax.add_patch(FancyBboxPatch((7.25, 4.58), 2.5, 0.64, boxstyle="round,pad=0.04,rounding_size=0.24",
                                facecolor="#E8DDC7", edgecolor="#9A8053", linewidth=1.6))
    for xx, color in ((7.68, "#CF4743"), (8.15, "#CF4743"), (8.62, "#CF4743"), (9.25, "#B79C67")):
        ax.add_patch(Rectangle((xx, 4.62), 0.18, 0.56, facecolor=color, edgecolor="none"))
    ax.plot([9.75, 10.8], [4.9, 4.9], color="#A9B2B0", linewidth=3)
    ax.text(8.5, 5.75, "Resistencia axial 2,2 kΩ · no tiene polaridad", ha="center", fontsize=11, color=TINTA, weight="bold")
    ax.text(8.5, 4.9, "rojo · rojo · rojo · dorado", ha="center", va="center", fontsize=8, color=TINTA)
    ax.text(8.5, 3.9, "Confirma el valor con el código de bandas o un multímetro.", ha="center", fontsize=9, color=GRIS)
    caja(ax, 11.1, 4.0, 4.0, 1.7, "Cableado en serie\nPin → ánodo → cátodo\n→ 2,2 kΩ → GND", fs=11)
    ax.text(0.45, 0.8, "Si ya recortaste las patas, identifica la marca plana del cuerpo y consulta la hoja de datos. No adivines la polaridad.",
            fontsize=9, color=GRIS, wrap=True)
    guardar(fig, "polaridad_componentes")


def circuito_s1():
    fig, ax = figura(13, 7, "Ejemplo real de cableado · semáforo S1")
    ax.text(0.45, 7.75, "Tres LEDs separados · tres resistencias individuales · un retorno GND compartido",
            fontsize=11, color=GRIS)
    # Microcontrolador representado como bloques de pines reales.
    caja(ax, 0.45, 2.2, 2.25, 4.7, color=VERDE, borde=VERDE)
    ax.text(1.57, 6.55, "ARDUINO UNO R3", color="white", fontsize=10, weight="bold", ha="center")
    rows = [(6.2, ROJO, "S1-R · D2", "LED rojo"),
            (4.8, AMARILLO, "S1-A · D3", "LED amarillo"),
            (3.4, VERDE_LED, "S1-V · D4", "LED verde")]
    for y, color, label, name in rows:
        ax.add_patch(FancyBboxPatch((0.72, y - 0.25), 0.56, 0.5,
                                    boxstyle="round,pad=0.03,rounding_size=0.07",
                                    facecolor="white", edgecolor="white"))
        ax.text(1.0, y, label.split("·")[-1].strip(), color=TINTA,
                fontsize=9, weight="bold", ha="center", va="center")
        ax.text(1.9, y, name.upper(), color="white", fontsize=8.4, weight="bold",
                ha="center", va="center")
        ax.plot([2.7, 3.4], [y, y], color=color, linewidth=4)
        ax.add_patch(Circle((3.75, y), 0.3, facecolor="#FFFDF8", edgecolor=color, linewidth=2))
        ax.add_patch(Rectangle((3.55, y - 0.19), 0.2, 0.38, facecolor=color, edgecolor="none", alpha=0.76))
        ax.plot([4.05, 4.45], [y, y], color=color, linewidth=2)
        ax.plot([4.45, 4.45], [y - 0.18, y + 0.18], color=TINTA, linewidth=2.4)
        ax.plot([4.45, 5.0], [y, y], color=NEGRO, linewidth=2.5)
        ax.add_patch(Rectangle((5.0, y - 0.18), 1.8, 0.36, facecolor="#E8DDC7", edgecolor="#9A8053", linewidth=1.4))
        ax.text(5.9, y, "2,2 kΩ", ha="center", va="center", fontsize=10, color=TINTA, weight="bold")
        ax.plot([6.8, 9.7], [y, y], color=NEGRO, linewidth=2.4)
        ax.text(3.75, y + 0.48, label, fontsize=8, color=TINTA, ha="center", weight="bold")
        ax.text(3.92, y - 0.43, "ánodo +", fontsize=7.0, color=GRIS, ha="center")
        ax.text(4.82, y - 0.43, "cátodo −", fontsize=7.0, color=GRIS, ha="center")
    ax.add_patch(FancyBboxPatch((0.72, 2.3), 0.56, 0.5,
                                boxstyle="round,pad=0.03,rounding_size=0.07",
                                facecolor="white", edgecolor="white"))
    ax.text(1.0, 2.55, "GND", color=TINTA, fontsize=8.2, weight="bold", ha="center", va="center")
    ax.text(1.9, 2.55, "TIERRA", color="white", fontsize=8.4, weight="bold", ha="center", va="center")
    # Bus común de retorno, unido a GND.
    ax.plot([9.7, 9.7], [3.4, 6.2], color=NEGRO, linewidth=3)
    ax.plot([2.7, 9.7], [2.55, 2.55], color=NEGRO, linewidth=3)
    ax.plot([9.7, 9.7], [2.55, 3.4], color=NEGRO, linewidth=3)
    flecha(ax, (9.7, 2.55), (10.6, 2.55), NEGRO, 2.4)
    caja(ax, 10.7, 1.65, 4.4, 1.8, "Un cable negro desde el bus\ncomún llega al pin GND\ndel Arduino.", fs=10)
    ax.text(12.9, 6.2, "Cada LED lleva su propia\nresistencia de 2,2 kΩ.", color=VERDE,
            fontsize=9, ha="center", weight="bold")
    ax.text(12.9, 4.7, "Une los retornos solo\ndespués de cada resistencia.", color=ROJO,
            fontsize=8.5, ha="center", weight="bold")
    guardar(fig, "circuito_s1")


def mapa_pines():
    fig, ax = figura(12, 6.8, "Arduino UNO R3 · pines usados por el firmware")
    ax.add_patch(FancyBboxPatch((1.0, 1.1), 14.0, 6.2, boxstyle="round,pad=0.15,rounding_size=0.35",
                                facecolor="#167557", edgecolor="#0B513D", linewidth=2))
    ax.add_patch(FancyBboxPatch((1.55, 3.4), 2.0, 1.6, boxstyle="round,pad=0.08,rounding_size=0.2",
                                facecolor="#D7E4DF", edgecolor="#A9BEB4", linewidth=1.6))
    ax.text(2.55, 4.2, "USB", ha="center", va="center", fontsize=15, weight="bold", color=TINTA)
    ax.text(8.0, 6.75, "PINES DIGITALES  ·  D0–D13", color="white", fontsize=12, weight="bold", ha="center")
    # Pin headers shown as function groups, not mechanical scale.
    for idx, pin in enumerate(range(2, 14)):
        x = 4.15 + (idx % 6) * 1.45
        y = 5.6 - (idx // 6) * 1.08
        color = "#F6F6F1" if pin != 13 else "#FFE6A7"
        ax.add_patch(FancyBboxPatch((x - 0.48, y - 0.31), 0.96, 0.62, boxstyle="round,pad=0.04,rounding_size=0.08",
                                    facecolor=color, edgecolor="#315147", linewidth=1.0))
        ax.text(x, y, f"D{pin}", ha="center", va="center", color=TINTA, fontsize=11, weight="bold")
    ax.text(4.0, 3.55, "A0–A5 como salidas digitales", color="white", fontsize=12, weight="bold")
    for idx, pin in enumerate(range(6)):
        x = 4.35 + idx * 1.42
        ax.add_patch(FancyBboxPatch((x - 0.45, 2.55), 0.9, 0.62, boxstyle="round,pad=0.04,rounding_size=0.08",
                                    facecolor="#F6F6F1", edgecolor="#315147", linewidth=1.0))
        ax.text(x, 2.86, f"A{pin}", ha="center", va="center", color=TINTA, fontsize=11, weight="bold")
    ax.text(8.2, 1.58, "D0/RX y D1/TX quedan libres para la comunicación USB serial.",
            ha="center", color="white", fontsize=10, weight="bold")
    ax.text(0.45, 0.45, "Dibujo funcional para localizar nombres de pines; no está a escala ni sustituye la serigrafía de tu placa.",
            fontsize=8.5, color=GRIS)
    guardar(fig, "mapa_pines")


def pasos_soldadura():
    fig, ax = figura(13, 7.1, "Una unión correcta · cátodo → resistor → retorno común")
    ax.text(0.45, 7.65, "Suelda con el USB desconectado. Deja enfriar cada unión antes de aislarla.",
            fontsize=10, color=GRIS)
    # Zoom de la pata corta y resistor.
    ax.add_patch(Circle((3.4, 5.3), 0.62, facecolor="#F7FBFC", edgecolor=AZUL, linewidth=2))
    ax.plot([3.1, 3.1], [4.7, 3.45], color=NEGRO, linewidth=5, solid_capstyle="round")
    ax.plot([3.1, 4.1], [3.45, 3.45], color="#A9B2B0", linewidth=5, solid_capstyle="round")
    ax.add_patch(Circle((4.1, 3.45), 0.13, facecolor="#C9A76B", edgecolor="#86673C", linewidth=1))
    ax.plot([4.23, 5.1], [3.45, 3.45], color="#A9B2B0", linewidth=4)
    ax.add_patch(Rectangle((5.1, 3.2), 2.0, 0.5, facecolor="#E8DDC7", edgecolor="#9A8053", linewidth=1.5))
    ax.text(1.7, 4.95, "Cátodo (−)\npata corta", ha="center", color=NEGRO, fontsize=9, weight="bold")
    flecha(ax, (2.35, 4.75), (2.9, 4.35), ROJO, 1.6)
    ax.text(4.55, 2.18, "Unión de soldadura:\ncátodo del LED + una pata de R", ha="center", color=TINTA, fontsize=8.5)
    flecha(ax, (4.55, 2.85), (4.12, 3.32), ROJO, 1.5)
    ax.text(6.1, 4.0, "2,2 kΩ", ha="center", color=TINTA, fontsize=10, weight="bold")
    ax.plot([7.1, 8.5], [3.45, 3.45], color=NEGRO, linewidth=4)
    flecha(ax, (8.55, 3.45), (9.25, 3.45), NEGRO, 2.2)
    caja(ax, 9.45, 2.75, 4.7, 1.45, "El otro extremo de la resistencia\nva al cable/bus negro de GND.\nCada LED tiene su propio resistor.", fs=10)
    # Tres pasos en tarjetas.
    for x, number, title, detail in [
        (0.75, "1", "Toca y suelda", "Pata corta del LED\n+ una pata del resistor"),
        (5.45, "2", "Revisa", "La unión no toca\nla pata larga"),
        (10.1, "3", "Aísla", "Termorretráctil después\nde enfriar")]:
        caja(ax, x, 0.65, 3.75, 1.5, color=FONDO)
        ax.add_patch(Circle((x + 0.38, 1.82), 0.22, color=VERDE))
        ax.text(x + 0.38, 1.82, number, color="white", weight="bold", ha="center", va="center")
        ax.text(x + 1.95, 1.88, title, ha="center", fontsize=10, color=TINTA, weight="bold")
        ax.text(x + 1.95, 1.3, detail, ha="center", fontsize=8.4, color=GRIS, va="center")
    guardar(fig, "pasos_soldadura")


def agrupacion_pines():
    fig, ax = figura(13, 6.7, "Conectar los seis semáforos · sigue la etiqueta en ambos extremos")
    posiciones = [(1.9, 6.35), (5.7, 6.35), (9.5, 6.35),
                  (1.9, 3.65), (5.7, 3.65), (9.5, 3.65)]
    for n, (x, y) in enumerate(posiciones, 1):
        caja(ax, x - 1.35, y - 0.72, 2.7, 1.45, f"S{n}  →  I{n}\nRojo · Amarillo · Verde", fs=9)
        ax.plot([x - 0.75, x + 0.75], [y - 0.44, y - 0.44], color=NEGRO, linewidth=2.5)
        ax.text(x, y - 0.61, "retorno GND vía 3 resistencias", fontsize=7.4, color=GRIS, ha="center")
    # Cajas por grupos con el destino exacto, sin cableado confuso cruzando la figura.
    for y, txt, color in [(1.65, "S1–S3  ·  D2–D10", VERDE),
                          (1.15, "S4  ·  D11–D13", AZUL),
                          (0.65, "S5–S6  ·  A0–A5", "#8C68B2")]:
        ax.plot([1.0, 10.2], [y, y], color=color, linewidth=2.5, alpha=0.65)
        ax.text(11.1, y, txt, fontsize=9, color=color, weight="bold", va="center")
    caja(ax, 12.3, 3.6, 3.0, 2.2, "UNO R3\n18 entradas de señal\n1 conexión GND común", color=VERDE, fs=10)
    ax.text(0.55, 0.15, "Los colores de señal siguen el color de la luz; etiqueta cada punta, por ejemplo S4-A / D12.",
            fontsize=8.5, color=GRIS)
    guardar(fig, "agrupacion_pines")


def secuencia_usb():
    fig, ax = figura(12, 5.8, "Cómo viajan los datos cuando conectas el Arduino por USB")
    centros = (1.8, 5.8, 9.8, 13.8)
    bloques = ["ARDUINO UNO\n115200 baudios\nESTADO / ACK",
               "PUENTE SERIAL\npuerto USB local\nDjango / comando",
               "DJANGO REST\nAPI local\nestado confirmado",
               "VUE\npanel web\ncolores / tiempos"]
    for x, texto in zip(centros, bloques):
        caja(ax, x - 1.35, 3.95, 2.7, 1.65, texto, fs=8.7)
    for indice, etiqueta in enumerate(("USB serial", "HTTP local", "API")):
        inicio = centros[indice] + 1.35
        fin = centros[indice + 1] - 1.35
        flecha(ax, (inicio, 4.78), (fin, 4.78), VERDE, 1.8)
        ax.text((inicio + fin) / 2, 5.75, etiqueta, ha="center", color=GRIS, fontsize=7.5)
    ax.add_patch(FancyArrowPatch((0.45, 3.2), (15.15, 3.2), arrowstyle="<->",
                                 mutation_scale=13, color=AMARILLO, linewidth=2.0))
    ax.text(7.8, 2.35, "CONFIG y ACK viajan de ida y vuelta por la misma conexión",
            ha="center", color=TINTA, fontsize=9, weight="bold")
    ax.text(7.8, 0.95, "Puente y Django corren en la misma computadora conectada al USB; un servidor remoto no ve ese puerto.",
            ha="center", color=ROJO, fontsize=8.5, weight="bold")
    guardar(fig, "secuencia_usb")


if __name__ == "__main__":
    mapa_sistema()
    polaridad_componentes()
    circuito_s1()
    mapa_pines()
    pasos_soldadura()
    agrupacion_pines()
    secuencia_usb()
    print("Ilustraciones SVG y PNG guardadas en imagenes/.")
