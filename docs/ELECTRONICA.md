# Electrónica: seis semáforos con LEDs individuales

La guía ilustrada paso a paso está en [GUIA_VISUAL_CONEXIONES_ARDUINO.pdf](GUIA_VISUAL_CONEXIONES_ARDUINO.pdf). Incluye el mapa de los seis cruces, las 18 conexiones, pruebas y el firmware.

## Capacidad del UNO R3

Seis semáforos × tres luces = **18 salidas**. Un UNO R3 dispone de D0–D13 y A0–A5, que también pueden usarse como digitales. La comunicación USB serial comparte D0/RX y D1/TX; reservarlos deja D2–D13 (12) + A0–A5 (6) = **18 salidas exactas**. A4/A5 también son SDA/SCL y dejan de estar disponibles para I²C. D13 comparte el LED integrado de la placa.

Por tanto, para estos 18 LEDs indicadores no hacen falta 74HC595. No queda un pin libre para sensores u otro semáforo. Si se amplía el montaje, se puede rediseñar con **tres 74HC595** encadenados (24 salidas) y tres pines de datos/reloj/latch, o con controladores externos adecuados; esa ampliación no está conectada ni implementada. El botón de agregar luces de la web añade únicamente luces **virtuales**.

## Tabla eléctrica propuesta

Cada S identifica un semáforo y sus tres pines. Para el montaje se propone S1 en I1, S2 en I2, S3 en I3, S4 en I4, S5 en I5 y S6 en I6, todos orientados hacia las vías horizontales. Confirma esa orientación al instalar: no es visible con certeza en los puntos rojos. Conecta el ánodo de cada LED al pin indicado y su cátodo mediante una resistencia propia de 2,2 kΩ a GND.

| Semáforo | Cruce propuesto | Rojo (+) | Amarillo (+) | Verde (+) | Cada cátodo (−) |
|---|---|---|---|---|---|
| S1 | I1 | D2 | D3 | D4 | Resistencia de 2,2 kΩ → GND |
| S2 | I2 | D5 | D6 | D7 | Resistencia de 2,2 kΩ → GND |
| S3 | I3 | D8 | D9 | D10 | Resistencia de 2,2 kΩ → GND |
| S4 | I4 | D11 | D12 | D13 | Resistencia de 2,2 kΩ → GND |
| S5 | I5 | A0 | A1 | A2 | Resistencia de 2,2 kΩ → GND |
| S6 | I6 | A3 | A4 | A5 | Resistencia de 2,2 kΩ → GND |

## Soldadura sin protoboard

1. Identifica cada LED de dos patas: normalmente la pata larga es el ánodo (+) y la corta el cátodo (−); verifica también la marca plana o la hoja de datos del LED. No asumas que esto aplica a módulos RGB de ánodo/cátodo común.
2. Suelda el ánodo al cable que va al pin de la tabla. Suelda una resistencia **individual** de 2,2 kΩ a la pata corta/cátodo. El otro extremo de cada resistencia va a una distribución común de GND conectada al GND del UNO. La resistencia funciona igual en el cátodo o en el ánodo, siempre que esté en serie con ese LED.
3. Aísla cada unión con tubo termorretráctil y revisa con multímetro continuidad y ausencia de cortocircuitos antes de conectar USB. Fija mecánicamente los cables para que no tiren de las patas soldadas.
4. Alimenta el UNO por USB estable. Para el cableado de distribución, coloca un condensador cerámico de 100 nF entre 5V y GND cerca de la distribución; la placa ya tiene su propio desacoplo. Todos los retornos deben compartir GND. Los LEDs descritos se alimentan desde los pines, no directamente desde 5V.
5. El firmware mantiene una luz por semáforo. Durante arranque/reset los pines pueden estar momentáneamente en alta impedancia y las luces apagadas: no es un sistema de seguridad para vías reales.

## Corriente y resistencias

Para un LED rojo de ejemplo con caída de 2 V y salida aproximada de 5 V: `R = (5 − 2) / I`; con 2.200 Ω, `I ≈ 1,36 mA`. Con seis LEDs de ese tipo encendidos, el total sería aproximadamente 8,2 mA, más el LED integrado de D13 cuando corresponda. La caída real y el brillo dependen del LED; algunos LEDs pueden necesitar otra resistencia calculada con su hoja de datos. Los límites por pin y por puerto/alimentación del ATmega328P también deben respetarse; **20 mA es la corriente recomendada por pin en la especificación del UNO R3, no una meta**, y 40 mA es un límite absoluto del microcontrolador, no una corriente de trabajo.

Esta propuesta es para LEDs indicadores pequeños de dos patas, con corriente baja. No conecta tiras LED, lámparas de potencia ni relés directamente: esas cargas requieren transistores/MOSFET y, si corresponde, una fuente externa adecuada y tierra común. No se ha medido el montaje físico.

## Señalización de cruces

El usuario confirmó que la vía perpendicular sin semáforo tendrá una señal de **ceda el paso**. Esto no impone eléctricamente el comportamiento de los vehículos: debe respetarse en la maqueta. Para controlar físicamente ambos movimientos con luces independientes se necesitan semáforos adicionales y una expansión de salidas. La aplicación permite añadir semáforos **virtuales**, pero no crea salidas físicas.

Con la asignación actual `EJE = {H,H,H,H,H,H}`, los seis focos controlan las horizontales. Durante las fases del programa reservadas al eje V, todos los LEDs físicos permanecen rojos; el ceda es pasivo y no hay verde vertical. Esta secuencia exacta está descrita en la guía. Si el diseño necesita mostrar verde físico en una vía secundaria, habrá que cambiar la distribución de señales y verificar una nueva lógica segura antes de habilitar el mapa.
