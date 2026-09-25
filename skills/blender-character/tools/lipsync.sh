#!/usr/bin/env bash
# Timed mouth shapes (A-H, X) for a voice line. Deterministic for a given wav + text.
# usage: lipsync.sh <rhubarb-binary> line.wav [line.txt]   -> line.rhubarb.json
set -euo pipefail
RH="$1"; WAV="$2"; TXT="${3:-${WAV%.wav}.txt}"; OUT="${WAV%.wav}.rhubarb.json"
ARGS=(-r pocketSphinx -f json --extendedShapes GHX -o "$OUT")
[[ -f "$TXT" ]] && ARGS+=(--dialogFile "$TXT")
"$RH" "${ARGS[@]}" "$WAV"
python3 -c "import json;c=json.load(open('$OUT'))['mouthCues'];print(len(c),'cues:',' '.join(f\"{x['start']:.2f}{x['value']}\" for x in c[:12]),'...')"
