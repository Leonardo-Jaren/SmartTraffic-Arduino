"""Simulador serial de prueba en Linux/macOS: no controla hardware físico."""
import os
import pty
import select
import sys
import time
import tty


def responder(linea):
    partes = linea.strip().split(',')
    if len(partes) != 6 or partes[0] != 'CONFIG' or not all(p.isdigit() for p in partes[1:]):
        return None
    identificador, principal, secundaria, amarillo, todo_rojo = map(int, partes[1:])
    valido = (identificador > 0 and 15 <= principal <= 120 and 10 <= secundaria <= 90
              and principal > secundaria and 3 <= amarillo <= 10 and 2 <= todo_rojo <= 10)
    return f'ACK,{identificador},{"APLICADO,OK" if valido else "RECHAZADO,VALORES"}\n'


def ejecutar():
    maestro, esclavo = pty.openpty()
    tty.setraw(esclavo)
    print(os.ttyname(esclavo), flush=True)
    os.write(maestro, b'INICIO,1\n')
    ultimo = 0.0
    pendiente = b''
    try:
        while True:
            ahora = time.monotonic()
            if ahora - ultimo >= 1:
                os.write(maestro, b'ESTADO,SIMULADO,R,R,R,R,R,R\n')
                ultimo = ahora
            disponibles, _, _ = select.select([maestro], [], [], 0.1)
            if disponibles:
                pendiente += os.read(maestro, 256)
                while b'\n' in pendiente:
                    linea, pendiente = pendiente.split(b'\n', 1)
                    respuesta = responder(linea.decode('ascii', errors='ignore'))
                    if respuesta:
                        os.write(maestro, respuesta.encode('ascii'))
    except KeyboardInterrupt:
        pass
    finally:
        os.close(maestro)
        os.close(esclavo)


if __name__ == '__main__':
    if os.name != 'posix':
        sys.exit('El simulador PTY requiere Linux o macOS; el puente real también admite Windows.')
    ejecutar()
