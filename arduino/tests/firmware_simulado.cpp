#include "Arduino.h"
#include <iostream>

unsigned long relojSimulado = 0;
std::array<int, 20> niveles{};
SerialSimulado Serial;
unsigned long millis() { return relojSimulado; }
void pinMode(byte, int) {}
void digitalWrite(byte pin, int valor) {
    niveles.at(pin) = valor;
#if MODO_MAPA == 1
    // Tres pares de semáforos de prueba controlan H y V en el mismo cruce.
    assert(!(niveles[4] == HIGH && niveles[7] == HIGH));
    assert(!(niveles[10] == HIGH && niveles[13] == HIGH));
    assert(!(niveles[A2] == HIGH && niveles[A5] == HIGH));
#endif
}

#include RUTA_SKETCH

int main() {
    setup();
    for (int i = 0; i < 6; ++i) {
        assert(niveles[PINES[i][ROJO]] == HIGH);
        assert(niveles[PINES[i][VERDE]] == LOW);
    }
#if MODO_MAPA
    assert(mapaValido());
    bool vioHorizontal = false, vioVertical = false;
    for (relojSimulado = 0; relojSimulado <= 120000; relojSimulado += 100) {
        loop();
        vioHorizontal |= niveles[4] == HIGH;
#if MODO_MAPA == 1
        vioVertical |= niveles[7] == HIGH;
#else
        vioVertical |= niveles[2] == HIGH;
        for (int i = 1; i < 6; ++i) assert(niveles[PINES[i][VERDE]] == niveles[PINES[0][VERDE]]);
#endif
    }
    assert(vioHorizontal && vioVertical);
    Serial.salida.clear();
    Serial.entrada = "CONFIG,18,15,20,3,2\n";
    loop();
    assert(Serial.salida.find("ACK,18,RECHAZADO,VALORES") != std::string::npos);
    Serial.salida.clear();
    Serial.entrada = "CONFIG,19,45,15,3,2\n";
    for (int i = 0; i < 1600 && Serial.salida.find("ACK,19,APLICADO,OK") == std::string::npos; ++i) {
        relojSimulado += 100;
        loop();
    }
    assert(Serial.salida.find("ACK,19,APLICADO,OK") != std::string::npos);
    assert(tiempos.principal == 45);
#else
    assert(!mapaValido());
    Serial.entrada = "TEST,2,V\n";
    relojSimulado = 100;
    loop();
    assert(niveles[PINES[1][VERDE]] == HIGH);
    for (int i = 0; i < 6; ++i) if (i != 1) assert(niveles[PINES[i][ROJO]] == HIGH);
    relojSimulado = 2201;
    loop();
    for (int i = 0; i < 6; ++i) assert(niveles[PINES[i][ROJO]] == HIGH);
    Serial.entrada = "CONFIG,1,30,15,3,2\n";
    loop();
    assert(Serial.salida.find("ACK,1,APLICADO,OK") != std::string::npos);
#endif
    std::cout << (MODO_MAPA == 1 ? "Mapa mixto: fases y ACK correctos" : MODO_MAPA == 2 ? "Mapa horizontal: fases y ACK correctos" : "Bloqueo y diagnóstico correctos") << '\n';
}
