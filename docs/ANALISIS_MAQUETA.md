# Análisis de la maqueta y esquema de semáforos (v-2.1)

La maqueta física cuenta con dos avenidas principales horizontales (H1 y H2) y tres calles secundarias verticales (V1, V2 y V3), formando seis intersecciones (I1 a I6).

```text
               V1 ↑             V2 ↓             V3 ↑
H1  ←────────── I1 ──────────── I2 ──────────── I3 ──────────
                │                │                │
H2  ─────────── I4 ──────────── I5 ──────────── I6 ─────────→
```

## Distribución de los 9 Semáforos (v-2.1)

En la versión 2.1, los 3 semáforos de las líneas horizontales (S2 en I2, S4 en I4 y S6 en I6) incorporan sus contrapartes perpendiculares en el mismo cruce (S7 en I2, S8 en I4 y S9 en I6) para regular tanto el flujo horizontal como el vertical de forma totalmente visible en 3D, sumando un total de **9 semáforos**:

| Cruce | Semáforo | Esquina / Posición | Cara hacia | Eje que vigila | Función / Relación |
|---|---|---|---|---|---|
| I1 | S1 | SO (Inferior Izq) | Sur (+Z) | V1 (al Norte) | Regula flujo vertical en I1 |
| I2 | S2 | NE (Superior Der) | Este (+X) | H1 (al Oeste) | Regula avenida horizontal en I2 |
| I3 | S3 | SO (Inferior Izq) | Sur (+Z) | V3 (al Norte) | Regula flujo vertical en I3 |
| I4 | S4 | NO (Superior Izq) | Oeste (-X) | H2 (al Este) | Regula avenida horizontal en I4 |
| I5 | S5 | NE (Superior Der) | Norte (-Z) | V2 (al Sur) | Regula flujo vertical en I5 |
| I6 | S6 | NO (Superior Izq) | Oeste (-X) | H2 (al Este) | Regula avenida horizontal en I6 |
| I2 | S7 | NO (Superior Izq) | Norte (-Z) | V2 (al Sur) | **Contraparte de S2** en I2 (Vertical) |
| I4 | S8 | SE (Inferior Der) | Sur (+Z) | V1 (al Norte) | **Contraparte de S4** en I4 (Vertical) |
| I6 | S9 | SE (Inferior Der) | Sur (+Z) | V3 (al Norte) | **Contraparte de S6** en I6 (Vertical) |

- **Orientación 3D realista**: Cada semáforo está posicionado sobre la acera del acceso correspondiente y su cara óptica (con viseras parasol y lentes emisivas) apunta directamente hacia los conductores que se aproximan en contraflujo.
- **Contrapartes seguras**: En I2, I4 e I6, cuando el semáforo horizontal está en verde/amarillo, su contraparte vertical está en rojo estricto, y viceversa.
- **Compatibilidad con Arduino UNO**: El Arduino UNO físico dispone de 18 pines para 6 semáforos físicos (S1–S6). La aplicación web mapea S7, S8 y S9 como contrapartes calculadas en tiempo real para mantener la seguridad vial garantizada tanto en modo Simulación como en modo Dispositivo.

## Control Adaptativo ante Cierres de Calle (Relajación de Tráfico)

- Al cerrar un tramo en la maqueta, el sistema analiza en tiempo real las entradas afectadas.
- Si se bloquea un acceso vertical hacia un cruce, se minimiza la fase secundaria y se amplía el verde de la avenida horizontal para evacuar el tráfico sin paradas innecesarias.
- Si se bloquea la avenida horizontal, se amplía el tiempo de verde de las vías secundarias adyacentes para dar paso prioritario a las rutas de desvío y relajar la congestión.

## Mejoras de Vehículos y Dinámica 3D (v-2.1)

1. **Diseño de vehículos y llantas**:
   - Modelado con pasos de rueda esculpidos para evitar colisiones visuales entre el chasis y los neumáticos.
   - Llantas de aleación deportiva con neumáticos de caucho biselados, alineados geométricamente al eje X horizontal.
   - Rotación pura de rodadura sin oscilaciones ni acoplamientos angulares extraños.
2. **Lógica de frenado en rojo**:
   - Los vehículos detienen su marcha exactamente en la línea de parada ante luces rojas o amarillas.
   - Las reservas de cruce sólo se efectúan tras cruzar la línea de detención con luz verde confirmada.
3. **Prevención espacial de solapamientos**:
   - Distancia de seguimiento 3D Euclidiana en plano XZ, evitando que vehículos en distintas calles o giros queden pegados o superpuestos.
4. **Flujo continuo permanente (Anti-Deadlock Watchdog)**:
   - Detección y resolución automática de bloqueos tras cierres viales sin salida para garantizar que la simulación no se detenga y continúe fluyendo indefinidamente.
