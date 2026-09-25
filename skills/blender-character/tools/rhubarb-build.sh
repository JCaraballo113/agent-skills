#!/usr/bin/env bash
# Build Rhubarb Lip Sync natively (the official macOS release is x86_64 and segfaults under Rosetta).
# usage: rhubarb-build.sh <install-dir>     -> <install-dir>/rhubarb + res/
set -euo pipefail
DEST="${1:?install dir}"; SRC="$(mktemp -d)/rhubarb-src"
command -v cmake >/dev/null || { echo "missing cmake: brew install cmake"; exit 1; }
[[ -d "$(brew --prefix 2>/dev/null)/include/boost" ]] || { echo "missing boost: brew install boost"; exit 1; }
git clone --depth 1 --branch v1.14.0 https://github.com/DanielSWolf/rhubarb-lip-sync.git "$SRC"
mkdir -p "$SRC/build" && cd "$SRC/build"
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES="$(uname -m)" >/dev/null
cmake --build . --config Release --target rhubarb -j8 >/dev/null
BIN=$(find . -type f -name rhubarb -perm -u+x | head -1)
mkdir -p "$DEST"; cp "$BIN" "$DEST/rhubarb"
RES=$(find "$SRC" -type d -path '*/res' -maxdepth 4 | head -1); cp -R "$RES" "$DEST/res"
file "$DEST/rhubarb"; "$DEST/rhubarb" --version
