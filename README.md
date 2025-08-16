# Scanner Web (Client-only, React + OpenCV.js WASM)

**Stato**: Prelavorato completo (spec + implementazione base) per scanner di documenti A4, scontrini, carte/ID.
**Obiettivi**:
- Guida utente con overlay e indicatori qualità (blur, riflesso, centratura, prospettiva).
- Autoscatto quando la qualità supera soglia.
- Foto **alta risoluzione** via `ImageCapture`, warp prospettico e post-processing.
- 100% **client-side** con **OpenCV.js (WASM)** + **Web Worker/OffscreenCanvas**.
- Modulare, single-responsibility, feature flags.

Licenze suggerite: **MIT** (progetto), **Apache-2.0** (OpenCV.js).

## Requisiti
- Browser Chromium moderno (desktop/mobile). iOS/Safari: supporto parziale (manca `ImageCapture`).
- Dev server/prod **cross-origin isolated** (COOP/COEP) per Threads+SIMD.
- OpenCV.js (WASM) servito localmente (vedi setup).

## Setup rapido
```bash
pnpm i  # o npm i / yarn
# Scarica OpenCV.js (WASM) localmente (vedi sotto) in public/opencv/
pnpm dev
```

### Scaricare OpenCV.js (WASM)
Metti i file in `public/opencv/`:
- `opencv.js`
- `opencv_wasm.wasm` (o simile, dipende dal build)

Script di esempio (Linux/macOS):
```bash
mkdir -p public/opencv
curl -L https://docs.opencv.org/4.x/opencv.js -o public/opencv/opencv.js
# Nota: il file .wasm può variare per nome; se usi un build personalizzato, copialo qui.
```

> In alternativa, usa un build custom ridotto con soli moduli **core,imgproc** per ridurre i MB.

## Architettura
- **UI React**
  - `CameraManager` (gestisce stream video)
  - `PhotoService` (takePhoto con ImageCapture)
  - `AutoCaptureController` (state machine di scatto)
  - `OverlayRenderer` (poligono + indicatori qualità)
  - `CvWorkerClient` (RPC con Worker)
  - `ExportManager` (salvataggio immagine)
  - `ConfigService` (feature flags e soglie)

- **Web Worker (CvWorker)**
  - `FrameSampler` (downscale preview)
  - `DocumentEdgeDetector` (Canny + contours + approx quad)
  - `PolygonStabilizer` (filtro temporale)
  - `QualityAssessors`:
    - Blur (Laplacian/Tenengrad)
    - Glare (% pixel saturi nel poligono)
    - Centering (offset centro doc / frame)
    - Perspective (coverage, aspect, tilt)
    - Stability (N frame consecutivi)
  - `Warper` (4-point perspective transform)
  - `PostProcessor` (CLAHE/denoise/adaptive threshold, **disattivabili**)

## Feature Flags / Soglie
- `src/config/feature-flags.json`
- `src/config/quality-thresholds.json`
- `src/config/performance-budget.json`

### Soglie iniziali
- Blur ≥ 0.35 (normalizzata)
- Glare ≤ 2% (nel poligono)
- Coverage ≥ 35%
- Center offset ≤ 10% del lato maggiore
- Stability ≥ 8 frame consecutivi
- Aspect A4 ≈ 1.414 ±10% (ID-1 ≈ 1.586 ±10%; scontrino → no vincolo)

## UX / Stati
- `Idle → Previewing → HoldingSteady → AutoCapturing → Processing → Done`
- Autoscatto solo se `READY_TO_CAPTURE` per ≥ N frame (stability).

## Performance
- Preview ≥ 20 FPS (desktop medio).
- Latenza per frame ≤ 33 ms.
- Offload nel **Worker** via `OffscreenCanvas`.
- `requestVideoFrameCallback` per sincronizzare al `<video>`.

## Fallback
- Se `ImageCapture` non disponibile → fallback `grabFrame()`/canvas (qualità inferiore).
- Se `OffscreenCanvas` assente → passaggio `ImageData` (più lento).

## Testing

### Unit (Vitest)
- Geometria: area poligono, centroide, coverage, aspect, tilt.
- Blur score: monotonia su patch blur sintetiche.
- Glare score: % saturi su maschere controllate.
- Stabilizer: convergenza e latenza su stream rumorosi.

