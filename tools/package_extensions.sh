#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(python3 -c 'import json, pathlib, sys; print(json.load(open(pathlib.Path(sys.argv[1]) / "jobroom-helper" / "manifest.json"))["version"])' "$ROOT")"
DIST="$ROOT/dist"

mkdir -p "$DIST"

python3 "$ROOT/tools/generate_deploy_assets.py"

CHROME_ZIP="$DIST/jobroom-helper-chrome-$VERSION.zip"
SAFARI_ZIP="$DIST/jobroom-helper-safari-source-$VERSION.zip"

(cd "$ROOT/jobroom-helper" && zip -qr "$CHROME_ZIP" . -x '*.DS_Store')
(cd "$ROOT/jobroom-helper-safari" && zip -qr "$SAFARI_ZIP" . -x '*.DS_Store')

echo "Chrome upload zip: $CHROME_ZIP"
echo "Safari source zip: $SAFARI_ZIP"
echo "Safari App Store archive must be created from the Xcode project with your Apple Developer team selected."
