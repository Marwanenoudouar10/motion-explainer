#!/bin/bash
# Check the tools this project needs, before the first render (read-only; changes nothing).
# usage: scripts/doctor.sh [--voice]
#   node >= 18 (npm, npx), python3 >= 3.9 (stdlib only), ffmpeg + ffprobe with the filters the
#   sheets, probes and master use (tile, select, blend, lutrgb, loudnorm, alimiter, silencedetect, highpass, afade,
#   showspectrumpic). drawtext is NOT needed (Homebrew's ffmpeg lacks it).
#   --voice (or briefs/brief.md says "Timing source: voice"): also whisper-cli and its model
#   (WHISPER_MODEL / WHISPER_LANG, as scripts/audio/aligner.py resolves them).
# Remotion's bundled ffmpeg cannot stand in: it lacks most of these filters.
# Prints one line per tool and the install line for anything missing; exit 1 if anything is.
cd "$(dirname "$0")/.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
MAC=0; [ "$(uname)" = "Darwin" ] && MAC=1
miss=0
ok() { echo "ok       $1"; }
bad() { echo "MISSING  $1"; echo "         -> $2"; miss=1; }
pkg() { if [ $MAC = 1 ]; then echo "brew install $1"; else echo "install $1 with your package manager (apt install $1, dnf install $1)"; fi; }

if command -v node >/dev/null 2>&1; then
  v=$(node -v | sed 's/^v//'); major=${v%%.*}
  if [ "$major" -ge 18 ] 2>/dev/null; then ok "node $v"; else bad "node $v (need 18 or newer)" "nvm install 20 (https://github.com/nvm-sh/nvm)"; fi
else
  bad "node" "install Node.js 18+ (nvm install 20)"
fi
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'; then
  ok "python3 $(python3 -c 'import platform; print(platform.python_version())')"
else
  bad "python3 >= 3.9" "$(pkg python3)"
fi
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  have=$(ffmpeg -hide_banner -filters 2>/dev/null | awk '{print $2}')
  lack=""
  for f in tile select blend lutrgb loudnorm alimiter silencedetect highpass afade showspectrumpic; do
    echo "$have" | grep -qx "$f" || lack="$lack $f"
  done
  if [ -z "$lack" ]; then ok "ffmpeg $(ffmpeg -version | head -1 | awk '{print $3}') (all filters)"
  else bad "ffmpeg filters:$lack" "$(pkg ffmpeg) (a full build; Remotion's bundled ffmpeg is not enough)"; fi
else
  bad "ffmpeg / ffprobe" "$(pkg ffmpeg)"
fi

VOICE=0
[ "$1" = "--voice" ] && VOICE=1
[ -f briefs/brief.md ] && grep -iqE '^timing source:[[:space:]]*voice' briefs/brief.md && VOICE=1
if [ $VOICE = 1 ]; then
  if command -v whisper-cli >/dev/null 2>&1; then ok "whisper-cli"; else bad "whisper-cli" "$(pkg whisper-cpp)"; fi
  MODEL=$(python3 -c "import sys; sys.path.insert(0, 'scripts/audio'); import aligner; print(aligner.MODEL)" 2>/dev/null)
  URL=$(python3 -c "import sys; sys.path.insert(0, 'scripts/audio'); import aligner; print(aligner.MODEL_URL)" 2>/dev/null)
  if [ -n "$MODEL" ] && [ -f "$MODEL" ]; then ok "whisper model $MODEL"
  else bad "whisper model ${MODEL:-?}" "mkdir -p \"$(dirname "${MODEL:-$HOME/.cache/whisper/x}")\" && curl -L -o \"$MODEL\" $URL"; fi
else
  echo "skipped  whisper (no narration: pass --voice for a narrated film)"
fi
[ $miss = 0 ] && echo "all tools present" || echo "install the missing tools above, then run scripts/doctor.sh again"
exit $miss
