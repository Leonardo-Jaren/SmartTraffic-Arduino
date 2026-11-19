# Configuración de SmartTraffic en otra computadora

## Ejecutar la web en Windows

Instala Python compatible con `backend/requirements.txt`, Node.js 22.18 o posterior de la rama 22, o Node.js 24.12 o superior, y un navegador con WebGL. Abre PowerShell en la raíz del repositorio.

```powershell
cd backend
py -3.12 -m venv env
.\env\Scripts\python.exe -m pip install -r requirements.txt
.\env\Scripts\python.exe manage.py migrate
.\env\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

En una segunda terminal, también desde la raíz del repositorio:

```powershell
cd frontend
npm ci
npm run dev
```

Abre la URL que imprime Vite y selecciona **Simulación** para probar la interfaz. Vite envía `/api` a Django en `127.0.0.1:8000`. La API actual carece de autenticación y se ejecuta para desarrollo local. En Linux o macOS usa los [comandos del README](../README.md#instalar-y-ejecutar).

## Conectar el UNO por USB

Usa el sketch [SmartTraffic.ino](../arduino/SmartTraffic/SmartTraffic.ino) con la placa correspondiente en Arduino IDE. Mantén `MAPA_CONFIRMADO=false` hasta cotejar el cableado y los movimientos de la maqueta. El sketch versionado controla seis semáforos mediante 18 salidas y usa 115200 baudios. En el borrador del shield, JP1 debe estar abierto durante la carga del sketch y mientras el puente USB tenga el control de D0/D1.

Con el UNO conectado a la misma computadora que Django y el monitor serie cerrado, ejecuta en otra terminal, desde `backend`:

```powershell
.\env\Scripts\python.exe manage.py puente_serial --listar
.\env\Scripts\python.exe manage.py puente_serial --puerto COM3 --baud 115200
```

Sustituye `COM3` por el puerto detectado y abre **Dispositivo** en la web. La aplicación distingue los estados recibidos recientemente de los datos de simulación. Si mueves la configuración de SQLite con `SMARTTRAFFIC_DB`, usa el mismo valor para el servidor y para el puente, y ejecuta las migraciones sobre esa base. [Protocolo y arquitectura](ARQUITECTURA.md) · [Pruebas y límites](PRUEBAS.md)

## Abrir o imprimir la PCB

- [PCB para baquelita con pistas anchas](../hardware/easyeda/SmartTraffic_Shield_UNO_R3_Baquelita_EasyEDA.json). Ábrela con **Archivo → Abrir → EasyEDA**.
- [Máscara de cobre de una cara a escala 1:1](../output/pdf/SmartTraffic_PCB_Baquelita_1_Cara_1a1.pdf). Imprime en A4 al 100 % o tamaño real y confirma con una regla que la barra mide 50 mm. En esa misma hoja, corta por el centro del rectángulo de 130 × 90 mm. Las cuatro cruces marcan los taladros de montaje.
- [Archivo editable de dos caras exportado desde EasyEDA Standard](../hardware/easyeda/SmartTraffic_Shield_UNO_R3_EasyEDA.json) y su [PDF de referencia](../output/pdf/SmartTraffic_PCB_Escala_1a1.pdf).
- [Plantilla para probar el encaje y registrar las mediciones](../output/pdf/SmartTraffic_Plantilla_Encaje_y_Mediciones.pdf).
- [Esquema, PCB Eagle y módulos de referencia](../hardware/easyeda/README.md).

El UNO va centrado bajo la baquelita, con seis borneras arriba, tres abajo y la interfaz UART a su derecha. La variante de baquelita usa D0/RX y D1/TX para el ESP32 mediante U1 y J5. Los pines A0/A1 aparecen en X7. Las nueve borneras X1–X9 exponen las 18 señales D2–D13 y A0–A5. La [guía de la placa](../hardware/easyeda/README.md) indica qué señal lleva cada tornillo, cómo verificar la pieza de 3,50 mm y cuáles son los pines previstos para supervisión. EasyEDA mostró 26/26 redes y cero errores. El [PDF nativo de EasyEDA](../output/pdf/SmartTraffic_Borneras_EasyEDA_1a1.pdf) y la [hoja A4 de prueba](../output/pdf/SmartTraffic_PCB_Baquelita_1_Cara_1a1.pdf) tienen un solo dibujo de cobre. El encaje, los retornos, la corriente de las luces y los drivers siguen pendientes de validación física. El ESP32 todavía carece de firmware Wi-Fi en el repositorio.

## Recuperar cambios de la otra laptop

En la otra laptop, abre el repositorio y ejecuta:

```powershell
git status --short --branch
git diff
git diff --cached
git fetch origin
git log --oneline origin/main..HEAD
```

Revisa también los archivos nuevos que enumera `git status`. Guarda los cambios de código o documentación que quieras compartir en un commit y súbelos en una rama propia para compararlos con `main`. Conserva localmente credenciales, archivos `.env`, bases de datos, entornos virtuales y dependencias. Los cambios que aún estén solo en esa laptop quedan disponibles únicamente allí hasta que los subas.
