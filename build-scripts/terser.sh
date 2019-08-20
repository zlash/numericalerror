#!/bin/bash

SRC_DIR="$1"
DIST_DIR="$2"

JS_FILES=$(find "$SRC_DIR" -name '*.js')

OUTPUT=$(yarn run -s terser $JS_FILES --compress ecma=6 --mangle --toplevel --warn)

echo "<!DOCTYPE html><script>${OUTPUT}</script>" > "$DIST_DIR/index.html"
