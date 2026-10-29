# Análisis inicial de las imágenes

La fotografía de color muestra dos calles horizontales y tres verticales, con seis intersecciones. Hay tres filas de manzanas, pasos peatonales, zonas verdes, edificios de colores y una zona central ajardinada. La fotografía no proporciona medidas ni muestra claramente los semáforos.

El usuario confirmó los siguientes sentidos de circulación, interpretados de las flechas de la pizarra. Se numeran los cruces de izquierda a derecha, primero la fila superior y luego la inferior:

```text
               V1 ↑             V2 ↓             V3 ↑
H1  ←────────── I1 ──────────── I2 ──────────── I3 ──────────
                │                │                │
H2  ─────────── I4 ──────────── I5 ──────────── I6 ─────────→
```

H1 y H2 son las vías principales horizontales indicadas por el usuario; V1, V2 y V3 son secundarias. En cada cruce se intersectan las trayectorias horizontal y vertical. Los recorridos deben seguir las flechas y una calle cerrada puede obligar a tomar otra ruta o a detenerse.

| Cruce | Semáforo | Posición del punto rojo | Cara hacia | Eje que vigila |
|---|---|---|---|---|
| I1 | S1 | Superior izquierda | Sur | V1, que circula al norte |
| I2 | S2 | Inferior izquierda | Este | H1, que circula al oeste |
| I3 | S3 | Superior izquierda | Sur | V3, que circula al norte |
| I4 | S4 | Superior derecha | Oeste | H2, que circula al este |
| I5 | S5 | Inferior derecha | Norte | V2, que circula al sur |
| I6 | S6 | Superior derecha | Oeste | H2, que circula al este |

Las esquinas se describen tal como se ven en la foto de la pizarra. Los seis puntos rojos fijan las posiciones y las flechas rojas dibujadas junto a ellos indican hacia dónde mira cada luz. Cada luz mira contra el flujo que vigila para quedar visible al vehículo que se acerca.

## Alcance del modelo y comprobación del montaje

- El usuario confirma **seis semáforos** en las posiciones y orientaciones marcadas. La escena mantiene exactamente seis luces fijas: S1–S6, una por cruce.
- La simulación asigna el eje que indican las flechas: S1/S3/S5 vigilan el eje V y S2/S4/S6 el eje H. Los vehículos obedecen la fase de su eje en cada cruce; que una fase se vea en la simulación no confirma que el Arduino o el cableado la controle.
- Los otros seis accesos muestran señales pasivas de ceda el paso. No son semáforos adicionales ni representan salidas del Arduino; las fases H/V de la simulación siguen evitando movimientos simultáneos incompatibles.
- El mapa eléctrico sigue pendiente de verificación. El sketch continúa bloqueado con `MAPA_CONFIRMADO=false`, y su asignación inicial de ejes no debe tomarse como cableado confirmado. Antes de habilitarlo hay que probar los 18 LEDs y comprobar qué grupo físico corresponde a cada eje.
- El usuario indica que la base física mide **160 × 120 cm**; el tablero 3D se ajusta a ese tamaño. Las calles y edificios internos siguen siendo aproximados. La conversión de simulación (5 metros por unidad) solo calcula velocidades; no es una medición interna de la maqueta ni permite afirmar tiempos reales de ola verde.

La geometría y las coordenadas internas son una aproximación a las imágenes; las seis posiciones, caras y sentidos del esquema quedan representados en la vista. Antes de activar el ciclo físico hay que comprobar el mapa eléctrico, ajustar `EJE` según la tabla y verificar las señales de ceda. La guía PDF de conexiones conserva el diseño anterior con todos los ejes H; esta tabla documenta la orientación actual del modelo.
