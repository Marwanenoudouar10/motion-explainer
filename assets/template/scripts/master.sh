#!/bin/bash
# Master a rendered film to -14 LUFS integrated / -1.5 dBTP (two-pass, linear loudnorm, so
# the mix's dynamics are untouched), 48 kHz AAC 320k, video stream copied, faststart.
# usage: scripts/master.sh out/final/film-raw.mp4 [out/final/film.mp4]
# Prints the measured loudness before and after.
set -e
cd "$(dirname "$0")/.."
IN=$1; OUT=${2:-${IN%-raw.mp4}.mp4}
[ -f "$IN" ] || { echo "usage: $0 <raw.mp4> [master.mp4]" >&2; exit 1; }
[ "$IN" = "$OUT" ] && OUT=${IN%.mp4}-master.mp4
if [ -z "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN")" ]; then
  echo "$IN has no audio stream (VOICE, MUSIC and SFX in src/film/data/audio.ts are empty)." >&2
  echo "Nothing to master: deliver it as is (silent), or add a voice or music bed and re-render." >&2
  exit 1
fi
measure() { ffmpeg -hide_banner -i "$1" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'; }
m=$(measure "$IN")
[ -n "$m" ] || { echo "could not measure the loudness of $IN" >&2; exit 1; }
g() { echo "$m" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
echo "in : $(g input_i) LUFS, $(g input_tp) dBTP"
[ "$(g input_i)" != "-inf" ] || { echo "the audio of $IN is digital silence: nothing to master" >&2; exit 1; }
ffmpeg -y -loglevel error -i "$IN" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset),aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "$OUT"
m=$(measure "$OUT")
echo "out: $(g input_i) LUFS, $(g input_tp) dBTP -> $OUT"