### Integration (Worker)
- Pipeline su frame sintetici: verifica `decision` e tempi step entro budget.

### E2E (Playwright)
- Avvio browser con fake camera:
  - `--use-fake-device-for-media-stream`
  - `--use-file-for-fake-video-capture=/abs/path/test.y4m`
- Permessi: `camera`
- Scenari:
  1. A4 nitido centrato → autoscatto entro 1.5s.
  2. A4 con riflesso → nessun scatto (BAD_LIGHT).
  3. ID inclinato → scatta dopo correzione prospettiva.
  4. Scontrino lungo → warp ok senza vincolo aspect.
  5. Sfocato → nessun scatto (TOO_BLURRY).
  6. Movimento → scatta solo quando stabile.

Variabile env: `FAKE_CAM_Y4M=/abs/path/to/clip.y4m`
Se non impostata, i test E2E vengono **skippati**.

## Note licenze
- Questo progetto: MIT
- OpenCV.js: Apache-2.0 (inclusione tramite file locali)

## Roadmap
- P0: pipeline quality + autoscatto + warp + export (incluso qui)
- P1: post-processing avanzato + HUD prestazioni
- P2: MRZ/barcode (opzionale)

---

## Aggiornamenti inclusi
- **Warp prospettico completo** (getPerspectiveTransform + warpPerspective) nel worker.
- **Glare detection reale** (soglia luminanza dentro il poligono).
- **Post-processing opzionale** dietro feature flag (`enablePostProcessing`: CLAHE + adaptive threshold).
- Script **`scripts/get-opencv.sh`** per scaricare `opencv.js` automaticamente.
- **GitHub Actions** con Playwright E2E e setup OpenCV.js.

### Esecuzione rapida con OpenCV.js
```bash
npm run setup:opencv
npm run dev
```

### Attivare post-processing
Imposta in `src/config/feature-flags.json`:
```json
{ "enablePostProcessing": true }
```
Questo applica **CLAHE + adaptive threshold** dopo il warp.

### CI (GitHub Actions)
Workflow in `.github/workflows/e2e.yml`:
- setup Node + Playwright
- `npm run setup:opencv`
- `FAKE_CAM_Y4M` deve puntare a un clip `.y4m` (puoi aggiungerlo come artifact o generarlo prima dei test).


### Classificazione tipo documento (client-side)
Il worker calcola **aspect ratio** e **coverage** e usa regole configurate in `src/config/doc-types.json` per classificare:
- **A4** (target ≈ 1.414 ± tolleranza)
- **ID1** (target ≈ 1.586 ± tolleranza)
- **Receipt** (rapporto lato lungo/corto ≥ soglia)
- **Unknown** (quando nessuna regola è soddisfatta)

L’etichetta e la **confidence** sono mostrate sull’**overlay** vicino al quadrilatero.

### Policy adattiva per tipo documento
Il **decision making** usa `src/config/adaptive-policy.json` per modulare le soglie in base al tipo stimato:
- **A4/ID1**: copertura più alta, centratura più stringente.
- **Receipt**: copertura minima ridotta, centratura leggermente allentata.

### Generazione dataset Y4M (synthetic)
Per provare E2E con tipologie diverse:
```bash
bash scripts/gen-y4m.sh tests/datasets/y4m
# quindi
FAKE_CAM_Y4M=tests/datasets/y4m/a4.y4m npm run test:e2e
FAKE_CAM_Y4M=tests/datasets/y4m/id1.y4m npm run test:e2e
FAKE_CAM_Y4M=tests/datasets/y4m/receipt.y4m npm run test:e2e
```

### Servire in produzione con COOP/COEP
Per abilitare Threads/SIMD nel WASM è necessario **Cross-Origin Isolation**.

#### Server Node incluso
```bash
npm run serve:prod
# serve ./dist con COOP/COEP
```

#### Nginx (snippet)
```
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "cross-origin" always;
location / { try_files $uri /index.html; }
```
Assicurati che i file `.wasm` e `.js` siano serviti con gli header sopra.

### Report HTML E2E
I test Playwright generano un **report HTML** in `playwright-report/` e asset (screenshot + JSON) in `tests/reports/`.  
In CI vengono pubblicati come artifact scaricabili.

