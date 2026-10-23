#!/bin/bash
# Build the Vue page and the Android app, install it on the TV and open it.
set -eu
cd "$(dirname "$0")/.."
TV="${TV:-192.168.0.99:5555}"
eval "$(scripts/setup-mac.sh env)"

npm --prefix web run build
(cd android && ./gradlew -q assembleDebug)

adb connect "$TV" >/dev/null 2>&1 || true
adb -s "$TV" install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s "$TV" shell am start -n dev.bogdan.tvhome/.MainActivity
