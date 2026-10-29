#pragma once
#include <array>
#include <cassert>
#include <cstring>
#include <string>

using byte = unsigned char;
constexpr byte A0 = 14, A1 = 15, A2 = 16, A3 = 17, A4 = 18, A5 = 19;
constexpr int OUTPUT = 1, HIGH = 1, LOW = 0;
#define F(texto) texto

extern unsigned long relojSimulado;
extern std::array<int, 20> niveles;
unsigned long millis();
void pinMode(byte pin, int modo);
void digitalWrite(byte pin, int valor);

struct SerialSimulado {
    std::string entrada, salida;
    void begin(unsigned long) {}
    int available() const { return static_cast<int>(entrada.size()); }
    int read() { char c = entrada.front(); entrada.erase(0, 1); return c; }
    void print(const char *texto) { salida += texto; }
    void print(char c) { salida += c; }
    void print(unsigned long numero) { salida += std::to_string(numero); }
    void println(const char *texto) { salida += texto; salida += '\n'; }
    void println() { salida += '\n'; }
};
extern SerialSimulado Serial;
