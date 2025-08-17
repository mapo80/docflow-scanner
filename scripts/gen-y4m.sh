#!/usr/bin/env bash
set -euo pipefail
OUTDIR=${1:-tests/datasets/y4m}
mkdir -p "$OUTDIR"

# Generate synthetic videos with rectangles approximating document shapes

# A4 (aspect ~1.414), centered white rectangle on gray background
ffmpeg -f lavfi -i color=c=gray:s=1280x720:r=30 -f lavfi -i color=c=white:s=566x400 -filter_complex "overlay=(W-w)/2:(H-h)/2" -t 3 -pix_fmt yuv420p "$OUTDIR/a4.y4m" -y

# ID1 (aspect ~1.586), smaller card
ffmpeg -f lavfi -i color=c=gray:s=1280x720:r=30 -f lavfi -i color=c=white:s=476x300 -filter_complex "overlay=(W-w)/2:(H-h)/2" -t 3 -pix_fmt yuv420p "$OUTDIR/id1.y4m" -y

# Receipt (very elongated)
ffmpeg -f lavfi -i color=c=gray:s=1280x720:r=30 -f lavfi -i color=c=white:s=200x700 -filter_complex "overlay=(W-w)/2:(H-h)/2" -t 3 -pix_fmt yuv420p "$OUTDIR/receipt.y4m" -y

echo "Generated Y4M clips under $OUTDIR"

# Emit ground-truth JSON metadata with rectangle coordinates
cat > "$OUTDIR/a4.json" <<EOF
{"width":1280,"height":720,"polygon":[
  {"x":$(((1280-566)/2)),"y":$(((720-400)/2))},
  {"x":$(((1280-566)/2+566)),"y":$(((720-400)/2))},
  {"x":$(((1280-566)/2+566)),"y":$(((720-400)/2+400))},
  {"x":$(((1280-566)/2)),"y":$(((720-400)/2+400))}
]}
EOF

cat > "$OUTDIR/id1.json" <<EOF
{"width":1280,"height":720,"polygon":[
  {"x":$(((1280-476)/2)),"y":$(((720-300)/2))},
  {"x":$(((1280-476)/2+476)),"y":$(((720-300)/2))},
  {"x":$(((1280-476)/2+476)),"y":$(((720-300)/2+300))},
  {"x":$(((1280-476)/2)),"y":$(((720-300)/2+300))}
]}
EOF

cat > "$OUTDIR/receipt.json" <<EOF
{"width":1280,"height":720,"polygon":[
  {"x":$(((1280-200)/2)),"y":$(((720-700)/2))},
  {"x":$(((1280-200)/2+200)),"y":$(((720-700)/2))},
  {"x":$(((1280-200)/2+200)),"y":$(((720-700)/2+700))},
  {"x":$(((1280-200)/2)),"y":$(((720-700)/2+700))}
]}
EOF

echo "Wrote GT JSON for clips in $OUTDIR"
