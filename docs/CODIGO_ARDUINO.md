# Código completo para Arduino UNO R3

El archivo fuente mantenible está en [`arduino/SmartTraffic/SmartTraffic.ino`](../arduino/SmartTraffic/SmartTraffic.ino). También puedes copiar el bloque completo de abajo en un sketch llamado `SmartTraffic` del Arduino IDE. Compila para **Arduino Uno (ATmega328P)**. Se ha compilado para AVR, pero no se ha cargado en una placa física en este entorno.

**Estado inicial:** el programa enciende rojo en los seis semáforos y permanece bloqueado para comprobar el cableado. El mapa visual ordena S1–S6 de I1 a I6. El croquis actualizado marca caras hacia sur, este, sur, oeste, norte y oeste; hay que comprobar qué semáforo corresponde a cada grupo de pines y ajustar su eje antes de habilitar el ciclo. `TEST` permite comprobar cada LED por separado.

```cpp
// SmartTraffic para Arduino UNO R3 (ATmega328P). Protocolo ASCII a 115200 baudios.
// El mapa físico se entrega DESACTIVADO hasta confirmar cada semaforo y su vía.
const bool MAPA_CONFIRMADO = false;
const bool VIA_SIN_SEMAFORO_CEDE = true; // Confirmado por el usuario para la maqueta.
const byte CRUCE[6] = {1, 2, 3, 4, 5, 6}; // S1–S6 propuestos para I1–I6.
const char EJE[6] = {'H', 'H', 'H', 'H', 'H', 'H'}; // H = horizontal; V = vertical.

// Por semaforo: rojo, amarillo, verde. D0/D1 se reservan para USB serial.
const byte PINES[6][3] = {
  {2, 3, 4}, {5, 6, 7}, {8, 9, 10}, {11, 12, 13},
  {A0, A1, A2}, {A3, A4, A5}
};

enum Color { ROJO, AMARILLO, VERDE };
enum Fase { ROJO_A_H, H_VERDE, H_AMARILLO, ROJO_A_V, V_VERDE, V_AMARILLO };
struct Tiempos { unsigned int principal, secundaria, amarillo, todoRojo; };
Tiempos tiempos = {30, 15, 3, 2};
Tiempos pendientes;
Fase fase = ROJO_A_H;
Color colores[6] = {ROJO, ROJO, ROJO, ROJO, ROJO, ROJO};
unsigned long inicioFase = 0, ultimoReporte = 0, inicioPrueba = 0, idPendiente = 0;
int semaforoPrueba = -1;
Color colorPrueba = ROJO;
bool hayPendiente = false;
char linea[96];
byte longitud = 0;
bool descartarLinea = false;

bool mapaValido() {
  if (!MAPA_CONFIRMADO || !VIA_SIN_SEMAFORO_CEDE) return false;
  for (byte i = 0; i < 6; i++) {
    if (CRUCE[i] < 1 || CRUCE[i] > 6 || (EJE[i] != 'H' && EJE[i] != 'V')) return false;
  }
  return true;
}

unsigned long duracionFase() {
  if (fase == H_VERDE) return (unsigned long)tiempos.principal * 1000UL;
  if (fase == V_VERDE) return (unsigned long)tiempos.secundaria * 1000UL;
  if (fase == H_AMARILLO || fase == V_AMARILLO) return (unsigned long)tiempos.amarillo * 1000UL;
  return (unsigned long)tiempos.todoRojo * 1000UL;
}

void avanzarFase(unsigned long ahora) {
  if (ahora - inicioFase < duracionFase()) return;
  inicioFase = ahora;
  switch (fase) {
    case ROJO_A_H: fase = H_VERDE; break;
    case H_VERDE: fase = H_AMARILLO; break;
    case H_AMARILLO: fase = ROJO_A_V; break;
    case ROJO_A_V: fase = V_VERDE; break;
    case V_VERDE: fase = V_AMARILLO; break;
    case V_AMARILLO: fase = ROJO_A_H; break;
  }
}

void confirmar(unsigned long id, const char *resultado, const char *mensaje) {
  Serial.print(F("ACK,")); Serial.print(id); Serial.print(',');
  Serial.print(resultado); Serial.print(','); Serial.println(mensaje);
}

bool leerNumero(const char *texto, unsigned long &valor) {
  if (!texto || !*texto) return false;
  valor = 0;
  while (*texto) {
    if (*texto < '0' || *texto > '9') return false;
    byte digito = *texto++ - '0';
    if (valor > (4294967295UL - digito) / 10UL) return false;
    valor = valor * 10UL + digito;
  }
  return true;
}

void procesarConfiguracion(char *partes[], byte cantidad) {
  unsigned long valores[5];
  if (cantidad != 6 || !leerNumero(partes[1], valores[0]) || valores[0] == 0) return;
  for (byte i = 1; i < 5; i++) {
    if (!leerNumero(partes[i + 1], valores[i])) { confirmar(valores[0], "RECHAZADO", "FORMATO"); return; }
  }
  if (valores[1] < 15 || valores[1] > 120 || valores[2] < 10 || valores[2] > 90 ||
      valores[1] <= valores[2] || valores[3] < 3 || valores[3] > 10 || valores[4] < 2 || valores[4] > 10) {
    confirmar(valores[0], "RECHAZADO", "VALORES"); return;
  }
  if (hayPendiente) { confirmar(valores[0], "RECHAZADO", "OCUPADO"); return; }
  pendientes = {(unsigned int)valores[1], (unsigned int)valores[2], (unsigned int)valores[3], (unsigned int)valores[4]};
  idPendiente = valores[0];
  hayPendiente = true;
}

void procesarPrueba(char *partes[], byte cantidad) {
  unsigned long semaforo;
  if (mapaValido() || cantidad != 3 || !leerNumero(partes[1], semaforo) || semaforo < 1 || semaforo > 6) return;
  if (partes[2][1] != '\0') return;
  if (partes[2][0] == 'R') colorPrueba = ROJO;
  else if (partes[2][0] == 'A') colorPrueba = AMARILLO;
  else if (partes[2][0] == 'V') colorPrueba = VERDE;
  else return;
  semaforoPrueba = (int)semaforo - 1;
  inicioPrueba = millis();
  Serial.print(F("PRUEBA,")); Serial.print(semaforo); Serial.print(','); Serial.println(partes[2]);
}

void procesarLinea() {
  char *partes[7];
  byte cantidad = 0;
  char *parte = strtok(linea, ",");
  while (parte && cantidad < 7) { partes[cantidad++] = parte; parte = strtok(NULL, ","); }
  if (cantidad && strcmp(partes[0], "CONFIG") == 0) procesarConfiguracion(partes, cantidad);
  else if (cantidad && strcmp(partes[0], "TEST") == 0) procesarPrueba(partes, cantidad);
}

void leerSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      if (!descartarLinea && longitud) { linea[longitud] = '\0'; procesarLinea(); }
      longitud = 0; descartarLinea = false;
    } else if (!descartarLinea) {
      if (longitud < sizeof(linea) - 1) linea[longitud++] = c;
      else { longitud = 0; descartarLinea = true; }
    }
  }
}

void aplicarConfiguracion(unsigned long ahora) {
  if (!hayPendiente) return;
  if (mapaValido() && fase != ROJO_A_H && fase != ROJO_A_V) return;
  tiempos = pendientes;
  inicioFase = ahora; // Mantiene completo el intervalo de todo rojo.
  hayPendiente = false;
  confirmar(idPendiente, "APLICADO", "OK");
}

void actualizarLuces() {
  Color deseados[6];
  bool cambia = false;
  for (byte i = 0; i < 6; i++) {
    deseados[i] = ROJO;
    if (!mapaValido() && semaforoPrueba == i) deseados[i] = colorPrueba;
    if (mapaValido() && EJE[i] == 'H' && fase == H_VERDE) deseados[i] = VERDE;
    if (mapaValido() && EJE[i] == 'H' && fase == H_AMARILLO) deseados[i] = AMARILLO;
    if (mapaValido() && EJE[i] == 'V' && fase == V_VERDE) deseados[i] = VERDE;
    if (mapaValido() && EJE[i] == 'V' && fase == V_AMARILLO) deseados[i] = AMARILLO;
    if (deseados[i] != colores[i]) cambia = true;
  }
  if (!cambia) return;
  // Apaga primero todos los verdes y amarillos antes de encender una nueva fase.
  for (byte i = 0; i < 6; i++) {
    digitalWrite(PINES[i][VERDE], LOW); digitalWrite(PINES[i][AMARILLO], LOW); digitalWrite(PINES[i][ROJO], HIGH);
  }
  for (byte i = 0; i < 6; i++) {
    if (deseados[i] != ROJO) {
      digitalWrite(PINES[i][ROJO], LOW); digitalWrite(PINES[i][deseados[i]], HIGH);
    }
    colores[i] = deseados[i];
  }
}

void enviarEstado() {
  Serial.print(F("ESTADO,"));
  Serial.print(mapaValido() ? F("ACTIVO") : semaforoPrueba >= 0 ? F("PRUEBA") : F("BLOQUEADO"));
  for (byte i = 0; i < 6; i++) {
    Serial.print(','); Serial.print(colores[i] == ROJO ? 'R' : colores[i] == AMARILLO ? 'A' : 'V');
  }
  Serial.println();
}

void setup() {
  for (byte i = 0; i < 6; i++) {
    for (byte c = 0; c < 3; c++) { pinMode(PINES[i][c], OUTPUT); digitalWrite(PINES[i][c], LOW); }
    digitalWrite(PINES[i][ROJO], HIGH);
  }
  Serial.begin(115200);
  inicioFase = millis();
  Serial.println(F("INICIO,1"));
  enviarEstado();
}

void loop() {
  unsigned long ahora = millis();
  leerSerial();
  if (semaforoPrueba >= 0 && ahora - inicioPrueba >= 2000UL) semaforoPrueba = -1;
  if (mapaValido()) avanzarFase(ahora);
  aplicarConfiguracion(ahora);
  actualizarLuces();
  if (ahora - ultimoReporte >= 1000UL) { ultimoReporte = ahora; enviarEstado(); }
}
```

