#!/usr/bin/env bash
# Contact sheet from a video or a frame pattern. Cheap to read back; use it instead of full frames.
# usage: sheet.sh <video.mp4 | dir/frame_%04d.png> out.png [--frames 100,160,178,231] [--every 5] [--cols 4] [--width 400]
#        [--crop "iw*0.5:ih*0.4:iw*0.25:ih*0.1"]
set -euo pipefail
IN="$1"; OUT="$2"; shift 2
FRAMES=""; EVERY=5; COLS=4; W=400; CROP=""
while [[ $# -gt 0 ]]; do case "$1" in
  --frames) FRAMES="$2"; shift 2;; --every) EVERY="$2"; shift 2;; --cols) COLS="$2"; shift 2;;
  --width) W="$2"; shift 2;; --crop) CROP="$2"; shift 2;; *) echo "unknown $1"; exit 2;; esac; done
if [[ -n "$FRAMES" ]]; then
  SEL=$(echo "$FRAMES" | tr ',' '\n' | sed 's/.*/eq(n\\,&)/' | paste -sd+ -); N=$(echo "$FRAMES" | tr ',' '\n' | wc -l | tr -d ' ')
else
  SEL="not(mod(n\\,$EVERY))"; N=8
fi
ROWS=$(( (N + COLS - 1) / COLS ))
VF="select='$SEL'"; [[ -n "$CROP" ]] && VF="$VF,crop=$CROP"
IARGS=(-i "$IN"); [[ "$IN" == *%* ]] && IARGS=(-framerate 24 -i "$IN")
ffmpeg -y -loglevel error "${IARGS[@]}" -vf "$VF,scale=$W:-1,tile=${COLS}x${ROWS}" -frames:v 1 "$OUT"
echo "sheet: $OUT"
