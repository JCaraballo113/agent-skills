#!/usr/bin/env bash
# Full animation render in a background Blender, then encode (and mux a voice track).
# usage: render.sh file.blend out.mp4 [--percent 50] [--audio voice.wav --audio-frame 146] [--fps 24]
set -euo pipefail
BLEND="$1"; OUT="$2"; shift 2
PERCENT=50; AUDIO=""; AFRAME=1; FPS=24
while [[ $# -gt 0 ]]; do case "$1" in
  --percent) PERCENT="$2"; shift 2;; --audio) AUDIO="$2"; shift 2;;
  --audio-frame) AFRAME="$2"; shift 2;; --fps) FPS="$2"; shift 2;; *) echo "unknown $1"; exit 2;; esac; done
BLENDER="${BLENDER:-$(command -v blender || echo /Applications/Blender.app/Contents/MacOS/Blender)}"
FRAMES="$(mktemp -d)/frame_"
"$BLENDER" -b "$BLEND" --python-expr "
import bpy; sc = bpy.context.scene
sc.render.resolution_percentage = $PERCENT; sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = '$FRAMES'" -a > "${FRAMES%frame_}render.log" 2>&1
N=$(find "$(dirname "$FRAMES")" -name 'frame_*.png' | wc -l | tr -d ' ')
echo "rendered $N frames -> $(dirname "$FRAMES")"
if [[ -n "$AUDIO" ]]; then
  MS=$(python3 -c "print(int(round(($AFRAME - 1) / $FPS * 1000)))")
  ffmpeg -y -loglevel error -framerate "$FPS" -i "${FRAMES}%04d.png" -i "$AUDIO" \
    -filter_complex "[1:a]adelay=${MS}|${MS},apad[a]" -map 0:v -map "[a]" \
    -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest "$OUT"
else
  ffmpeg -y -loglevel error -framerate "$FPS" -i "${FRAMES}%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "$OUT"
fi
echo "video: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s)"
