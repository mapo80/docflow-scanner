#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/opencv
echo "[setup] Downloading OpenCV.js (4.x)..."
curl -L "https://docs.opencv.org/4.x/opencv.js" -o public/opencv/opencv.js
echo "[setup] Done. Note: If your build expects a separate .wasm sidecar, place it in public/opencv/ next to opencv.js."
