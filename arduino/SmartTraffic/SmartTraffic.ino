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
