#!/bin/bash
# Render ONE overlay band of the whole film (fast: no chapter art) and tile it into sheets.
# usage: scripts/qa/bands.sh tracker|captions [scale=0.5] [step=15] [from-to global frames]
#   tracker   top 1080x220 band: rolling number, bar, chip texts, hide windows
#             -> out/qa/tracker/band.mp4 + sheet-<n>.jpg (4 x 10 strips per page)
#   captions  caption band y 1180..1700: paging (max 2 rows), no stacked lines, end title
#             -> out/qa/captions/band.mp4 + sheet-<n>.jpg (2 x 8 strips per page)
# One strip every <step> frames, left->right, top->bottom (strip k = global frame from + step*k).
set -e
cd "$(dirname "$0")/../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
BAND=$1; SCALE=${2:-0.5}; STEP=${3:-15}; RANGE=$4
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
ffmpeg -y -loglevel error -i $T/band.mp4 \
  -vf "select='not(mod(n\,$STEP))',tile=$TILE:padding=4:color=white" \
  -fps_mode vfr -start_number 1 $T/sheet-%d.jpg
echo "wrote $T/band.mp4 and $(ls $T/sheet-*.jpg | wc -l | tr -d ' ') sheet(s) $T/sheet-N.jpg"
