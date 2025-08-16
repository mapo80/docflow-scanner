#!/usr/bin/env bash
set -euo pipefail
IMG="${1:-}"
OUT="${2:-tests/datasets/y4m/from-image.y4m}"
DUR="${3:-3}"
[ -z "$IMG" ] && { echo "Usage: $0 input.jpg [out.y4m] [seconds]"; exit 1; }
mkdir -p "$(dirname "$OUT")"
ffmpeg -loop 1 -i "$IMG" -t "$DUR" -r 30 -pix_fmt yuv420p "$OUT" -y
echo "Wrote $OUT"
