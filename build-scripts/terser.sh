#!/bin/bash

SRC_DIR="$1"
DIST_DIR="$2"

JS_FILES=$(find "$SRC_DIR" -name '*.js')

TERSER_OPTIONS="--mangle --toplevel --warn --mangle-props"

OUTPUT=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6,pure_funcs=console.log --define DEBUG=false)
OUTPUT_DBG=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6 --define DEBUG=true)

echo "<!DOCTYPE html><p><script>${OUTPUT}</script>" > "$DIST_DIR/index.html"
echo "<!DOCTYPE html><head><title>Debug</title></head><p><script>${OUTPUT_DBG}</script>" > "$DIST_DIR/index.debug.html"


zip -9 "$DIST_DIR/dist.zip" "$DIST_DIR/index.html"
cp "$DIST_DIR/dist.zip" "$DIST_DIR/dist.optimized.zip"
./build-scripts/optimize_zip.sh "$DIST_DIR/dist.optimized.zip"

