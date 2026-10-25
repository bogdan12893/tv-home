# TV Home — design

A home screen we build ourselves for the Sony BRAVIA (Android TV 9), written in Vue and shown inside a tiny Android app. It replaces Google's TV launcher.

Status: draft for review, 2026-10-23. Items marked *(my call)* were not discussed. Change any you disagree with.

## Why

Google's home screen feels dated and cluttered. The goal is a calm, minimal screen that the owner controls completely and keeps changing from their Mac. CleanFrame (github.com/nthnclrk/CleanFrame, a Samsung Frame home screen) is the look we're aiming for. We use it as a visual reference only and copy none of its code or assets.

## What it is

- When the TV starts, or when Home is pressed on the remote, this screen opens.
- **Look:** a full-screen photo wallpaper with a clock at top-left. Along the bottom is a frosted-glass dock of app tiles, each with an icon and a name. The focused tile is highlighted. Nothing else is on screen: no recommendations, no ads, no rows of content.
- **Dock apps, in this order:**

  | Name | Package |
  |---|---|
  | Netflix | `com.netflix.ninja` |
  | Disney+ | `com.disney.disneyplus` |
  | Max | `com.wbd.stream` |
  | Jellyfin | `org.jellyfin.androidtv` |
  | SmartTube | `org.smarttube.stable` |
  | Spotify | `com.spotify.tv.android` |

- **Remote:** left and right move along the dock, OK opens the app, and Back on the home screen does nothing.
- **Escape hatches** *(my call)*: two small icons at top-right, reached by pressing Up from the dock.
  - **All apps** opens a simple grid of every app that can be launched, so the Play Store, TV Bro, VLC and the others stay reachable. Back returns to the dock.
  - **Settings** opens Android TV settings.
- **Clock:** 24-hour, matching the TV's en-GB locale *(my call)*.

## Goals

1. It looks minimal and modern, close in spirit to the CleanFrame screenshot.
2. Every change is made in code on the Mac, and the Vue code is fully the owner's to change.
3. While editing, changes show on the TV within about a second (hot reload).
4. Day to day, it works with the Mac switched off.
5. It can be undone with one command, which brings back Google's launcher.

## Non-goals (v1)

- No settings screen on the TV, because everything is configured in code.
- No content rows, recommendations, search or voice.
- No HDMI-input or TV-tuner tiles *(my call; easy to add later as dock items)*.
- No Play Store release. It's a single debug-signed APK for this TV.
- No Vue editing on the TV itself.

## Anti-goals (failure even if it "works")

- A blank or broken home screen, especially when the Mac is off or unreachable.
- Ending up stuck without a way back to Google's launcher or TV settings.
- Being noticeably slower to appear than Google's launcher on this 2 GB TV.
- Navigating to any web page other than our own.

## Constraints (checked on the TV today)

- Android 9 (API 28) with Android System WebView 138. Modern JavaScript and CSS, including `backdrop-filter`, work.
- The screen is 1920×1080 at density 320, so the WebView's CSS viewport is **960×540 px** (devicePixelRatio 2). Design for 960×540, or set the viewport width to 1920. Pick one and stay consistent.
- The CPU is 32-bit ARM (armeabi-v7a). That doesn't matter as long as the app ships no native libraries.
- The TV is at `192.168.0.99:5555` over wireless adb, and the Mac is at `192.168.0.54` on the same Wi-Fi. The Mac's IP can change, so don't hard-code it.
- Mac: Homebrew and Node 24 are installed. **There's no JDK or Android SDK yet**, so the builder installs JDK 17 and the Android command-line tools, preferably with Homebrew, and writes the steps down.
- macOS may block local-network access for the terminal. `CHEATSHEET.md` already documents the fix: System Settings → Privacy & Security → Local Network.
- Existing tooling in `~/tv-tools`: `launcher-swap.sh` / `launcher-restore.sh` (currently pointing at Projectivy, which has since been uninstalled), `rollback.sh` and `applied.log`.
- **What needs the owner's review:**
  - **Run freely:** installing, reinstalling, opening and closing our own app (`./deploy.sh`), switching live mode on and off (`./dev.sh`), sending test key presses, and taking screenshots.
  - **Show to the owner first:** system-level changes, meaning setting the home app, disabling or enabling any other package, and changing any TV setting.
