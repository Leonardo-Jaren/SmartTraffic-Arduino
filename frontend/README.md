# Frontend SmartTraffic

Interfaz Vue 3 con Vite, Vue Router y Three.js. Se representan S1–S6, uno en cada cruce, con posiciones aproximadas a la foto y orientación propuesta hacia las vías horizontales. La vista de dispositivo muestra únicamente los reportes recientes del puente USB; las luces adicionales de la simulación son virtuales.

Desde esta carpeta:

```bash
npm ci
npm run dev
```

Durante el desarrollo, Vite envía `/api` a Django en el puerto 8000. Para validar el código:

```bash
npm test
npm run build
npx playwright install chromium  # una vez
npm run test:e2e
```

Las pruebas de navegador arrancan Django y Vite; asegúrate de haber creado `backend/env` e instalado sus dependencias y migraciones como indica el [README principal](../README.md). La escala, la electrónica, el protocolo y las limitaciones están documentadas en `docs/`.
