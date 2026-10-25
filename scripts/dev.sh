#!/bin/bash
# Live mode: the TV loads the page from Vite on this Mac, so saved changes show up instantly.
#   scripts/dev.sh on    (start `npm --prefix web run dev` first)
#   scripts/dev.sh off   back to the copy built into the app
# If the Mac can't be reached, the TV falls back to the built-in copy after 4 s.
set -eu
TV="${TV:-192.168.0.99:5555}"
adb connect "$TV" >/dev/null 2>&1 || true

case "${1:-}" in
  on)
    IP=$(ipconfig getifaddr en0)
    echo "Live mode: http://$IP:5173/  (is 'npm --prefix web run dev' running?)"
    URL="http://$IP:5173/"
    ;;
  off)
    echo "Live mode off"
    URL=off
    ;;
  *)
    echo "usage: $0 on|off" >&2
    exit 2
    ;;
esac

adb -s "$TV" shell am start -n com.tvhome.launcher/.MainActivity --es devUrl "$URL" >/dev/null
