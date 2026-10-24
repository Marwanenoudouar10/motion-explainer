#!/bin/bash
# Master a rendered film to -14 LUFS integrated / -1.5 dBTP (two-pass, linear loudnorm, so
# the mix's dynamics are untouched), 48 kHz AAC 320k, video stream copied, faststart.
# usage: scripts/master.sh out/final/film-raw.mp4 [out/final/film.mp4]
# A linear gain to -14 LUFS needs the raw mix's true peak at or below 12.5 + its loudness (dBTP).
# A narrated mix usually peaks higher (a TTS voice at -16 LUFS peaks near -1.5 dBTP), so the
# peaks over that budget are first limited (4x oversampled alimiter, timing kept; the amount is
# printed), then the linear pass runs. LIMIT=0 skips the limiter.
# Prints the measured loudness before and after, then CHECKS the result: if loudnorm fell back to
# dynamic mode, or the master is more than 0.5 LU off -14 LUFS, or its true peak is above
# -1.0 dBTP, the file is renamed *-MISSED.mp4 and the script exits 1. Never deliver it.
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
json() { sed -n '/^{/,/^}/p'; }
measure() { ffmpeg -hide_banner -i "$1" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | json; }
m=$(measure "$IN")
[ -n "$m" ] || { echo "could not measure the loudness of $IN" >&2; exit 1; }
g() { echo "$m" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
IN_I=$(g input_i); IN_TP=$(g input_tp)
echo "in : $IN_I LUFS, $IN_TP dBTP"
[ "$IN_I" != "-inf" ] || { echo "the audio of $IN is digital silence: nothing to master" >&2; exit 1; }
LOG=$(mktemp "${TMPDIR:-/tmp}/master.XXXXXX")
LIM="$LOG.wav"; A="$IN"   # A = the audio the linear pass reads
over() { python3 -c "import sys; sys.exit(0 if float('$1') > 12.5 + float('$2') - 0.1 else 1)"; }
if [ "${LIMIT:-1}" != 0 ] && over "$IN_TP" "$IN_I"; then
  for margin in 1 2 3; do   # limiting lowers the loudness too, so step down until the budget holds
    DB=$(python3 -c "print(round(max(-24.0, 12.5 + float('$IN_I') - $margin), 2))")
    ffmpeg -nostdin -y -loglevel error -i "$IN" -vn -af "aresample=192000,alimiter=limit=$(python3 -c "print(round(10 ** ($DB / 20), 4))"):attack=5:release=50:level=0:latency=1,aresample=48000" -c:a pcm_f32le "$LIM"
    m=$(measure "$LIM"); A="$LIM"
    over "$(g input_tp)" "$(g input_i)" || break
  done
  echo "peaks: $IN_TP dBTP is over the linear budget ($(python3 -c "print(round(12.5 + float('$IN_I'), 1))") dBTP at $IN_I LUFS):" \
    "limited to $DB dBTP -> $(g input_i) LUFS (LIMIT=0 to skip)"
fi
ffmpeg -nostdin -y -hide_banner -nostats -i "$IN" -i "$A" -map "0:v?" -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):print_format=json,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "$OUT" 2> "$LOG" || { cat "$LOG" >&2; rm -f "$LOG" "$LIM"; exit 1; }
TYPE=$(json < "$LOG" | python3 -c "import json,sys;print(json.load(sys.stdin).get('normalization_type','?'))" 2>/dev/null || echo "?")
rm -f "$LOG" "$LIM"
m=$(measure "$OUT")
OUT_I=$(g input_i); OUT_TP=$(g input_tp)
echo "out: $OUT_I LUFS, $OUT_TP dBTP ($TYPE) -> $OUT"
OK=$(python3 -c "
i, tp, t = float('$OUT_I'), float('$OUT_TP'), '$TYPE'
print('yes' if t == 'linear' and abs(i + 14) <= 0.5 and tp <= -1.0 else 'no')")
if [ "$OK" != "yes" ]; then
  MISSED=${OUT%.mp4}-MISSED.mp4
  mv -f "$OUT" "$MISSED"
  NEED=$(python3 -c "print(f'{12.5 + float(\"$IN_I\"):.1f}')")
  echo "MISSED: $OUT_I LUFS, $OUT_TP dBTP ($TYPE), not -14 LUFS / -1.5 dBTP. Renamed it $MISSED: never deliver it." >&2
  echo "A linear gain to -14 needs the raw mix's true peak at or below $NEED dBTP; it is $IN_TP." >&2
  [ "${LIMIT:-1}" = 0 ] && echo "LIMIT=0 skipped the peak limiter: run without it first." >&2
  echo "Lower the hottest SFX or music clips (volume in src/film/data/audio.ts; phone_mix.py --all and" >&2
  echo "clicks.py list them), re-render with FINAL=1 and run master.sh again (it re-checks)." >&2
  exit 1
fi
echo "PASS: linear, within 0.5 LU of -14 LUFS, true peak <= -1.0 dBTP"
