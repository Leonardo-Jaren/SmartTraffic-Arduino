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

| Cruce | Semáforo propuesto | Marca roja o indicación observada |
|---|---|---|
| I1 | S1 | Aproximadamente en la esquina superior izquierda |
| I2 | S2 | Aproximadamente en la esquina inferior izquierda |
| I3 | S3 | Aproximadamente en la esquina superior izquierda |
| I4 | S4 | El usuario ubicó la sexta señal al lado izquierdo del cruce inferior izquierdo |
| I5 | S5 | Aproximadamente en la esquina inferior derecha |
| I6 | S6 | Aproximadamente en la esquina superior derecha |

Las esquinas se describen tal como se ven en la foto de la pizarra. Los nombres S1–S6 se asignan aquí para facilitar el cableado; las posiciones exactas son aproximadas. Las flechas muestran el sentido de las calles y los puntos rojos muestran ubicaciones, pero no permiten comprobar la cara hacia la que apuntan las luces.

## Pendiente de confirmar

- El usuario confirma **seis semáforos físicos**, y ubicó el sexto al lado izquierdo de I4. Se usa una asignación práctica de uno por cruce, numerados S1–S6 de la misma forma que I1–I6.
- Diseño inicial: orientar los seis semáforos hacia los vehículos que circulan por las horizontales H1 y H2; la vía vertical sin semáforo tendrá **ceda el paso**, como indicó el usuario. Una sola luz de tres colores no muestra estados independientes para ambos movimientos. Ceder el paso depende de que los vehículos respeten la señal; no lo impone el Arduino.
- En la escena 3D de simulación se muestran luces virtuales para V para hacer visible la fase que siguen esos vehículos. No representan semáforos físicos confirmados y se ocultan en el modo dispositivo.
- No hay medidas que permitan calcular una escala física ni tiempos reales de una ola verde. La simulación usa una escala explícita y provisional de 5 metros por unidad, no una medición de la maqueta.

La geometría es una aproximación a las imágenes y los sentidos están confirmados por el usuario. Antes de activar el ciclo físico hay que comprobar que cada S está cableado en el cruce de la tabla y mira hacia la vía horizontal correspondiente. Si una luz se instala para una vía vertical, debe ajustarse su `EJE` en el sketch.
