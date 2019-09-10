#! /usr/bin/env sh
# @format.new-line lf, @format.use-tabs true
# SPDX-License-Identifier: AGPL-3.0-or-later
# Recompression pipelines ported from FileOptimizer 13.90.2508.
set -u
prg_name="$(basename -- "$0")"

die() {
	err_msg="$1"
	ret="${2:-1}"
	echo "${prg_name}: ${err_msg}" 1>&2
	test "X${ret}" = "X64" && echo "For help, type: ${prg_name} -h" 1>&2
	exit "${ret}"
}

print_help() (
	cat <<-EOF
		Usage: ${prg_name} [OPTION]… FILE…
		Recompress each FILE in‐place.
		
		Options:
		  -h, --help        Display this help and exit
		  -s, --strip       Strip metadata
		  -1, --fast        Recompress faster
		  -9, --best        Recompress better
	EOF
)

if [ $# -eq 0 ]; then
	print_help
	exit 64
fi

# Option defaults
level=5
keep_meta=true

for arg in "$@"; do
	case "${arg}" in
		--) shift; break;;
		--help) print_help; exit 0;;
		--strip) keep_meta=false;;
		--fast) level=1;;
		--best) level=9;;
		--?*) echo "Unrecognized option: ${arg}" 1>&2; exit 64;;
		-?*)
			OPTIND=1
			while getopts : _ "${arg}"; do
				# shellcheck disable=SC2214
				case "${OPTARG}" in
					h) print_help; exit 0;;
					s) keep_meta=false;;
					[1-9]) level="${OPTARG}";;
					*) echo "Unrecognized option: -${OPTARG}" 1>&2; exit 64;;
				esac
			done
		;;
		*) set -- "$@" "${arg}";;
	esac
	shift
done

test $# -eq 0 && die "No FILEs specified." 64