- **What we know from Projectivy:** Projectivy was the home app for a while earlier today. It was dropped because the owner wanted something smaller, cleaner and with fewer settings, not because of a technical problem.
  - The plan assumes the standard home intent plus `set-home-activity` and a disabled `tvlauncher` is enough.
  - Stage 4 checks this: Home from inside an app, a cold boot, and waking from standby.
  - If Sony or Google still takes over, stop and bring it back to the owner. Don't add an accessibility service or boot receiver without asking.

## How it's built (decided)

- **Repo:** a new folder, `~/tv-home`, tracked with git *(my call on the name)*. It has two parts:
  - `web/`: Vue 3 + Vite. This is where all the look and behaviour live.
  - `android/`: a small Kotlin app, Gradle-built from the command line. Android Studio is optional.
- **Android app:**
  - It registers as a home screen: `MAIN` + `HOME` + `DEFAULT`, plus `LEANBACK_LAUNCHER` and a TV banner so it also shows up in app lists.
  - It has one full-screen activity hosting a WebView.
- **Bundled mode (default):** the built `web/dist` is packed into the APK and served with `WebViewAssetLoader` (an `https://appassets.androidplatform.net/` origin, not `file://`).
- **Live mode (while editing):**
  - The WebView loads the Vite dev server on the Mac (`http://<mac-ip>:5173`), so saving a file updates the TV through Vite's hot reload.
  - A script turns live mode on and off, for example `./dev.sh on` and `./dev.sh off`. It passes the dev URL to the app, and the app remembers it.
  - **If the dev server can't be reached within a few seconds, the app loads the bundled copy instead.**
  - Cleartext HTTP must be allowed for the dev URL only, because Android 9 blocks it by default.
- **Bridge (the only native API the page sees):** a small JavaScript interface with three calls:
  - `listApps()` returns each launchable app's name, package and icon, with the icon as a data URL.
  - `launch(package)` opens an app.
  - `openSettings()` opens Android TV settings.

  Also:
  - The page gets an event when the home screen comes back into view, so it can refresh the clock and the app list.
  - The bridge is attached only to our own origins, and the WebView refuses to navigate anywhere else.
- **Config:** dock apps, their order, the wallpaper and the clock format live in one plain file in `web/` (e.g. `src/config.ts`).
- **Deploy:** `./deploy.sh` builds the web app, builds the APK, and installs it over adb.
- **Debugging:** WebView debugging is on in this build, so `chrome://inspect` on the Mac shows the TV's console and elements.
- **Switching home screens:**
  - Generalise `launcher-swap.sh` to take the new package name. It sets our activity as home and disables `com.google.android.tvlauncher`.
  - `launcher-restore.sh` stays the undo, and both scripts log to `applied.log`.
  - The swap is a system-level change, so it's shown to the owner before it runs.

## Left to the builder

- Visual details: exact spacing, blur strength, focus style, fonts and animation timing.
  - Bundle fonts locally so nothing depends on the internet.
  - Keep animations to transforms and opacity so they stay smooth on this TV.
- Icons *(my call)*: start with each app's own Android icon or banner from `listApps()`. Monochrome brand marks are a later, optional upgrade.
- Wallpaper *(my call)*: ship one bundled photo with a licence that allows reuse, and make it easy to drop in your own JPG.
- Whether to use TypeScript in `web/` (suggested: yes, lightly).
- How focus and key handling are structured in Vue. D-pad presses arrive as arrow keys and Enter, and Back is handled natively.
- Gradle, AGP and Kotlin versions (anything current that targets API 28+). The package name, e.g. `com.tvhome.launcher`.
- Test steps for each stage. At minimum, check that it works in a desktop browser at 960×540 before it touches the TV.
- Smaller choices: the live-mode timeout, which apps the All-apps grid hides (Sony system apps, for example), hiding a dock app that isn't installed, and a simple native error screen if the page itself fails to load.

## Order of work (suggested)

1. Vue screen in a desktop browser, using mocked bridge data.
2. Android wrapper in bundled mode, installed and opened manually. No home-screen change yet.
3. Live mode and the fallback.
4. Owner reviews, then the home-screen swap via the updated `launcher-swap.sh`, followed by checks: Home button, power cycle, and Mac switched off.
