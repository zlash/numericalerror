#!/bin/bash

SRC_DIR="$1"
DIST_DIR="$2"

JS_FILES=$(find "$SRC_DIR" -name '*.js' | sort)

TERSER_OPTIONS="--mangle --ecma 6 --toplevel --warn --mangle-props reserved=[movementX,movementY,RGBA32F,RGBA16F,RGB32F,texStorage2D,TEXTURE_BASE_LEVEL,TEXTURE_MAX_LEVEL,UNIFORM_BUFFER,getUniformBlockIndex,uniformBlockBinding,bindBufferBase]"

OUTPUT=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6,pure_funcs=console.log --define DEBUG=false)
OUTPUT_DBG=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6 --define DEBUG=true)

echo "<!DOCTYPE html><p><script>${OUTPUT}</script>" > "$DIST_DIR/index.html"
echo "<!DOCTYPE html><head><title>Debug</title></head><p><script>${OUTPUT_DBG}</script>" > "$DIST_DIR/index.debug.html"


zip -j -9 "$DIST_DIR/dist.zip" "$DIST_DIR/index.html"
cp "$DIST_DIR/dist.zip" "$DIST_DIR/dist.optimized.zip"
./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.optimized.zip"

#convert -interlace plane -depth 8 -size $(stat --printf="%s" $DIST_DIR/index.html)x1+0 gray:$DIST_DIR/index.html $DIST_DIR/dist.png
#./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.png"

#cwebp -lossless $DIST_DIR/dist.png -o $DIST_DIR/dist.webp
#./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.webp"