## Pines y soldadura

| Semáforo | Rojo | Amarillo | Verde |
|---|---|---|---|
| S1 | D2 | D3 | D4 |
| S2 | D5 | D6 | D7 |
| S3 | D8 | D9 | D10 |
| S4 | D11 | D12 | D13 |
| S5 | A0 | A1 | A2 |
| S6 | A3 | A4 | A5 |

D0/D1 se reservan para USB serial. Cada pin va al ánodo (+) del LED correspondiente; su cátodo (−, normalmente pata corta) va a **su propia resistencia de 2,2 kΩ** y después a GND común. Consulta [electrónica](ELECTRONICA.md) antes de soldar. La asignación visual es S1→I1, S2→I2, S3→I3, S4→I4, S5→I5 y S6→I6. Las direcciones dibujadas corresponden a la cara visible del semáforo; por sí solas no verifican qué LEDs conectaste a cada salida del Arduino.

## Cargar y comprobar cada LED

1. En Arduino IDE selecciona la placa **Arduino Uno**, selecciona el puerto, copia el sketch y pulsa **Verificar** y luego **Subir**.
2. Con `MAPA_CONFIRMADO = false` deben quedar encendidos únicamente los seis rojos. Abre el monitor serial a **115200 baudios** con final de línea "Nueva línea". Debe aparecer `INICIO,1` y después `ESTADO,BLOQUEADO,R,R,R,R,R,R` aproximadamente cada segundo.
3. Con la maqueta inmóvil, envía `TEST,1,R`, `TEST,1,A` y `TEST,1,V` por separado. El LED elegido se enciende durante dos segundos; los otros semáforos permanecen en rojo. Repite cambiando el número del 1 al 6, para comprobar los 18 LEDs. `A` significa amarillo y `V` verde.
4. Si una luz no enciende, apaga USB y revisa polaridad, resistencia, soldadura, pin y tierra común antes de repetir. Durante reset puede haber un breve periodo sin LEDs encendidos.
5. Cierra el monitor serial antes de iniciar el puente: un puerto serial solo puede ser abierto por un programa a la vez.

