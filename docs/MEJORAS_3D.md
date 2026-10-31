# Escala urbana, flujo y presentación 3D

La base mantiene las proporciones físicas de 160 × 120 cm. La distribución se
compactó a 14 unidades entre cruces horizontales y 18 entre los verticales, con
4 metros por unidad: cuadras virtuales de 56 y 72 m. No son medidas verificadas
de las calles de la maqueta física.

Cada vía tiene **dos carriles en el mismo sentido**, de 0,9 unidades cada uno.
Una línea blanca discontinua los separa y las dos flechas apuntan al mismo rumbo.
Cada vehículo conserva su carril durante la ruta y los giros; las entradas,
colas y comprobaciones de salida distinguen el carril. No hay adelantamientos
ni cambios de carril. Las reservas permiten pelotones rectos de la misma aproximación por ambos carriles.
Los giros y aproximaciones perpendiculares siguen excluyéndose hasta el despeje. Los vehículos antiguos sin carril explícito
se interpretan en el carril 0.

La ciudad combina 36 edificios de cinco tipologías (oficinas, viviendas con tejado,
comercios con toldo, apartamentos con balcones y equipamiento escalonado), un solo parque
con fuente y una residencia distinta de dos plantas, techo inclinado, patio,
pérgola y cochera. Los edificios comerciales comparten ocho modelos para reducir
la memoria; la residencia tiene su propia geometría y materiales.

## Tiempos y circulación

El perfil inicial de animación usa principal 12 s, secundaria 5 s, amarillo 1 s y
todo rojo 1 s: ciclo total de 21 s. La velocidad inicial en H1/H2 es 45 km/h
y en las verticales es el 60 % (27 km/h). Una cuadra horizontal se recorre
en 4,48 s sin paradas; el desfase de la onda verde usa 45 km/h. El desfase de la onda verde se calcula con esta distancia,
no con la antigua cuadra de seis unidades.

El objetivo inicial es 16 coches, ajustable hasta 48. No se fuerza la inserción
cuando una entrada está ocupada.

- Las reservas de intersección duran hasta el despeje real; no caducan por tiempo.
- La separación longitudinal y el espacio de salida protegen las colas.
- Las reservas permiten rectos compatibles y excluyen giros conflictivos y movimientos perpendiculares. Se retiró la comprobación
  circular redundante que provocaba bloqueos entre coches detenidos fuera del cruce.
- Los coches no desaparecen por llevar varios segundos ante un cierre o sin ruta.
- Los vehículos ya autorizados terminan de salir aunque el semáforo cambie.

La validación del dispositivo mantiene sus límites anteriores (15/10/3/2 segundos
mínimos). Al cambiar de modo se carga el borrador correspondiente; los tiempos de
animación no se envían al Arduino. No se modificaron firmware, cableado ni mapa de señales.

## Diagnóstico reproducible

Desde `frontend`:

```powershell
node scripts/medir-flujo.mjs --cantidad=16
node scripts/medir-flujo.mjs --cantidad=24
```

Cinco minutos simulados, semilla 7147, pasos de 0,1 s, avenidas a 45 km/h,
intentos de ingreso cada 0,7 s y sin cierres. La espera se mide desde el segundo 30
como fracción de muestras vehículo-tiempo detenido.

| Medida | Perfil inicial: 16 coches | Carga de 24 coches |
| --- | ---: | ---: |
| Vehículos que terminan recorrido | 132 | 170 |
| Tiempo acumulado detenido | 46 % | 54 % |
| Segundos con todos los presentes detenidos | 0 | 0 |

La menor densidad inicial hace la vista más despejada; no equivale por sí sola a
una mejora del algoritmo. Un verde puede exigir esperar ante un giro en curso,
una salida ocupada o una cola. Las reservas compatibles eliminan la exclusión
artificial de coches que siguen recto por la misma aproximación. Los resultados
varían con las rutas, velocidades, cierres y semillas.

Los ceda el paso se limitan a accesos verticales sin semáforo; nunca aparecen en
H1/H2. Con el mapa virtual actual todas las verticales tienen semáforo y no se
requieren esas señales pasivas. El mapa físico y el firmware siguen sin modificarse.

## Renderizado y comprobaciones

Se recuperaron la iluminación de estudio, el fondo claro, los controles de vista
general/superior y tres perfiles de calidad. Equilibrada limita la densidad a 1,5
y usa sombras de 1024 px; detalle permite 2 y 2048 px; ahorro limita a 1 y 30 FPS
sin sombras. Son límites, no FPS garantizados. El renderizado se suspende cuando
la pestaña o la maqueta no son visibles. Las sombras se actualizan hasta 30 Hz.
La carrocería fusionada reduce cada coche de 46 a 26 mallas sin quitar triángulos.

Se validaron 59 pruebas unitarias, incluyendo carriles paralelos, parada de ambos carriles en rojo, continuidad de giros y flujo de cinco minutos con objetivos
de 24 y 48 coches, compatibilidad de reservas y exclusión de giros, entrada con verde, separación, cierres
prolongados y rechazo de tiempos cortos en la validación física. También pasaron siete pruebas de navegador (selección, cierres, pantalla completa,
móvil y desconexión). La compilación TypeScript/Vite y la revisión visual en Chromium
se realizaron sin Arduino conectado. Se corrigió la ruta del ejecutable de Python
en la configuración de Playwright para admitir rutas de Windows con espacios.
Vite conserva el aviso del módulo 3D mayor de 500 kB. No se midieron FPS en la GPU
del usuario ni se realizaron pruebas con hardware físico.
