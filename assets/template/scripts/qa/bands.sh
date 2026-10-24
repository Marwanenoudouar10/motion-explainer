#!/bin/bash
# Render ONE overlay band of the whole film (fast: no chapter art) and tile it into sheets.
# usage: scripts/qa/bands.sh tracker|captions [scale=0.5] [step=15] [from-to global frames]
#   tracker   the top band (TRACKER_BAND + 30 px): rolling number, bar, chip texts, hide windows
#             -> out/qa/tracker/band.mp4 + sheet-<n>.jpg (4 x 10 strips per page)
#             Only with FILM.tracker (src/film/config.ts); otherwise there is nothing to check.
#   captions  the caption band (from 120 px above CAPTION_BAND): paging (max 2 rows), no stacked
#             lines, the end title, and a label per page ("<id> · <rows> rows · <seconds> s", red
#             with the problem when a page breaks a caption rule)
#             -> out/qa/captions/band.mp4 + sheet-<n>.jpg (2 x 8 strips per page)
# One strip every <step> frames, left->right, top->bottom (strip k = global frame from + step*k).
# AT="565 953 1001" scripts/qa/bands.sh tracker ...   also tiles exactly those GLOBAL film frames
#   (e.g. the frame of each spoken number word) into out/qa/<band>/at.jpg, in frame order; with a
#   from-to range the range start is subtracted for you. Exit 1 if none of them is in the render.
set -e
cd "$(dirname "$0")/../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
BAND=$1; SCALE=${2:-0.5}; STEP=${3:-15}; RANGE=$4
[ "$BAND" = tracker ] && grep -Eq 'tracker:[[:space:]]*false' src/film/config.ts &&
  { echo "FILM.tracker is false (src/film/config.ts): no counter band to check"; exit 0; }
case "$BAND" in
  tracker) COMP=TrackerQA; TILE=4x10 ;;
  captions) COMP=CaptionsQA; TILE=2x8 ;;
  *) echo "usage: $0 tracker|captions [scale] [step] [from-to]" >&2; exit 1 ;;
esac
ARGS=(); [ -n "$RANGE" ] && ARGS=(--frames="$RANGE")
T=out/qa/$BAND; mkdir -p $T
nice -n 15 npx remotion render src/film/qa/entry.tsx $COMP $T/band.mp4 \
  --scale="$SCALE" --concurrency=3 --log=error "${ARGS[@]}"
rm -f $T/sheet-*.jpg
ffmpeg -nostdin -y -loglevel error -i $T/band.mp4 \
  -vf "select='not(mod(n\,$STEP))',tile=$TILE:padding=4:color=white" \
  -fps_mode vfr -start_number 1 $T/sheet-%d.jpg
echo "wrote $T/band.mp4 and $(ls $T/sheet-*.jpg | wc -l | tr -d ' ') sheet(s) $T/sheet-N.jpg"
if [ -n "$AT" ]; then
  FROM=0; [ -n "$RANGE" ] && FROM=${RANGE%%-*}
  N=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 $T/band.mp4)
  SEL=""; K=0; SKIPPED=""
  for a in $AT; do
    n=$((a - FROM))
    if [ "$n" -ge 0 ] && [ "$n" -lt "$N" ]; then SEL="$SEL+eq(n\,$n)"; K=$((K + 1)); else SKIPPED="$SKIPPED $a"; fi
  done
  [ -z "$SKIPPED" ] || echo "AT frames outside this render (global frames $FROM..$((FROM + N - 1))):$SKIPPED"
  [ "$K" -gt 0 ] || { echo "none of the AT frames is in $T/band.mp4" >&2; exit 1; }
  rm -f $T/at.jpg
  ffmpeg -nostdin -y -loglevel error -i $T/band.mp4 -vf "select='${SEL#+}',tile=1x$K:padding=4:color=white" \
    -fps_mode vfr -frames:v 1 $T/at.jpg
  echo "wrote $T/at.jpg ($K frame(s), top to bottom in frame order)"
fi
