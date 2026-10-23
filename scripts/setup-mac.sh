#!/bin/bash
# One-time Mac setup: JDK 17, Android SDK, Gradle.
#   scripts/setup-mac.sh        install everything (asks you to accept SDK licences)
#   eval "$(scripts/setup-mac.sh env)"   export JAVA_HOME and ANDROID_HOME
set -eu
SDK=/opt/homebrew/share/android-commandlinetools

if [ "${1:-}" = env ]; then
  echo "export JAVA_HOME=$(/usr/libexec/java_home -v 17)"
  echo "export ANDROID_HOME=$SDK"
  exit 0
fi

brew install --cask temurin@17 android-commandlinetools
brew install gradle
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
# adb itself keeps coming from /opt/homebrew/bin/adb
