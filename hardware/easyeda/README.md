# Shield SmartTraffic para Arduino UNO R3

## Variante para baquelita de una cara

- [PCB editable en formato Eagle](SmartTraffic_Shield_UNO_R3_Baquelita.brd).
- [PDF A4 a escala 1:1 con un único dibujo de cobre](../../output/pdf/SmartTraffic_PCB_Baquelita_1_Cara_1a1.pdf).

Se conservaron el contorno de 68,58 × 53,34 mm, los cuatro agujeros y las posiciones de las tiras J1–J4. Las ocho redes de la UART se volvieron a trazar íntegramente en cobre inferior, sin vías ni puentes. La comprobación geométrica local verificó continuidad y una separación mínima de 0,192 mm con pistas de 0,28 mm. U1, R1, C1 y C2 van del lado del cobre. Verifica el paso de 0,50 mm de U1 y la altura libre respecto al UNO con las tiras elegidas.

Para abrir la variante en EasyEDA Standard, usa **Archivo → Abrir → Eagle** y selecciona el archivo `.brd` de una cara. Para exportar la máscara desde el editor, guarda la variante, entra en **Archivo → Exportar → PDF** y selecciona únicamente el cobre inferior, con el espejo que corresponda al método de transferencia. El PDF incluido usa la vista desde la cara sin cobre. Al transferir por contacto, coloca el tóner hacia el cobre sin aplicar un espejo adicional. Imprime al 100 % y coteja la barra de 50 mm. El contorno y los agujeros de montaje se marcan con la [plantilla mecánica](../../output/pdf/SmartTraffic_Plantilla_Encaje_y_Mediciones.pdf). [Capas en EasyEDA](https://docs.easyeda.com/en/PCB/Layer-Manager/) · [Exportación de PCB](https://docs.easyeda.com/en/Export/Export-PCB/)

La máscara deja guías blancas de 0,30 mm en los pads de las tiras. El diámetro de taladro del CAD es 1,00 mm. El [exportador](exportar_baquelita.py) coteja los contactos del PCB con el esquema y comprueba la continuidad en un modelo con pérdida de cobre de 0,04 mm por borde y un margen de perforación de 0,10 mm. Estos márgenes son condiciones del modelo. Mide qué tolerancias logra tu proceso en una muestra. Para regenerar el PDF desde la raíz, ejecuta `python hardware/easyeda/exportar_baquelita.py` con ReportLab y Shapely instalados.

Quedan pendientes la importación y el DRC de esta variante en EasyEDA, la comprobación en baquelita y la etapa de los nueve semáforos. El diseño de dos caras que ya está guardado en el proyecto se conserva como referencia.

## Diseño de referencia de dos caras

Borrador para EasyEDA Standard. El proyecto existente **Smart traffic** contiene el esquema `Sheet_1` y la PCB `SmartTraffic_Shield_UNO_R3`. Para repetir la importación desde los archivos locales, abre **Archivo → Abrir → Eagle**.

La [PCB nativa de EasyEDA](SmartTraffic_Shield_UNO_R3_EasyEDA.json) conserva la revisión exportada del lienzo. Ábrela con **Archivo → Abrir → EasyEDA**. El [PDF A4 a escala 1:1](../../output/pdf/SmartTraffic_PCB_Escala_1a1.pdf) incluye ambas caras para comprobar el encaje en papel. Los archivos Eagle conservan las leyendas del borrador. La revisión nativa exportada carecía de esas dos leyendas de serigrafía.

La PCB contiene los diez componentes del esquema, ocho redes trazadas y un plano inferior de GND. EasyEDA mostró **8/8 redes y 0 errores de DRC** con las reglas del borrador. La comprobación geométrica local encontró continuidad y una separación mínima de 0,170 mm entre cobres de redes distintas. Habrá que repetir el DRC con las reglas del fabricante cuando estén todas las salidas. [Guía de importación](https://docs.easyeda.com/en/Import/Import-Eagle/) · [DRC de EasyEDA](https://docs.easyeda.com/en/PCB/Design-Rule-Check/)

La extracción de bibliotecas notificó siete símbolos rechazados, aunque las diez referencias y sus huellas quedaron visibles en el esquema y la PCB guardados. Al comparar ambos documentos, EasyEDA mostró que los componentes coincidían. La única propuesta fue añadir 28 redes de un solo pin para los contactos del UNO pendientes de asignar. La comparación se cerró sin aplicar esos cambios.

El contorno de 68,58 × 53,34 mm, los cuatro agujeros de 3,2 mm y las posiciones de J1–J4 proceden del CAD **UNO-TH Rev3e** de Arduino. Los centros de las cuatro tiras coinciden con el CAD. Las zonas del USB-B, el jack DC y el ICSP están marcadas en la capa de documentación para comprobar la altura libre al apilar el shield. Los taladros de 1 mm de las tiras se deben cotejar con el conector que se vaya a usar. La geometría adaptada del CAD de Arduino conserva su licencia CC BY-SA 4.0. [CAD del UNO R3](https://docs.arduino.cc/hardware/uno-rev3) · [Licencia](https://creativecommons.org/licenses/by-sa/4.0/)

## UART propuesta

El TXU0202 traduce las señales de 5 V del UNO y de 3,3 V del ESP32 en ambos sentidos. Su lado de 5 V toma alimentación del UNO y el lado de 3,3 V recibe la referencia del ESP32 en J5. Cada lado tiene un condensador de 100 nF. El ESP32 requiere su propia alimentación, dimensionada para el módulo elegido. [Aplicación UART de Texas Instruments](https://www.ti.com/lit/ds/symlink/txu0202.pdf)

| J5 | Conexión del lado ESP32 |
| --- | --- |
| 1 | GND común |
| 2 | Referencia de 3,3 V para el traductor |
| 3 | RX del ESP32 |
| 4 | TX del ESP32 |

Deja JP1 abierto durante la carga del sketch o el uso del puerto serie por USB. R1 mantiene el traductor deshabilitado con el puente abierto. Cierra JP1 para usar la UART con el ESP32 cuando el puerto serie USB esté libre. El conversor USB del UNO comparte D0 y D1. [Esquema oficial del UNO R3](https://docs.arduino.cc/resources/schematics/A000066-schematics.pdf)

## Reparto provisional de salidas

El punto de partida son **27 canales independientes**. S4 y S6 necesitan tiempos distintos para la ola verde. Cualquier agrupación posterior requiere demostrar coincidencia por color durante fases, cierres, arranque y pruebas individuales.

El UNO conserva el control del calendario de fases y el ESP32 mantiene el enlace Wi-Fi y aplica las fases de los cruces delegados. Mantener juntas las luces de un mismo cruce permite ejecutar el amarillo y el intervalo de todo rojo con un solo reloj local.

| Equipo de referencia | Canales para luces | Comunicación y reserva |
| --- | --- | --- |
| UNO R3 | 15 con D2–D12 y A0–A3 como salidas digitales | D0/D1 para UART. A4/A5 para supervisión. D13 queda disponible para una función que tolere el LED de la placa. |
| ESP32-S3-DevKitC-1 | 12 con GPIO4–GPIO15 | GPIO16/17 como candidatos a RX/TX de una UART adicional. GPIO18/21 para supervisión. |

Con el croquis del repositorio como hipótesis, el UNO puede llevar los dos cruces con S4 y S6 completos más un cruce de un solo semáforo. El ESP32 puede llevar el tercer cruce con dos semáforos y los otros dos cruces de una sola cabeza. El esquema todavía carece de asignaciones de los LED a estos pines. El reparto 18/9 también cubre las luces, pero ocupa las 18 E/S del UNO disponibles tras reservar la UART. [Pinout del UNO R3](https://docs.arduino.cc/resources/pinouts/A000066-full-pinout.pdf) · [Pines del ESP32-S3-DevKitC-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html)

### Cruces según el croquis v2.1 del repositorio

| Cruce | Semáforos y sentido regulado según el croquis |
| --- | --- |
| I1 | S1, V1 hacia el norte |
| I2 | S2, H1 hacia el oeste. S7, V2 hacia el sur. |
| I3 | S3, V3 hacia el norte |
| I4 | S4, H2 hacia el este. S8, V1 hacia el norte. |
| I5 | S5, V2 hacia el sur |
| I6 | S6, H2 hacia el este. S9, V3 hacia el norte. |

En `origin/main` (`46bfede`), S7–S9 son contrapartes de la simulación. El firmware físico controla S1–S6 y conserva `MAPA_CONFIRMADO=false`. La guía electrónica documenta un UNO R3 y resistencias de 2,2 kΩ en serie con LED de cátodo a GND. Las pruebas registradas indican que la placa, las resistencias y el cableado del montaje no se comprobaron. [Croquis v2.1](../../docs/ANALISIS_MAQUETA.md) · [Guía electrónica](../../docs/ELECTRONICA.md) · [Pruebas registradas](../../docs/PRUEBAS.md)

### Alternativa con decodificación por cruce

Un decodificador por cruce permite conservar los **27 canales de lámpara** con **15 señales de fase**. Cada cruce con dos semáforos usa tres bits y cada cruce con un semáforo usa dos. Con el reparto provisional anterior, serían ocho señales de fase en el UNO y siete en el ESP32, más UART y supervisión. S4 y S6 seguirían en decodificadores distintos. El [esquema de referencia](SmartTraffic_Decodificador_Cruce.sch) se abre desde **Archivo → Abrir → Eagle** y contiene un módulo independiente para probar en banco.

| Código binario del cruce doble | Semáforo A | Semáforo B |
| --- | --- | --- |
| `000` | Rojo | Rojo |
| `001` | Verde | Rojo |
| `010` | Rojo | Rojo |
| `011` | Amarillo | Rojo |
| `100` | Rojo | Rojo |
| `101` | Rojo | Rojo |
| `110` | Rojo | Verde |
| `111` | Rojo | Amarillo |

El SN74AHCT138 toma los bits en `C/B/A` (pines 3/2/1) y entrega `Y1` y `Y3` para verde y amarillo del primer semáforo, y `Y6` y `Y7` para el segundo. Son salidas activas en bajo. Para el circuito de mando de lado alto, `NAND(Y1,Y3)` y `NAND(Y6,Y7)` dan los mandos de rojo, también activos en bajo. En un cruce simple se fija `C=0` y solo se usa el primer par. El umbral alto de las entradas AHCT es 2 V con la alimentación recomendada de 4,5 a 5,5 V, por lo que el mando de 3,3 V es compatible si el módulo elegido garantiza ese nivel bajo carga. [Decodificador SN74AHCT138](https://www.ti.com/lit/ds/symlink/sn74ahct138.pdf) · [Compuertas SN74AHCT00](https://www.ti.com/product/SN74AHCT00)

Con `PERMISO=0` o `FALLO=1`, el decodificador deja todas las `Y` en alto. Los mandos de verde y amarillo quedan inactivos y las dos NAND piden rojo. En el módulo de prueba, 10 kΩ lleva `PERMISO` a GND y otros 10 kΩ llevan `FALLO` a 5 V cuando las entradas están abiertas. El supervisor debe manejar `FALLO` con una salida de drenador abierto que tolere 5 V. J2 entrega mandos lógicos activos en bajo para los drivers.

Un monoestable redisparable CD74HCT423 es candidato para que el permiso caduque y quede inactivo sin pulsos válidos. Su entrada de borrado debe mantenerlo inactivo durante el arranque, el reset y mientras el mapa esté bloqueado. El ESP32 debe dejar de renovar su permiso cuando pierda las órdenes válidas del UNO. La aplicación debe mostrar el estado de dispositivo solo mientras esté confirmado y vigente. [Monoestable CD74HCT423](https://www.ti.com/product/CD74HCT423)

El ciclo `000 → 001 → 011 → 010 → 110 → 111 → 101 → 100 → 000` cambia un solo bit en cada paso. El firmware mantiene el amarillo y el intervalo de todo rojo correspondiente antes de avanzar. Las órdenes de cierre, recuperación y prueba deben pasar por estados rojos válidos. Se verificaron por tabla todos los códigos con permiso habilitado y deshabilitado, además de la secuencia normal para uno y dos semáforos. El retardo de propagación de la lógica y los transitorios de arranque requieren comprobar en banco que las etapas de salida inhiban amarillo y verde durante las conmutaciones y mantengan rojo mientras el circuito de luces tenga tensión suficiente.

### Driver de prueba para retorno común a GND

El [esquema del driver de lado alto](SmartTraffic_Driver_Lado_Alto.sch) desarrolla un semáforo del croquis con fuente regulada de 5 V. Usa un SN74AHCT125 con salida de alta impedancia y tres MOSFET P PMV48XP. La fuente de cada MOSFET va a 5 V y el drenador alimenta su LED a través de la resistencia ya instalada en el cableado. [Buffer SN74AHCT125](https://www.ti.com/lit/ds/symlink/sn74ahct125.pdf) · [MOSFET PMV48XP](https://assets.nexperia.com/documents/data-sheet/PMV48XP.pdf)

El supervisor debe llevar `OE_N` a bajo solo con permiso válido y sin fallo, mediante una salida de drenador abierto tolerante a 5 V. Con `OE_N` alto o abierto, el buffer queda en alta impedancia. Las resistencias de compuerta fijan rojo encendido y amarillo y verde apagados una vez que la alimentación es suficiente. Las otras resistencias pertenecen al circuito de mando. Un montaje con ánodo común requiere una etapa de lado bajo.

En banco, comprueba primero que al soltar `OE_N` se active solo rojo. Después conecta los tres mandos del decodificador y prueba cada fase, la caída del permiso, el reset y la subida y caída de la alimentación. Mide tensión y corriente en los LED, y observa las conmutaciones para descartar destellos simultáneos. El esquema representa un semáforo de tres colores y queda pendiente de integrar en la PCB principal tras validar la carga y el supervisor.

## Desfase de la ola verde

La velocidad objetivo que se quiere representar es **30 km/h**. Quedan pendientes las distancias por el carril entre líneas de parada I4→I5 e I5→I6, la escala física y la velocidad de los vehículos de maqueta. Para vehículos físicos, divide la distancia de cada tramo en centímetros entre la velocidad medida en cm/s. Si se usa una escala 1:N con el objetivo de 30 km/h, el tiempo de cada tramo en segundos es `distancia_cm × N × 0,0012`. Suma los tiempos para obtener el desfase acumulado de I6 respecto a I4 y aplica el resto del ciclo cuando corresponda. Con los tiempos calculados, verifica que las llegadas queden dentro del verde y que se conserven el amarillo y el intervalo de todo rojo de cada cruce.

El tablero documentado mide 160 × 120 cm. La simulación actual usa 14 unidades entre cruces consecutivos, 4 m simulados por unidad y 45 km/h. Eso da 4,48 s por tramo virtual y 8,96 s de I4 a I6. Las distancias físicas y la velocidad de la maqueta siguen pendientes. [Mapa de la simulación](../../frontend/src/composables/simulacion/mapa.ts) · [Cálculo de fases](../../frontend/src/composables/simulacion/luces.ts)

## Antes de fabricar

- Confirma el modelo y la alimentación del ESP32, y comprueba la UART en ambos sentidos, con JP1 abierto durante la programación y con cada placa alimentada por separado.
- Verifica el cruce y el sentido de S1 a S9. Agrupa únicamente luces que coincidan durante las fases, los intervalos de todo rojo, los cierres y el modo de prueba. El firmware actual todavía direcciona las pruebas por semáforo individual.
- Identifica el valor de cada resistencia con el circuito sin alimentación. Con el LED encendido a la tensión prevista, mide la caída en esa resistencia y calcula la corriente como `I = V / R`. Dimensiona cada canal con esa corriente o la suma de ramas si se valida un grupo. Comprueba el consumo total durante todo rojo (la suma de los nueve rojos) y en cada estado permitido. Para los drivers, comprueba caída de tensión, capacidad por canal y capacidad total, y elige la topología según la polaridad y los retornos del cableado.
- Implementa y prueba el arranque en rojo, incluso durante el reset del UNO. Mantén bloqueado el ciclo automático hasta verificar el mapa. Completa el ruteo, ejecuta ERC y DRC y verifica el encaje en el UNO físico.
