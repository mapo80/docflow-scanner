# Indicazioni per build e test

## Setup
1. Installa le dipendenze npm:
   ```bash
   npm install
   ```
2. Scarica OpenCV.js nella cartella `public/opencv`:
   ```bash
   npm run setup:opencv
   ```
   Se il build richiede un file `.wasm` separato, copialo manualmente nella stessa cartella.
3. (Solo per i test E2E) Installa i browser Playwright e `ffmpeg`:
   ```bash
   npx playwright install chromium
   sudo apt-get update && sudo apt-get install -y ffmpeg
   ```

## Build dell'app
Compila il progetto in modalità production:
```bash
npm run build
```
Il comando esegue `tsc -b` e `vite build` producendo l'output in `dist/`.

## Test unità e integrazione (Vitest)
1. L'ambiente predefinito richiede `jsdom`. Se manca:
   ```bash
   npm install --save-dev jsdom
   ```
2. Esegui i test:
   ```bash
   npm test
   ```

## Test end-to-end (Playwright)
1. Genera i dataset `.y4m` sintetici:
   ```bash
   bash scripts/gen-y4m.sh tests/datasets/y4m
   ```
2. Avvia i test indicando il video finto tramite la variabile `FAKE_CAM_Y4M`:
   ```bash
   FAKE_CAM_Y4M=tests/datasets/y4m/a4.y4m npm run test:e2e
   ```
   Il comando costruisce l'app e avvia automaticamente un server di produzione su `http://localhost:8080`.
   I test vengono skippati se la variabile non è impostata.

## Sviluppo locale
Per avviare il dev server:
```bash
npm run dev
```
Il server gira sulla porta 5173 per lo sviluppo, mentre i test E2E usano la build su porta 8080.
