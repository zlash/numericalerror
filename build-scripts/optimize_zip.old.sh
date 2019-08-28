#! /usr/bin/env sh
set -u

if [ $# -eq 0 ]; then
	echo "Usage: $(basename -- "$0") FILE…"
	exit 64
fi

iterations=1000

get_file_size() (
	wc --bytes "$1" | cut -d' ' -f1
)

replace_if_smaller() (
	if [ -f "$1" ]; then
		if [ "$(get_file_size "$1")" -lt "$(get_file_size "$2")" ]; then
			mv -- "$1" "$2"
		else
			rm -- "$1"
		fi
	fi
)

for input_file in "$@"; do
	strip-nondeterminism "${input_file}"
	leanify --iteration ${iterations} --max_depth 1 "${input_file}"
	#ECT -9 -zip -strip "${input_file}" && replace_if_smaller "${input_file}.zip" "${input_file}"
	advzip --recompress --shrink-insane --iter=${iterations} "${input_file}"
	#DeflOpt -a -b "${input_file}"
	#if defluff <"${input_file}" >"${input_file}.zip"; then
	#		replace_if_smaller "${input_file}.zip" "${input_file}"
	#else
	#	rm -- "${input_file}.zip"
	#fi
	#DeflOpt -a -b "${input_file}"
done
