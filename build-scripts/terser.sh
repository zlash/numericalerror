#!/bin/bash

SRC_DIR="$1"
DIST_DIR="$2"

JS_FILES=$(find "$SRC_DIR" -name '*.js' | sort)

TERSER_OPTIONS="--mangle --ecma 6 --toplevel --warn --mangle-props reserved=[movementX,movementY,RGBA32F,RGBA16F,RGB32F,texStorage2D,TEXTURE_BASE_LEVEL,TEXTURE_MAX_LEVEL,UNIFORM_BUFFER,getUniformBlockIndex,uniformBlockBinding,bindBufferBase]"

OUTPUT=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6,pure_funcs=console.log --define DEBUG=false)
OUTPUT_DBG=$(yarn run -s terser $JS_FILES ${TERSER_OPTIONS} --compress ecma=6 --define DEBUG=true)

DIV='<div id="O" style="margin-left:auto;margin-right:auto;width:800px;text-align:center;"><h1>NUMERICAL ERROR</h1><h3>A rushed game for js13k by Miguel Ángel Pérez Martínez (@zurashu)</h3><div id="G"><b>The plot so far:</b> An evil parasite was detected invading the timeline.<br>It sealed itself in a dungeon, in medieval times.<br>We are sending you back to the past to find it and defeat it.<br>However, as it was going to be shown in a cutscene that there was no time to create, as time and space are part of the same continuum, sending you back in time also shrinked you to a fraction of your original size.<br> Luckly, your ship is good enough to help you survive, even if you are tiny, as long as you do not crash it.<br> By the way, it looks like nothing is hapening but the game is loading, really, it takes a while because traveling back in time takes a while, but I assure you it is loading! (Your browser can become quite non-responsive during this time! Sorry! The browsers are super super super slow building shaders.)<div id="L"></div><div></div>'


echo "<!DOCTYPE html>$DIV<script>${OUTPUT}</script>" > "$DIST_DIR/index.html"
echo "<!DOCTYPE html><head><title>Debug</title></head>$DIV<script>${OUTPUT_DBG}</script>" > "$DIST_DIR/index.debug.html"


zip -j -9 "$DIST_DIR/dist.zip" "$DIST_DIR/index.html"
cp "$DIST_DIR/dist.zip" "$DIST_DIR/dist.optimized.zip"
./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.optimized.zip"

#convert -interlace plane -depth 8 -size $(stat --printf="%s" $DIST_DIR/index.html)x1+0 gray:$DIST_DIR/index.html $DIST_DIR/dist.png
#./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.png"

#cwebp -lossless $DIST_DIR/dist.png -o $DIST_DIR/dist.webp
#./build-scripts/optimize_file.sh -9 "$DIST_DIR/dist.webp"
