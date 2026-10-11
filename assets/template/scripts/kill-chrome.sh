#!/bin/bash
# Kill orphaned headless Chrome left behind by an interrupted render. Refuses while any
# Remotion render/still is running (it would kill that render's browser).
# usage: scripts/kill-chrome.sh
if pgrep -f "remotion (render|still)" >/dev/null; then
  echo "a render is running:"; pgrep -fl "remotion (render|still)"; echo "not killing anything"; exit 1
fi
n=$(pgrep -f chrome-headless-shell | wc -l | tr -d ' ')
pkill -f chrome-headless-shell && echo "killed $n chrome-headless-shell process(es)" || echo "none running"
