#!/bin/bash
# Render ONE chapter in isolation (global background, tracker and captions shifted to the
# chapter's place in the film) -> out/chapters/<id>/preview.mp4 + sheet.jpg
# usage: scripts/preview.sh C05 [scale=0.4]
#   FRAMES=60-120 scripts/preview.sh C05   only that range (fast iteration)
#                                           -> out/chapters/<id>/scratch/range-60-120.mp4 (+ -sheet.jpg)
#   CAPTIONS=0 scripts/preview.sh C05       no captions (caption-band contrast QA)
#                                           -> out/chapters/<id>/scratch/nocap.mp4 (+ -sheet.jpg)
# Sheet: one tile every 15 frames, left->right, top->bottom (tile k = chapter-local frame 15k;
# for a FRAMES=a-b range, tile k = frame a + 15k).
# Runs under nice -n 15 with 4 threads, so the machine stays usable. One render at a time.
set -e
cd "$(dirname "$0")/.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
ID=$1; SCALE=${2:-0.4}
[ -n "$ID" ] || { echo "usage: $0 <ChapterId> [scale]" >&2; exit 1; }
ENTRY=$(scripts/entry.sh "$ID")
D=out/chapters/$ID; mkdir -p "$D/frames" "$D/scratch"
OUT="$D/preview.mp4"; SHEET="$D/sheet.jpg"; ARGS=()
if [ -n "$FRAMES" ]; then OUT="$D/scratch/range-$FRAMES.mp4"; SHEET="$D/scratch/range-$FRAMES-sheet.jpg"; ARGS+=(--frames="$FRAMES"); fi
if [ "$CAPTIONS" = "0" ]; then
  OUT="$D/scratch/${FRAMES:+range-$FRAMES-}nocap.mp4"; SHEET="${OUT%.mp4}-sheet.jpg"; ARGS+=(--props='{"captions":false}')
fi
start=$(date +%s)
nice -n 15 npx remotion render "$ENTRY" "$ID" "$OUT" --scale="$SCALE" --concurrency=4 --log=error "${ARGS[@]}"
echo "render took $(( $(date +%s) - start ))s"
N=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$OUT")
ROWS=$(( ( (N + 14) / 15 + 7 ) / 8 ))
ffmpeg -y -loglevel error -i "$OUT" \
  -vf "select='not(mod(n\,15))',scale=216:-1,tile=8x$ROWS:padding=6:color=white" \
  -frames:v 1 "$SHEET"
echo "wrote $OUT ($N frames) and $SHEET"
