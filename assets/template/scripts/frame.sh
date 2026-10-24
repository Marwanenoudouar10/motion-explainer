#!/bin/bash
# Exact frames as PNG.
# usage: scripts/frame.sh C05 0 45 120     chapter-local frames -> out/chapters/C05/frames/f45.png
#        scripts/frame.sh film 300 900     global film frames   -> out/film/frames/f300.png
#   default: cut from the latest preview (out/chapters/<id>/preview.mp4, or out/film/film-*.mp4);
#            run preview.sh / render.sh first. Same scale as that render. Warns when the preview
#            is older than the chapter's code; a frame past the end of the preview is an error
#            (exit 1), and an old fN.png of the same name is deleted first, never judged as new.
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
  [ "$ID" != "film" ] && [ -n "$(find "src/film/chapters/$ID" -type f -newer "$SRC" | head -1)" ] &&
    echo "WARNING: $SRC is older than the code in src/film/chapters/$ID: re-run scripts/preview.sh $ID" >&2
  for f in "$@"; do
    OUTF="$D/frames/f$f.png"; rm -f "$OUTF"   # never leave an old frame under the new name
    ffmpeg -nostdin -y -loglevel error -i "$SRC" -vf "select=eq(n\,$f)" -vframes 1 "$OUTF"
    [ -f "$OUTF" ] || { echo "frame $f is not in $SRC (too short, or a range render): nothing written" >&2; exit 1; }
    echo "$OUTF"
  done
else
  [ "$ID" = "film" ] || ENTRY=$(scripts/entry.sh "$ID")
  for f in "$@"; do
    nice -n 15 npx remotion still "$ENTRY" "$COMP" "$D/frames/f$f.png" --frame="$f" --log=error
    echo "$D/frames/f$f.png"
  done
fi