### Profili dispositivo
`src/config/device-profiles.json` definisce profili e override delle soglie. Puoi forzare un profilo via query:
```
http://localhost:5173/?profile=mobile-mid
```

### HUD prestazioni (flag: `enablePerfHUD`)
Mostra FPS medi e tempi step (`toMat`, `detect`, `score`) in overlay.

### Benchmark mode
Apri con `?benchmark=1` per un run di 10s; il risultato finisce in `localStorage.scanner-benchmark` e in console (`benchmark:done`).

### Metriche e logging
Le metriche recenti vengono loggate via `console.table` ogni ~2s e salvate in `localStorage.scanner-metrics` (ring buffer).

### Valutazione IoU (dataset sintetico)
- `scripts/gen-y4m.sh` ora scrive anche i **ground truth** poligonali (`*.json`) per ciascun clip.
- Test **E2E** `tests/e2e/iou.e2e.spec.ts` calcola IoU (bounding-box) fra poligono stimato e GT (`>= 0.6` come soglia di default).
- **Unit test** `tests/unit/iou.test.ts` valida la funzione IoU poligonale (Sutherland–Hodgman).


### Dev Panel (tuning live) — `?devpanel=1`
Apri l’app con `?devpanel=1` per mostrare un pannello di tuning live:
- slider per soglie (blur, glare, coverage, center offset)
- **Apply to worker** aggiorna le policy al volo (messaggio `updatePolicies`)
- recorder **telemetria** con export **JSON/CSV**
- **ProfilerChart** (line chart) dei tempi `toMat/detect/score` sugli ultimi 60 frame

### Telemetria
Il pannello permette di **Start/Stop** registrazione e di **scaricare** i dati in JSON/CSV.


### Impostazioni in-app (modal)
Dalla schermata principale premi l’icona **⚙️** per aprire la **modale Impostazioni** e abilitare/disabilitare le feature:
- **Overlay** (bounding box) e **etichetta documento**
- **Autoscatto**
- **Post-processing** (CLAHE + threshold)
- **HUD prestazioni**
- **Policy adattiva**
- **WASM Threads/SIMD** (richiede COOP/COEP; può richiedere reload)

Le scelte sono **persistite** in `localStorage` e inoltrate al **Worker** tramite `updatePolicies` (con `features`).

### Modalità scatto manuale
- Disattiva **Autoscatto** dalle **Impostazioni (⚙️)** per entrare in **modalità manuale**.
- Usa il pulsante **shutter** (in basso) o la **barra spaziatrice** per scattare.
- Se è disponibile un quadrilatero valido, verrà usato per il **warp**; altrimenti viene usato il **frame intero**.

### Flusso post-scatto (anteprima & scelta)
Dopo ogni scatto (manuale o autoscatto) si apre l’**Anteprima documento** con tre opzioni:
- **Usa questa** → conferma e aggiunge l’immagine alla **Gallery**; chiude l’anteprima.
- **Ripeti** → chiude l’anteprima e **scarta** lo scatto (torni alla camera).
- **Scatta un altro** → aggiunge l’immagine alla **Gallery** e torna subito alla camera per proseguire con ulteriori scatti.

Se il sistema non rileva chiaramente il documento, lo **shutter** mostra un tooltip (“inquadra meglio”) e all’atto del click chiede **conferma** prima di proseguire.

### Mini‑galleria (in camera)
Sopra il pulsante **shutter** trovi una mini‑galleria (fino a 4 miniature) con stile **glass**:
- Tocca una miniatura per aprire l’anteprima in modale (**Chiudi / Elimina**).
- Usa la “x” rossa per eliminare rapidamente uno scatto.
- Le miniature hanno bordi arrotondati, ombre morbide e sfondo sfocato per una **UI pulita** e moderna.

### Preset rapidi (⚙️)
Nella modale **Impostazioni** trovi tre preset per partire subito:
- **Performance**: massima fluidità, post‑processing off, overlay on, label off.
- **Qualità**: post‑processing on, overlay+label on.
- **Bilanciato**: set intermedio (di default).

### Long‑press “radial menu” sulle miniature
Tieni premuto su una miniatura per ~0.5s per far apparire un mini **menu radiale** con **Apri** e **Elimina** (mobile‑friendly).

### Animazioni
Transizioni discrete (fade/scale, hover “pop”) per mini‑galleria e modale, per una UI pulita e moderna.
