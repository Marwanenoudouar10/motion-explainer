#!/bin/bash
# Review cut for the user: every chapter's CURRENT preview (with its voice), stitched in film
# order, plus one still per chapter. Seconds with ffmpeg, no Remotion render.
# usage: scripts/roughcut.sh [C01 C05]   (from-to chapter ids; default: all)
#   -> out/film/review/roughcut.mp4 + stills.jpg (tile k = chapter k, read left->right)
# Hard cuts: a fade/focus overlap plays twice (0.5 s per join). Chapters with no preview yet are
# skipped and listed. Check each preview is newer than its code (frame.sh warns) before sending.
set -e
cd "$(dirname "$0")/.."
FROM=${1:-}; TO=${2:-}
IDS=$(python3 -c "
import sys; sys.path.insert(0, 'scripts/audio'); import project as P
ids = [c['id'] for c in P.chapters()]
a = ids.index('$FROM') if '$FROM' else 0; b = ids.index('$TO') + 1 if '$TO' else len(ids)
print(' '.join(ids[a:b]))")
D=out/film/review; mkdir -p "$D/stills"; rm -f "$D"/stills/*.png
ins=(); fl=""; cat=""; i=0; missing=""
for c in $IDS; do
  p=out/chapters/$c/preview.mp4
  [ -f "$p" ] || { missing+=" $c"; continue; }
  ins+=(-i "$p")
  if [ -n "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$p")" ]; then
    a="[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}];"
  else   # a silent preview still needs an audio track for concat
    a="aevalsrc=0:d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$p"):s=48000:c=stereo[a${i}];"
  fi
  fl+="[${i}:v]scale=-2:720,setsar=1,fps=30,format=yuv420p[v${i}];${a}"
  cat+="[v${i}][a${i}]"
  ffmpeg -nostdin -y -loglevel error -sseof -1.0 -i "$p" -frames:v 1 -vf scale=-2:480 "$D/stills/$(printf %02d $i).png"
  i=$((i + 1))
done
[ $i -gt 0 ] || { echo "no previews found" >&2; exit 1; }
nice -n 15 ffmpeg -nostdin -y -loglevel error "${ins[@]}" -filter_complex "${fl}${cat}concat=n=${i}:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset fast -c:a aac -b:a 192k -movflags +faststart "$D/roughcut.mp4"
ffmpeg -nostdin -y -loglevel error -i "$D/stills/%02d.png" -vf "tile=6x$(( (i + 5) / 6 )):padding=6:color=white" -frames:v 1 "$D/stills.jpg"
[ -f "$D/stills.jpg" ] || { echo "stills sheet not written" >&2; exit 1; }
echo "wrote $D/roughcut.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/roughcut.mp4") s, $i chapters) and $D/stills.jpg"
[ -z "$missing" ] || echo "no preview yet:$missing"
