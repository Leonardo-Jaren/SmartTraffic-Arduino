"""Ejecuta el sketch con GPIO y reloj simulados; requiere g++ en la computadora."""
from pathlib import Path
import subprocess
import tempfile

carpeta = Path(__file__).resolve().parent
original = (carpeta.parent / 'SmartTraffic' / 'SmartTraffic.ino').read_text()

with tempfile.TemporaryDirectory(prefix='smarttraffic-firmware-') as temporal:
    for modo in (0, 1, 2):
        codigo = original
        if modo:
            codigo = codigo.replace('const bool MAPA_CONFIRMADO = false;', 'const bool MAPA_CONFIRMADO = true;')
        if modo == 1:
            codigo = codigo.replace('const byte CRUCE[6] = {1, 2, 3, 4, 5, 6};', 'const byte CRUCE[6] = {1, 1, 2, 2, 3, 3};')
            codigo = codigo.replace("const char EJE[6] = {'H', 'H', 'H', 'H', 'H', 'H'};", "const char EJE[6] = {'H', 'V', 'H', 'V', 'H', 'V'};")
        sketch = Path(temporal) / f'firmware_{modo}.ino'
        ejecutable = Path(temporal) / f'prueba_{modo}'
        sketch.write_text(codigo)
        subprocess.run(['g++', '-std=c++17', '-Wall', '-Wextra', f'-DMODO_MAPA={modo}',
                        f'-DRUTA_SKETCH="{sketch}"', '-I', str(carpeta), str(carpeta / 'firmware_simulado.cpp'),
                        '-o', str(ejecutable)], check=True)
        subprocess.run([str(ejecutable)], check=True)