get_file_size() (
	wc -c -- "$1" | cut -f 1 -d ' '
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

if_echo() (
	if "$1"; then
		echo "$2"
	else
		echo "${3:-}"
	fi
)

DEFLUFF() (
	if command -v defluff >/dev/null 2>&1; then
		if defluff <"$1" >"$2"; then
			replace_if_smaller "$2" "$1"
		else
			rm -- "$2"
		fi
	fi
)

pingo() (
	# pingo workaround: it does not work with absolute paths.
	# This is supposed to work with only a single file. Anything else is accidental and should not be relied upon.
	for arg in "$@"; do
		shift
		case "${arg}" in
			/*)
			 	set -- "$@" "$(basename -- "${arg}")"
				cd -- "$(dirname -- "${arg}")"
			;;
			*) set -- "$@" "${arg}";;
		esac
	done
	command pingo "$@"
)

apng_check() (
	# TODO: Detect APNGs with other file extensions.
	case "$1" in
		*.[Aa][Pp][Nn][Gg]) echo "true";;
		*) echo "false";;
	esac
)
png9_check() (
	case "$1" in
		*.9.[Pp][Nn][Gg]) echo "true";;
		*) echo "false";;
	esac
)
pngico_check() (
	# TODO
	case "$1" in
		*.[Ii][Cc][Oo]|*.[Cc][Uu][Rr]|*.[Ss][Pp][Ll]) echo "true";;
		*) echo "false";;
	esac
)

for input_file in "$@"; do
	# FIXME?: Pretty much none of the utilities handle names starting with '-'. Should this script workaround that?
	# shellcheck disable=SC2039
	tmp_name="${input_file}-$$${RANDOM:+"-${RANDOM}"}"
	# FIXME: FileOptimizer can run multiple pipelines for some extensions; we only run the first one that matches here.
	# shellcheck disable=SC2046
	case "${input_file}" in
		*.[Aa][Pp][Nn][Gg]|*.[Ii][Cc][Oo]|*.[Pp][Nn][Gg]|*.[Pp][Nn][Ss])
			is_apng="$(apng_check "${input_file}")"
			is_png9="$(png9_check "${input_file}")"
			is_ico="$(pngico_check "${input_file}")"
			iterations=$((((level * level * level) / 25) + 1))
			
			${is_apng} && apngopt "${input_file}" "${tmp_name}-apngopt.png"
			replace_if_smaller "${tmp_name}-apngopt.png" "${input_file}"
			
			! ${is_png9} && pngoptimizercl $(if_echo "${keep_meta}" '-KeepPhysicalPixelDimensions') -file:"${input_file}"
			
			zlevel=$((level * 3 / 9))
			test "${zlevel}" -gt 3 && zlevel=3
			zlevel=$((zlevel + 1))
			! ${is_apng} && ! ${is_png9} && ! ${is_ico} && truepng -o"${zlevel}" $(if_echo "${keep_meta}" '-md keep all' '-tz -md remove all -a1 -g1') -i0 -nc -tz -y -out "${tmp_name}-truepng.png" "${input_file}"	# UNTESTED; should work with this wrapper: https://github.com/dbermond/shellutils/blob/master/image/truepng
			replace_if_smaller "${tmp_name}-truepng.png" "${input_file}"
			
			zlevel=$(((level * 3 / 9) - 3))
			test "${zlevel}" -lt 0 && zlevel=0	# Yes, this always results in zlevel=0… Iʼm pretty sure it is the same in FileOptimizer (a bug?)
			! ${is_apng} && ! ${is_png9} && pngout -y -r -d0 -mincodes0 $(if_echo "${keep_meta}" '-k1' '-kacTL,fcTL,fdAT') -s"${zlevel}" "${input_file}" "${tmp_name}-pngout.png"
			replace_if_smaller "${tmp_name}-pngout.png" "${input_file}"
			
			zlevel=$((level * 6 / 9))
			test "${zlevel}" -gt 6 && zlevel=6
			if ${is_apng}; then
				optipng -zw32k -protect acTL,fcTL,fdAT -o"${zlevel}" -- "${input_file}"
			else
				optipng -zw32k -o"${zlevel}" $(if_echo "${keep_meta}" '' '-strip all') -- "${input_file}"
			fi
			
			! ${is_apng} && ! "${keep_meta}" && leanify --iteration ${iterations} "${input_file}"
			
			! ${is_apng} && pngwolf --out-deflate=zopfli,iter="${iterations}" --in="${input_file}" --out="${tmp_name}-pngwolf.png"
			replace_if_smaller "${tmp_name}-pngwolf.png" "${input_file}"
			
			! ${is_apng} && ! ${is_png9} && pngrewrite "${input_file}" "${tmp_name}-pngrewrite.png"
			replace_if_smaller "${tmp_name}-pngrewrite.png" "${input_file}"
			
			! ${is_apng} && ! ${is_png9} && advpng --recompress --shrink-insane --iter=${iterations} -- "${input_file}"
			
			zlevel=$((level * 8 / 9))
			test "${zlevel}" -gt 8 && zlevel=8
			zlevel=$((zlevel + 1))
			#ECT --allfilters $(if_echo "${is_apng}" '--reuse' $(if_echo "${keep_meta}" '' '-strip')) -"${zlevel}" "${input_file}"
			
			zlevel=$((level * 8 / 9))
			test "${zlevel}" -gt 8 && zlevel=8
			! "${keep_meta}" && pingo -s"${zlevel}" "${input_file}"
			
			#! ${is_apng} && ! ${is_png9} && DeflOpt -a -b $(if_echo "${keep_meta}" '-k') "${input_file}"
			
			DEFLUFF "${input_file}" "${tmp_name}-defluff.png"
			
			#! ${is_apng} && ! ${is_png9} && DeflOpt -a -b $(if_echo "${keep_meta}" '-k') "${input_file}"
		;;
		*.[Ww][Ee][Bb][Pp])
			zlevel=$((level * 8 / 9))
			test "${zlevel}" -gt 8 && zlevel=8
			pingo -s"${zlevel}" "${input_file}"
			
			zlevel=$((level * 5 / 9))
			test "${zlevel}" -gt 5 && zlevel=5
			zlevel=$((zlevel + 1))
			dwebp -mt -o "${tmp_name}-dwebp.png" -- "${input_file}" && cwebp -mt -lossless -m "${zlevel}" -o "${tmp_name}-cwebp.webp" -- "${tmp_name}-dwebp.png"
			replace_if_smaller "${tmp_name}-cwebp.webp" "${input_file}"
			rm -- "${tmp_name}-dwebp.png" || true
		;;
		*.[Aa][Ii][Rr]|*.[Aa][Pp][Kk]|*.[Aa][Pp][Pp][Xx]|*.[Bb][Aa][Rr]|*.[Bb][Ss][Zz]|*.[Cc][Bb][Zz]|*.[Cc][Dd][Rr]|*.[Cc][Dd][Tt]|*.[Cc][Ss][Ll]|*.[Dd][Ee][Ss]|*.[Dd][Oo][Cc][Mm]|*.[Dd][Oo][Cc][Xx]|*.[Dd][Oo][Tt][Xx]|*.[Dd][Oo][Tt][Mm]|*.[Dd][Ww][Ff]|*.[Dd][Ww][Ff][Xx]|*.[Ee][Aa][Rr]|*.[Ee][Aa][Ss][Mm]|*.[Ee][Pp][Rr][Tt]|*.[Ee][Pp][Uu][Bb]|*.[Ff][Xx][Gg]|*.[Gg][Aa][Ll][Ll][Ee][Rr][Yy]|*.[Gg][Aa][Ll][Ll][Ee][Rr][Yy][Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]|*.[Gg][Aa][Ll][Ll][Ee][Rr][Yy][Ii][Tt][Ee][Mm]|*.[Gg][Rr][Ss]|*.[Ii][Nn][Kk]|*.[Ii][Pp][Ss][Ww]|*.[Ii][Tt][Zz]|*.[Ii][Pp][Aa]|*.[Ii][Tt][Aa]|*.[Jj][Aa][Rr]|*.[Kk][Mm][Zz]|*.[Kk][Ss][Ff]|*.[Kk][Mm][Zz]|*.[Ll][Xx][Ff]|*.[Mm][Dd][Zz]|*.[Mm][Ii][Zz]|*.[Mm][Mm][Ii][Pp]|*.[Mm][Vv][Zz]|*.[Mm][Pp][Pp]|*.[Mm][Ss][Zz]|*.[Nn][Aa][Rr]|*.[Nn][Bb][Kk]|*.[Nn][Oo][Tt][Ee][Bb][Oo][Oo][Kk]|*.[Oo][Dd][Bb]|*.[Oo][Dd][Ff]|*.[Oo][Dd][Gg]|*.[Oo][Dd][Pp]|*.[Oo][Dd][Ss]|*.[Oo][Dd][Tt]|*.[Oo][Ee][Xx]|*.[Oo][Ss][Kk]|*.[Oo][Xx][Pp][Ss]|*.[Pp][Kk]3|*.[Pp][Pp][Aa][Mm]|*.[Pp][Oo][Tt][Mm]|*.[Pp][Oo][Tt][Xx]|*.[Pp][Pp][Ss][Mm]|*.[Pp][Pp][Ss][Xx]|*.[Pp][Pp][Tt][Mm]|*.[Pp][Pp][Tt][Xx]|*.[Pp][Uu][Bb]|*.[Qq][Ww][Kk]|*.[Rr]2[Ss][Kk][Ii][Nn]|*.[Rr][Dd][Bb]|*.[Rr][Mm][Ss][Kk][Ii][Nn]|*.[Ss]3[Zz]|*.[Ss][Ll][Dd][Mm]|*.[Ss][Ll][Dd][Xx]|*.[Ss][Tt][Zz]|*.[Ss][Ww][Cc]|*.[Vv][Dd][Xx]|*.[Vv][Tt][Xx]|*.[Vv][Ss][Xx]|*.[Ww][Aa][Ll]|*.[Ww][Aa][Rr]|*.[Ww][Bb][Aa]|*.[Ww][Mm][Zz]|*.[Ww][Ss][Zz]|*.[Xx][Aa][Pp]|*.[Xx][Ll][Aa][Mm]|*.[Xx][Ll][Ss][Bb]|*.[Xx][Ll][Ss][Mm]|*.[Xx][Ll][Ss][Xx]|*.[Xx][Ll][Tt][Mm]|*.[Xx][Ll][Tt][Xx]|*.[Xx][Nn][Kk]|*.[Xx][Mm][Zz]|*.[Xx][Pp][Ii]|*.[Xx][Pp][Ss]|*.[Zz]01|*.[Zz]02|*.[Zz]03|*.[Zz]04|*.[Zz]05|*.[Zz]06|*.[Zz]07|*.[Zz]08|*.[Zz]09|*.[Zz]10|*.[Zz][Ii][Pp]|*.[Zz][Xx]01|*.[Zz][Xx]02|*.[Zz][Xx]03|*.[Zz][Xx]04|*.[Zz][Xx]05|*.[Zz][Xx]05|*.[Zz][Xx]06|*.[Zz][Xx]07|*.[Zz][Xx]08|*.[Zz][Xx]09|*.[Zz][Xx]10|*.[Zz][Ii][Pp][Xx])
			iterations=$((((level * level * level) / 25) + 1))
			
			leanify $(if_echo "${keep_meta}" '--keep-exif') --iteration ${iterations} --max_depth 1 "${input_file}"
			
			ect -zip $(if_echo "${keep_meta}" '' '-strip') -9 "${input_file}" && replace_if_smaller "${input_file}.zip" "${input_file}"
			
			advzip --recompress --shrink-insane --iter=${iterations} -- "${input_file}"
			
			#DeflOpt -a -b $(if_echo "${keep_meta}" '-c') "${input_file}"
			
			DEFLUFF "${input_file}" "${tmp_name}-defluff.zip"
			
			#DeflOpt -a -b $(if_echo "${keep_meta}" '-c') "${input_file}"
		;;
	esac
done
