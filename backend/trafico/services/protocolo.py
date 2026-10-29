"""Protocolo ASCII por líneas, limitado para un Arduino UNO."""

COLORES = {'R': 'rojo', 'A': 'amarillo', 'V': 'verde'}
MODOS = {'BLOQUEADO', 'ACTIVO', 'PRUEBA', 'SIMULADO'}


def interpretar_linea(linea):
    partes = linea.strip().split(',')
    if partes == ['INICIO', '1']:
        return {'tipo': 'inicio'}
    if len(partes) == 8 and partes[0] == 'ESTADO' and partes[1] in MODOS:
        if any(color not in COLORES for color in partes[2:]):
            raise ValueError('Color desconocido')
        return {'tipo': 'estado', 'modo': partes[1], 'colores': [COLORES[c] for c in partes[2:]]}
    if len(partes) == 4 and partes[0] == 'ACK' and partes[2] in {'APLICADO', 'RECHAZADO'}:
        if not partes[1].isdigit() or not 0 < int(partes[1]) <= 4294967295:
            raise ValueError('Identificador inválido')
        if len(partes[3]) > 80:
            raise ValueError('Mensaje demasiado largo')
        return {'tipo': 'ack', 'id': int(partes[1]), 'resultado': partes[2], 'mensaje': partes[3]}
    raise ValueError('Línea serial no reconocida')


def formar_configuracion(comando):
    return (f'CONFIG,{comando.id},{comando.principal},{comando.secundaria},'
            f'{comando.amarillo},{comando.todo_rojo}\n').encode('ascii')
