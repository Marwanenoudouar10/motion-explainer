#!/bin/bash
# Exact frames as PNG.
# usage: scripts/frame.sh C05 0 45 120     chapter-local frames -> out/chapters/C05/frames/f45.png
#        scripts/frame.sh film 300 900     global film frames   -> out/film/frames/f300.png
#   default: cut from the latest preview (out/chapters/<id>/preview.mp4, or out/film/film-*.mp4);
#            run preview.sh / render.sh first. Same scale as that render.
#   FULL=1 scripts/frame.sh C05 45          render a full-resolution still instead (no mp4 needed)
set -e
cd "$(dirname "$0")/.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
ID=$1; shift || true
[ -n "$ID" ] && [ $# -gt 0 ] || { echo "usage: $0 <ChapterId|film> <frame> [frame...]" >&2; exit 1; }
if [ "$ID" = "film" ]; then
  D=out/film; SRC=$(ls -t out/film/film*.mp4 2>/dev/null | head -1); ENTRY=src/index.ts; COMP=Film
else
  D=out/chapters/$ID; SRC=$D/preview.mp4; COMP=$ID
fi
mkdir -p "$D/frames"
if [ -z "$FULL" ] && [ -n "$SRC" ] && [ -f "$SRC" ]; then
  for f in "$@"; do
    ffmpeg -y -loglevel error -i "$SRC" -vf "select=eq(n\,$f)" -vframes 1 "$D/frames/f$f.png"
    echo "$D/frames/f$f.png"
  done
else
  [ "$ID" = "film" ] || ENTRY=$(scripts/entry.sh "$ID")
  for f in "$@"; do
    nice -n 15 npx remotion still "$ENTRY" "$COMP" "$D/frames/f$f.png" --frame="$f" --log=error
    echo "$D/frames/f$f.png"
  done
fi
