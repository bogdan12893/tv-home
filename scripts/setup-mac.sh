#!/bin/bash
# One-time Mac setup: JDK 17, Android SDK, Gradle.
#   scripts/setup-mac.sh        install everything (asks you to accept SDK licences)
#   eval "$(scripts/setup-mac.sh env)"   export JAVA_HOME and ANDROID_HOME
set -eu
SDK=/opt/homebrew/share/android-commandlinetools
JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

if [ "${1:-}" = env ]; then
  echo "export JAVA_HOME=$JDK"
  echo "export ANDROID_HOME=$SDK"
  exit 0
fi

# openjdk@17 (not the temurin cask) because the cask installer needs sudo.
brew install openjdk@17 gradle
brew install --cask android-commandlinetools
export JAVA_HOME="$JDK"
yes | sdkmanager --licenses >/dev/null
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
# adb itself keeps coming from /opt/homebrew/bin/adb
