#!/bin/bash
# Render the whole film (composition "Film", entry src/index.ts).
# usage: scripts/render.sh [scale=0.5] [extra remotion args]
#   -> out/film/film-<scale>.mp4 + out/film/film-<scale>-sheet-<n>.jpg
#      (one tile per second: tile k = film second k, 32 per page, left->right, top->bottom)
#   FRAMES=300-450 scripts/render.sh 0.5   only that range -> out/film/scratch/range-300-450.mp4
#   CAPTIONS=0 scripts/render.sh 1         no captions (caption contrast QA) -> out/film/film-1-nocap.mp4
#   FINAL=1 scripts/render.sh              full res, crf 16, AAC 320k -> out/final/film-raw.mp4,
#                                          then master it: scripts/master.sh out/final/film-raw.mp4
# Runs under nice -n 15 with 3 threads. One render at a time: check `pgrep -fl "remotion render"`.
set -e
cd "$(dirname "$0")/.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
SCALE=${1:-0.5}; shift || true
F=out/film; mkdir -p $F/frames $F/scratch
NAME=film-$SCALE; ARGS=(--scale="$SCALE" --concurrency=3)
[ "$CAPTIONS" = "0" ] && { NAME=$NAME-nocap; ARGS+=(--props='{"captions":false}'); }
OUT=$F/$NAME.mp4
[ -n "$FRAMES" ] && { OUT=$F/scratch/range-$FRAMES.mp4; ARGS+=(--frames="$FRAMES"); }
if [ -n "$FINAL" ]; then
  mkdir -p out/final; OUT=out/final/film-raw.mp4
  ARGS=(--scale=1 --concurrency=4 --crf=16 --audio-codec=aac --audio-bitrate=320k)
fi
start=$(date +%s)
nice -n 15 npx remotion render src/index.ts Film "$OUT" --log=error "${ARGS[@]}" "$@"
echo "render took $(( $(date +%s) - start ))s -> $OUT"
[ -n "$FINAL" ] && { echo "next: scripts/master.sh $OUT"; exit 0; }
BASE=${OUT%.mp4}
rm -f "$BASE"-sheet-*.jpg
N=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$OUT")
ROWS=$(( ( (N + 29) / 30 + 7 ) / 8 )); [ "$ROWS" -le 4 ] || ROWS=4   # short films: no blank rows
ffmpeg -y -loglevel error -i "$OUT" \
  -vf "select='not(mod(n\,30))',scale=180:-1,tile=8x$ROWS:padding=4:color=white" \
  -fps_mode vfr -start_number 1 "$BASE-sheet-%d.jpg"
echo "wrote $OUT and $(ls "$BASE"-sheet-*.jpg | wc -l | tr -d ' ') sheet(s) $BASE-sheet-N.jpg"
