"""Estilos y utilidades para las láminas técnicas del manual SmartTraffic."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle


CARPETA = Path(__file__).resolve().parent / "imagenes"
CARPETA.mkdir(parents=True, exist_ok=True)

VERDE = "#14785F"
VERDE_CLARO = "#E7F3EE"
TINTA = "#18352F"
GRIS = "#687B76"
BORDE = "#D5E4DD"
FONDO = "#F7FAF8"
ROJO = "#E85D5D"
AMARILLO = "#EAB64A"
VERDE_LED = "#39A978"
NEGRO = "#263A35"
AZUL = "#4386C6"


def figura(ancho=12, alto=6, titulo=None):
    fig, ax = plt.subplots(figsize=(ancho, alto), facecolor="white")
    ax.set_facecolor("white")
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.set_aspect("equal")
    ax.axis("off")
    if titulo:
        ax.text(0.35, 8.55, titulo, fontsize=18, weight="bold", color=TINTA, va="top")
    return fig, ax


def caja(ax, x, y, ancho, alto, texto="", color=VERDE_CLARO, borde=BORDE, fs=11):
    ax.add_patch(FancyBboxPatch((x, y), ancho, alto, boxstyle="round,pad=0.12,rounding_size=0.14",
                                facecolor=color, edgecolor=borde, linewidth=1.5))
    if texto:
        ax.text(x + ancho / 2, y + alto / 2, texto, ha="center", va="center", fontsize=fs,
                color=TINTA, weight="bold")


def led_luz(ax, x, y, radio=0.13, color=ROJO, encendido=True):
    ax.add_patch(Circle((x, y), radio, facecolor=color if encendido else "#F0F2F1",
                        edgecolor=color, linewidth=1.4))


def flecha(ax, desde, hasta, color=GRIS, ancho=1.8, estilo="-|>"):
    ax.add_patch(FancyArrowPatch(desde, hasta, arrowstyle=estilo, mutation_scale=13,
                                 color=color, linewidth=ancho, shrinkA=0, shrinkB=0))


def guardar(fig, nombre):
    fig.savefig(CARPETA / f"{nombre}.png", dpi=220, bbox_inches="tight", pad_inches=0.16,
                facecolor="white")
    fig.savefig(CARPETA / f"{nombre}.svg", bbox_inches="tight", pad_inches=0.16,
                facecolor="white")
    plt.close(fig)
