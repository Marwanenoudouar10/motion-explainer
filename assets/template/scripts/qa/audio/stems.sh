#!/bin/bash
# Render the film's audio stems (audio only, no video): voice alone, effects + music alone,
# and the full mix -> out/qa/mix/{voice.wav, fx.wav, film.wav}. Input for phone_mix.py and
# clicks.py. Uses the Film composition's `mix` prop ("voice" | "fx" | "all").
# usage: scripts/qa/audio/stems.sh
set -e
cd "$(dirname "$0")/../../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1 || true
D=out/qa/mix; mkdir -p $D
for m in voice fx all; do
  name=$m; [ $m = all ] && name=film
  nice -n 15 npx remotion render src/index.ts Film "$D/$name.wav" --codec=wav --concurrency=3 \
    --props="{\"mix\":\"$m\",\"captions\":false}" --log=error
done
echo "wrote $D/voice.wav $D/fx.wav $D/film.wav"
