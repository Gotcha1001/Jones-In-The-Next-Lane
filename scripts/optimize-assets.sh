#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Images: max 1920px wide, JPEG q80 / optimised PNG =="
find public -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -print0 | while IFS= read -r -d '' f; do
  convert "$f" -auto-orient -resize '1920x1920>' -strip -interlace Plane -sampling-factor 4:2:0 -quality 80 "$f.tmp.jpg"
  mv "$f.tmp.jpg" "$f"
done
find public -type f -iname '*.png' -print0 | while IFS= read -r -d '' f; do
  convert "$f" -resize '1920x1920>' -strip -define png:compression-level=9 "$f.tmp.png"
  mv "$f.tmp.png" "$f"
done

echo "== Avatars: 512px is plenty =="
find public/avatars -type f -iname '*.jpg' -print0 | while IFS= read -r -d '' f; do
  convert "$f" -resize '512x512>' -strip -quality 80 "$f.tmp.jpg"
  mv "$f.tmp.jpg" "$f"
done

echo "== Videos: 1280px wide, H.264 CRF 28, no audio, fast-start =="
find public/videos -type f -iname '*.mp4' -print0 | while IFS= read -r -d '' f; do
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale='min(1280,iw)':-2,fps=30" \
    -c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p \
    -an -movflags +faststart "$f.tmp.mp4"
  mv "$f.tmp.mp4" "$f"
done

echo "== Done =="
du -sh public
