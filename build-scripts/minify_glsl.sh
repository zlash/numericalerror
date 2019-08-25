#!/bin/bash
#Using https://github.com/laurentlb/Shader_Minifier

SRC_DIR="$1"
OUT_FILE="$2"
TMP_FILE="${OUT_FILE}.tmp"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


# varname path extension suffix
varName() {
    BN=`basename "$1" "$2"`
    echo ${BN}$3
}

# minifyShaders extension suffix
minifyShaders() {
    for FN in $(find "$SRC_DIR" -name "*${1}"); do
        VARNAME=$(varName "$FN" "$1" "$2")
        echo "let $VARNAME = \`precision highp float;"
        mono "$DIR/shader_minifier.exe" --preserve-all-globals --preserve-externals --format none -o - "$FN"
        echo "\`;"
    done
}

truncate -s 0 ${TMP_FILE}
minifyShaders .vert VS >> ${TMP_FILE}
minifyShaders .frag FS >> ${TMP_FILE}
mv "${TMP_FILE}" "${OUT_FILE}"