## Confirmar el mapa antes de activar la secuencia

El sketch conserva `CRUCE = {1,2,3,4,5,6}` y `EJE = {H,H,H,H,H,H}` como valores de arranque **sin confirmar**. Según el croquis actual, el mapa visual de ejes es `EJE = {V,H,V,H,V,H}`: S1/S3/S5 vigilan el eje vertical y S2/S4/S6 el horizontal. Primero comprueba que los LEDs y el cableado reales corresponden a esa tabla; solo entonces cambia `EJE` y, después de revisar todos los cruces y las señales de ceda, `MAPA_CONFIRMADO` a `true`. No habilites la secuencia usando el valor H actual por defecto.

La fase programada es global: horizontal verde, amarillo y rojo; después se reserva un intervalo para V y otro de todo rojo. Mientras `MAPA_CONFIRMADO=false`, el circuito automático permanece bloqueado con los seis rojos, sin importar el valor de `EJE`. Si se confirma el mapa visual `{V,H,V,H,V,H}`, al habilitarlo cada grupo mostrará únicamente el eje que tiene asignado; las señales de ceda siguen siendo pasivas. No hay medición ni offsets físicos para afirmar una ola verde. La simulación web usa fases y movimientos virtuales con una escala supuesta. La [guía visual de conexiones](GUIA_VISUAL_CONEXIONES_ARDUINO.pdf) conserva la orientación anterior de los semáforos; usa el [mapa actualizado](ANALISIS_MAQUETA.md) para sus caras y ejes.

## Protocolo y cambios de tiempo

A 115200 baudios y con salto de línea:

```text
INICIO,1
ESTADO,BLOQUEADO,R,R,R,R,R,R
TEST,1,V
CONFIG,17,30,15,3,2
ACK,17,APLICADO,OK
ACK,17,RECHAZADO,VALORES
```

`CONFIG` contiene identificador, verde principal, verde secundaria, amarillo y todo rojo en segundos. Límites: principal 15–120, secundaria 10–90, principal mayor que secundaria, amarillo 3–10 y todo rojo 2–10. Con el mapa activo se aplica durante todo rojo y el ACK se envía después de aplicar. Con el mapa bloqueado se guardan los valores en RAM sin activar la secuencia. Al reiniciar vuelven los valores iniciales. Django no presenta una solicitud como aplicada hasta recibir el ACK.

Los reportes describen salidas ordenadas por el programa; sin sensores no verifican eléctricamente si un LED está encendido. El código y la guía son para una maqueta educativa, no para controlar vías reales.
