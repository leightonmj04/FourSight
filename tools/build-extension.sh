#!/bin/sh
# Builds the FourSight Chrome extension from public/ plus extension/:
#   dist/foursight-extension/        load this folder in chrome://extensions (Load unpacked) to test
#   dist/foursight-<version>.zip     upload this to the Chrome Web Store developer dashboard
# Run from anywhere: sh tools/build-extension.sh
set -e
cd "$(dirname "$0")/.."
NODE="${NODE:-$(command -v node || echo "$HOME/.local/node/bin/node")}"

# Refuse to package program data that fails its own checks.
"$NODE" tools/validate-programs.js > /dev/null || { echo "Program data failed validation; run node tools/validate-programs.js"; exit 1; }

VERSION=$("$NODE" -p "require('./extension/manifest.json').version")
OUT=dist/foursight-extension
rm -rf "$OUT"
mkdir -p "$OUT"
cp -R public/. "$OUT/"
cp extension/manifest.json extension/background.js "$OUT/"
mkdir -p "$OUT/icons" && cp extension/icons/*.png "$OUT/icons/"
find "$OUT" -name .DS_Store -delete

# Extensions may not load code from the internet; stop if anything slipped back in.
if grep -rIlE "src=\"https?://|https?://[^\"' ]+\.js" "$OUT" --include=*.html --include=*.js --exclude-dir=lib > /dev/null; then
  echo "Remote script reference found in the build:"; grep -rIlE "src=\"https?://|https?://[^\"' ]+\.js" "$OUT" --include=*.html --include=*.js --exclude-dir=lib; exit 1
fi

ZIP="dist/foursight-$VERSION.zip"
rm -f "$ZIP"
(cd "$OUT" && zip -qrX "../$(basename "$ZIP")" .)
echo "Built $OUT and $ZIP ($(du -h "$ZIP" | cut -f1 | tr -d ' '))"
