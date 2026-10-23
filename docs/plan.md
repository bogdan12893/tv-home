# TV Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Vue home screen for the Sony BRAVIA (Android TV 9), wrapped in a small Kotlin app that replaces Google's TV launcher.

**Architecture:** A Vue 3 + Vite page holds all of the look and behaviour. A Kotlin app registers as the Android home screen and shows that page in a full-screen WebView. The page is either bundled in the APK and served through `WebViewAssetLoader`, or, in live mode, loaded from the Mac's Vite dev server with a fallback to the bundled copy. The page only reaches Android through a three-call JavaScript bridge (`window.TvHome`) and two window events.

**Tech Stack:** Vue 3, Vite, TypeScript, Vitest, @vue/test-utils, jsdom and @fontsource/manrope on the web side. Kotlin, AndroidX Activity, AndroidX WebKit and JUnit 4 on the Android side, built with the Gradle wrapper. Also JDK 17, adb, and bash scripts.

**Spec:** `~/tv-tools/home-screen-design.md`. Task 1 copies it to `~/tv-home/docs/design.md`.

## Global Constraints

- TV: Android 9 / API 28, WebView 138, 1920×1080 at density 320, armeabi-v7a, at `192.168.0.99:5555` (scripts use `TV="${TV:-192.168.0.99:5555}"`).
- **Design the page for a 960×540 CSS px viewport** (devicePixelRatio 2). The page uses `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- `minSdk 28`. Ship no native libraries.
- Android package and applicationId: `dev.bogdan.tvhome`. Activity: `dev.bogdan.tvhome/.MainActivity`.
- Bundled URL: `https://appassets.androidplatform.net/assets/web/index.html`. Vite `base: './'`, `build.outDir: '../android/app/src/main/assets/web'` (gitignored).
- Dock, in order: Netflix `com.netflix.ninja`, Disney+ `com.disney.disneyplus`, Max `com.wbd.stream`, Jellyfin `org.jellyfin.androidtv`, SmartTube `org.smarttube.stable`, Spotify `com.spotify.tv.android`.
- 24-hour clock. No ads, no content rows, no settings screen on the TV.
- Fonts and wallpaper are bundled. The page makes no internet requests.
- Animations use only `transform` and `opacity`.
- The WebView never navigates to any origin except the bundled origin or the current dev URL.
- **TV permission split:**
  - **Run freely:** install or reinstall our APK, start and stop our app, `dev.sh`, `input keyevent`, `screencap`.
  - **Show the owner and wait for a yes:** set the home activity, enable or disable any other package, any `settings put`, and `reboot`.
- **Mac permission:** show Homebrew installs and the Android SDK licence acceptance to the owner and wait for a yes before running them.
- Log every system-level TV change to `~/tv-tools/applied.log`.

## Review Focus

1. **Live mode on while Vite isn't running or the Mac is off:** the TV shows the bundled home screen within about 4 s, never a blank or error page. Pinned by `PageLoaderTest` in Task 4 and the device check in Task 5.
2. **A dock app gets uninstalled:** its tile disappears and no tile is left that does nothing. If none of the six is installed, focus starts at the top icons and the dock area shows `No apps yet. Press ▲ for All apps.` Pinned by `dock.test.ts` and `App.test.ts`.
3. **An app fails to open** (`launch` returns false): the tile stays focused and the message `Couldn't open <name>` shows for 3 s. Pinned by `App.test.ts`.
4. **Back or Home while All apps is open:** it returns to the dock with the previous dock focus. Back on the dock does nothing. Pinned by `focus.test.ts` and `App.test.ts`.
5. **The clock is stale after standby or after returning from an app:** the clock re-reads the time on `tvhome:resume` and re-aligns its timer to the next minute boundary. Pinned by `App.test.ts`.

---

## File Structure

```
~/tv-home/
  .gitignore                     node_modules, dist, android/app/src/main/assets/web, android/**/build, android/local.properties, .gradle
  docs/design.md, docs/plan.md   copies of the spec and this plan
  scripts/setup-mac.sh           one-time JDK + Android SDK install (owner approves first)
  scripts/deploy.sh              build web, build APK, install, launch
  scripts/dev.sh                 on|off live mode
  web/
    index.html
    vite.config.ts               base, outDir, server.host
    src/main.ts                  mounts App
    src/config.ts                dock list, clock24h, wallpaper path; the file the owner edits
    src/bridge.ts                window.TvHome wrapper + mock for the browser
    src/dock.ts                  resolveDock, gridApps (pure)
    src/focus.ts                 keyToAction, initialFocus, step (pure)
    src/clock.ts                 formatTime, msToNextMinute (pure)
    src/App.vue                  wiring: bridge, focus state, events, toast
    src/components/Clock.vue, TopBar.vue, Dock.vue, AllApps.vue
    src/styles.css               tokens, glass, focus style
    public/wallpaper.jpg         optional; CSS gradient fallback when missing
    test/*.test.ts               Vitest
  android/
    settings.gradle.kts, build.gradle.kts, gradle.properties, gradlew + gradle/wrapper/
    app/build.gradle.kts
    app/src/main/AndroidManifest.xml
    app/src/main/res/xml/network_security_config.xml
    app/src/main/res/drawable/banner.xml, ic_launcher.xml   vector drawables
    app/src/main/res/values/themes.xml                      black window background, no action bar
    app/src/main/java/dev/bogdan/tvhome/
      MainActivity.kt            WebView host, back/resume events, PageLoader wiring, dev URL storage
      TvHomeBridge.kt            @JavascriptInterface listApps/launch/openSettings + icon cache
      AppCatalog.kt              mergeLaunchables (pure)
      OriginPolicy.kt            BUNDLED_* constants, isAllowed (pure)
      DevUrl.kt                  parseDevUrl (pure)
      PageLoader.kt              load/fallback state machine (pure)
    app/src/test/java/dev/bogdan/tvhome/*Test.kt            JUnit 4
~/tv-tools/launcher-swap.sh, launcher-restore.sh, CHEATSHEET.md     modified in Task 6
```

---

### Task 1: Mac toolchain and repo skeleton

**Files:**
- Create: `~/tv-home/.gitignore`, `~/tv-home/docs/design.md`, `~/tv-home/docs/plan.md`, `~/tv-home/scripts/setup-mac.sh`

**Interfaces:**
- Produces: `JAVA_HOME` pointing at JDK 17, and `ANDROID_HOME`, both exported by `scripts/setup-mac.sh env` (prints `export …` lines for `eval`). An installed SDK with `platform-tools`, `platforms;android-35` and `build-tools;35.0.0`. A `gradle` binary for generating the wrapper.

- [ ] **Step 1: Create the repo.** Run `git init ~/tv-home`, copy the spec and this plan into `docs/`, and write `.gitignore` with the entries listed in File Structure.
- [ ] **Step 2: Write `scripts/setup-mac.sh`.**
  - With no arguments it runs `brew install --cask temurin@17 android-commandlinetools` and `brew install gradle`, then `sdkmanager --licenses`, then `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"`.
  - With `env`, it prints `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` and `export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`.
  - Keep using the existing `/opt/homebrew/bin/adb`.
- [ ] **Step 3: Show the owner the install commands and the licence step, and wait for a yes.**
- [ ] **Step 4: Run it, then verify.** Run `eval "$(scripts/setup-mac.sh env)" && java -version && sdkmanager --list_installed && gradle --version`. Expected: Java 17, the three SDK packages listed, and a Gradle version printed.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "chore: repo skeleton and Mac setup script"`

---

### Task 2: Web core logic (pure TypeScript, tested)

**Files:**
- Create: `web/` from `npm create vite@latest web -- --template vue-ts`, then `npm i -D vitest @vue/test-utils jsdom` and `npm i @fontsource/manrope`
- Create: `web/src/config.ts`, `bridge.ts`, `dock.ts`, `focus.ts`, `clock.ts`
- Test: `web/test/bridge.test.ts`, `dock.test.ts`, `focus.test.ts`, `clock.test.ts`
- Modify: `web/vite.config.ts` to set `base: './'`, `build.outDir: '../android/app/src/main/assets/web'`, `build.emptyOutDir: true`, `server: { host: true, port: 5173, strictPort: true }`, `test: { environment: 'jsdom' }`. Add `"test": "vitest run"` to `package.json`.

**Interfaces:**
- Produces:
  ```ts
  // bridge.ts
  export interface AppInfo { name: string; pkg: string; icon: string }   // icon: data URL or ''
  export interface Bridge { listApps(): AppInfo[]; launch(pkg: string): boolean; openSettings(): void }
  export const SELF_PKG = 'dev.bogdan.tvhome'
  export const mockBridge: Bridge
  export function createBridge(w?: Window): Bridge
  // native shape: window.TvHome = { listApps(): string /* JSON AppInfo[] */, launch(pkg: string): boolean, openSettings(): void }
  // config.ts
  export interface DockEntry { name: string; pkg: string }
  export const config: { dock: DockEntry[]; clock24h: boolean; wallpaper: string }   // wallpaper: './wallpaper.jpg'
  // dock.ts
  export interface DockItem { name: string; pkg: string; icon: string }
  export function resolveDock(entries: DockEntry[], installed: AppInfo[]): DockItem[]
  export function gridApps(installed: AppInfo[], selfPkg: string): AppInfo[]
  // focus.ts
  export type Area = 'dock' | 'top' | 'grid'
  export interface FocusState { area: Area; dock: number; top: 0 | 1; grid: number }
  export type Action = 'left' | 'right' | 'up' | 'down' | 'ok' | 'back' | 'resume'
  export type Effect = { kind: 'launch'; from: 'dock' | 'grid'; index: number } | { kind: 'settings' } | null
  export interface Sizes { dock: number; grid: number }
  export const GRID_COLS = 5
  export function initialFocus(sizes: Sizes): FocusState
  export function keyToAction(e: { key: string; keyCode: number }): Action | null
  export function step(s: FocusState, a: Action, sizes: Sizes): { state: FocusState; effect: Effect }
  // clock.ts
  export function formatTime(d: Date, h24: boolean): string
  export function msToNextMinute(d: Date): number
  ```
  - Events from native: `window` events named `tvhome:back` and `tvhome:resume`.
  - Top bar index 0 is All apps and index 1 is Settings.

- [ ] **Step 1: Write the failing tests.**
  ```ts
  // bridge.test.ts
  it('parses native JSON', () => { const w = { TvHome: { listApps: () => '[{"name":"Max","pkg":"com.wbd.stream","icon":""}]', launch: () => true, openSettings() {} } } as any
    expect(createBridge(w).listApps()).toEqual([{ name: 'Max', pkg: 'com.wbd.stream', icon: '' }]) })
  it('returns [] on bad native JSON', () => { const w = { TvHome: { listApps: () => 'nope', launch: () => true, openSettings() {} } } as any
    expect(createBridge(w).listApps()).toEqual([]) })
  it('falls back to mockBridge without window.TvHome', () => expect(createBridge({} as any)).toBe(mockBridge))
  it('mock lists all six dock packages', () => expect(mockBridge.listApps().map(a => a.pkg)).toEqual(expect.arrayContaining(config.dock.map(d => d.pkg))))
  // dock.test.ts
  it('keeps config order and names, uses installed icon', () => {
    expect(resolveDock([{ name: 'Max', pkg: 'm' }, { name: 'Netflix', pkg: 'n' }], [{ name: 'Netflix TV', pkg: 'n', icon: 'data:n' }, { name: 'HBO', pkg: 'm', icon: '' }]))
      .toEqual([{ name: 'Max', pkg: 'm', icon: '' }, { name: 'Netflix', pkg: 'n', icon: 'data:n' }]) })
  it('drops entries that are not installed', () => expect(resolveDock([{ name: 'Max', pkg: 'm' }], [])).toEqual([]))
  it('grid excludes self and sorts case-insensitively', () => {
    expect(gridApps([{ name: 'vlc', pkg: 'v', icon: '' }, { name: 'Home', pkg: SELF_PKG, icon: '' }, { name: 'Amazon', pkg: 'a', icon: '' }], SELF_PKG).map(a => a.name)).toEqual(['Amazon', 'vlc']) })
  // focus.test.ts   (S = { dock: 6, grid: 12 })
  it('starts on dock 0', () => expect(initialFocus(S)).toEqual({ area: 'dock', dock: 0, top: 0, grid: 0 }))
  it('starts on top when dock is empty', () => expect(initialFocus({ dock: 0, grid: 3 }).area).toBe('top'))
  it('clamps at dock ends', () => { let s = initialFocus(S); for (let i = 0; i < 20; i++) s = step(s, 'right', S).state; expect(s.dock).toBe(5); s = step(s, 'left', S).state; expect(s.dock).toBe(4) })
  it('ok on dock launches', () => expect(step({ ...initialFocus(S), dock: 2 }, 'ok', S).effect).toEqual({ kind: 'launch', from: 'dock', index: 2 }))
  it('up goes to top All apps, down returns to same dock index', () => { const a = step({ ...initialFocus(S), dock: 3 }, 'up', S).state; expect(a).toMatchObject({ area: 'top', top: 0 }); expect(step(a, 'down', S).state).toMatchObject({ area: 'dock', dock: 3 }) })
  it('down from top does nothing when dock is empty', () => { const e = { dock: 0, grid: 3 }; expect(step(initialFocus(e), 'down', e).state.area).toBe('top') })
  it('ok on All apps opens grid at 0', () => expect(step({ ...initialFocus(S), area: 'top', top: 0 }, 'ok', S).state).toMatchObject({ area: 'grid', grid: 0 }))
  it('ok on Settings emits settings', () => expect(step({ ...initialFocus(S), area: 'top', top: 1 }, 'ok', S).effect).toEqual({ kind: 'settings' }))
  it('grid moves by GRID_COLS and clamps', () => { const g = { ...initialFocus(S), area: 'grid' as const, grid: 1 }; expect(step(g, 'down', S).state.grid).toBe(6); expect(step({ ...g, grid: 11 }, 'down', S).state.grid).toBe(11); expect(step({ ...g, grid: 10 }, 'right', S).state.grid).toBe(11); expect(step({ ...g, grid: 11 }, 'right', S).state.grid).toBe(11) })
  it('back and resume close grid to previous dock', () => { for (const a of ['back', 'resume'] as const) expect(step({ area: 'grid', dock: 4, top: 0, grid: 7 }, a, S).state).toEqual({ area: 'dock', dock: 4, top: 0, grid: 0 }) })
  it('back on dock is a no-op', () => { const s = { ...initialFocus(S), dock: 2 }; expect(step(s, 'back', S)).toEqual({ state: s, effect: null }) })
  it('maps keys', () => { expect(keyToAction({ key: 'ArrowLeft', keyCode: 37 })).toBe('left'); expect(keyToAction({ key: 'Enter', keyCode: 13 })).toBe('ok'); expect(keyToAction({ key: '', keyCode: 23 })).toBe('ok'); expect(keyToAction({ key: 'a', keyCode: 65 })).toBeNull() })
  // clock.test.ts
  it('24h pads', () => expect(formatTime(new Date(2026, 9, 23, 9, 5), true)).toBe('09:05'))
  it('12h has no leading zero and no am/pm', () => expect(formatTime(new Date(2026, 9, 23, 21, 5), false)).toBe('9:05'))
  it('ms to next minute', () => expect(msToNextMinute(new Date(2026, 9, 23, 9, 5, 59, 500))).toBe(500))
  ```
- [ ] **Step 2: Run the tests to check they fail.** Run `cd web && npm test`. Expected: FAIL because the modules aren't found.
- [ ] **Step 3: Implement the five modules with the signatures above.**
  - `mockBridge` lists the six dock apps plus four extras (Play Store, TV Bro, VLC, YouTube Music), all with `icon: ''`. Its `launch` logs to the console and returns true.
  - From the top bar, `left` and `right` move between 0 and 1.
  - In the grid, `up` from the first row does nothing.
  - `resume` outside the grid is a no-op.
- [ ] **Step 4: Run the tests to check they pass.** Run `npm test`. Expected: all pass.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(web): pure core: bridge, dock, focus, clock"`

---

### Task 3: The home screen in Vue (checked in a desktop browser)

**Files:**
- Create: `web/src/App.vue`, `web/src/components/Clock.vue`, `TopBar.vue`, `Dock.vue`, `AllApps.vue`, `web/src/styles.css`
- Modify: `web/src/main.ts` (import `@fontsource/manrope/400.css`, `500.css`, `600.css`, and `styles.css`), `web/index.html` (viewport meta, `<title>TV Home</title>`)
- Delete: the Vite template's `HelloWorld.vue` and its assets
- Test: `web/test/App.test.ts`

**Interfaces:**
- Consumes: everything Task 2 produces.
- Produces: `App` accepts an optional prop `bridge?: Bridge`, defaulting to `createBridge()`. Tests use it to inject a fake.
  - Focused elements carry the class `is-focused`.
  - The toast element is `[data-test=toast]`, and the empty-dock message is `[data-test=empty-dock]`.

- [ ] **Step 1: Write the failing tests** using `mount(App, { props: { bridge: fake } })`, with keys sent as `window.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode }))` and fake timers.
  ```ts
  it('right then OK launches the second dock app', ...)        // expect(fake.launch).toHaveBeenCalledWith('com.disney.disneyplus')
  it('failed launch shows toast for 3 s', ...)                 // launch returns false → toast text "Couldn't open Netflix"; advance 3000 ms → toast gone
  it('hides dock apps that are not installed', ...)            // fake lists only Netflix + Max → 2 dock tiles, names "Netflix","Max"
  it('empty dock shows message and focuses All apps', ...)     // fake lists none of the six → [data-test=empty-dock] text "No apps yet. Press ▲ for All apps."; top icon 0 has is-focused
  it('Up, OK opens All apps; tvhome:back returns to dock', ...)  // grid visible, then dispatch new Event('tvhome:back') → grid gone, same dock tile focused
  it('tvhome:resume re-lists apps and refreshes clock', ...)   // set system time 09:05 → resume → clock text "09:05"; listApps called twice
  it('Settings icon calls openSettings', ...)                   // Up, Right, OK
  ```
- [ ] **Step 2: Run the tests to check they fail.** Run `npm test -- App`. Expected: FAIL.
- [ ] **Step 3: Implement the components.**
  - **Layout at 960×540:**
    - Wallpaper `object-fit: cover`, falling back to `linear-gradient(160deg,#2b3a42,#0f1417)` when the image errors.
    - Clock at top-left (about 36 px from the edges, about 40 px, weight 500).
    - Two 24 px line icons at top-right (All apps grid, Settings gear) as inline SVG.
    - A frosted dock at the bottom: `backdrop-filter: blur(24px)`, `rgba(20,24,26,.35)` fill, radius 20, one row of tiles each with an icon and a name.
  - **Focus:** a lighter glass fill plus `transform: scale(1.04)`.
  - **All apps:** an overlay grid of `GRID_COLS` columns that scrolls the focused tile into view with `transform`.
  - **Clock:** uses `setTimeout(msToNextMinute)` and re-arms after each tick and after `tvhome:resume`.
  - **App:** keeps `FocusState` in a `ref`. It runs `step` on each mapped key and on the `tvhome:back` / `tvhome:resume` events, and performs the `Effect`.
- [ ] **Step 4: Run all the tests to check they pass.** Run `npm test`. Expected: all pass.
- [ ] **Step 4b: Choose a wallpaper.** Propose one landscape photo whose licence allows reuse without attribution (for example from Unsplash), giving the URL, licence and file size. Ask the owner before downloading it. Save it as `web/public/wallpaper.jpg`, resized to 1920×1080 at JPEG quality 80, and record the source in `web/public/WALLPAPER.md`.
- [ ] **Step 5: Check in a desktop browser.** Run `npm run dev`, open `http://localhost:5173` in the built-in browser at 960×540, and drive it with the arrow keys and Enter. Expected: the screenshot matches the layout above, and mock launches are logged to the console. Send the owner the screenshot.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(web): home screen UI"`

---

### Task 4: Android wrapper in bundled mode

**Files:**
- Create: all the `android/` files in File Structure, and `scripts/deploy.sh`
- Test: `android/app/src/test/java/dev/bogdan/tvhome/AppCatalogTest.kt`, `OriginPolicyTest.kt`, `DevUrlTest.kt`, `PageLoaderTest.kt`

**Interfaces:**
- Consumes: the native bridge shape and the event names from Task 2, and the built page in `android/app/src/main/assets/web/`.
- Produces:
  ```kotlin
  // OriginPolicy.kt
  const val BUNDLED_ORIGIN = "https://appassets.androidplatform.net"
  const val BUNDLED_URL = "$BUNDLED_ORIGIN/assets/web/index.html"
  fun isAllowed(url: String, devUrl: String?): Boolean          // same scheme+host+port as BUNDLED_ORIGIN or devUrl
  // DevUrl.kt
  sealed interface DevUrlCommand { data class Set(val url: String) : DevUrlCommand; data object Clear : DevUrlCommand; data object Ignore : DevUrlCommand }
  fun parseDevUrl(extra: String?): DevUrlCommand                  // "off" → Clear; http(s)://host:port/ → Set; null/other → Ignore
  // AppCatalog.kt
  data class AppEntry(val name: String, val pkg: String)
  fun mergeLaunchables(leanback: List<AppEntry>, launcher: List<AppEntry>, selfPkg: String): List<AppEntry>   // leanback first, dedupe by pkg, drop self
  // PageLoader.kt
  const val DEV_TIMEOUT_MS = 4000L
  const val ERROR_PAGE = "tvhome:error"
  class PageLoader(devUrl: String?) {
    fun start(): String                          // devUrl ?: BUNDLED_URL
    fun onMainFrameFinished(url: String): Boolean // true only if url's origin == current target's origin and no error recorded for it
    fun onMainFrameError(url: String): String?   // dev target → BUNDLED_URL; bundled target → ERROR_PAGE; url not current target → null
    fun onTimeout(): String?                     // still waiting on dev target → BUNDLED_URL; else null
  }
  ```
  - `scripts/deploy.sh`: runs `npm --prefix web run build`, then `(cd android && ./gradlew assembleDebug)`, then `adb -s "$TV" install -r android/app/build/outputs/apk/debug/app-debug.apk`, then `adb -s "$TV" shell am start -n dev.bogdan.tvhome/.MainActivity`.

- [ ] **Step 1: Generate the Gradle project.**
  - Run `gradle wrapper` inside `android/`.
  - Use the current stable AGP, Kotlin and matching Gradle versions from developer.android.com's compatibility table. Record them in `android/build.gradle.kts`.
  - Settings: `compileSdk 35`, `targetSdk 35`, `minSdk 28`, `jvmToolchain(17)`.
  - Dependencies: `androidx.activity:activity-ktx`, `androidx.webkit:webkit`, `testImplementation("junit:junit:4.13.2")`.
- [ ] **Step 2: Write the failing JUnit tests.**
  ```kotlin
  // OriginPolicyTest
  @Test fun bundledAllowed() = assertTrue(isAllowed("$BUNDLED_ORIGIN/assets/web/x.js", null))
  @Test fun devAllowedOnlyWhenSet() { assertTrue(isAllowed("http://192.168.0.54:5173/src/App.vue", "http://192.168.0.54:5173/")); assertFalse(isAllowed("http://192.168.0.54:5173/", null)) }
  @Test fun otherPortRejected() = assertFalse(isAllowed("http://192.168.0.54:8080/", "http://192.168.0.54:5173/"))
  @Test fun externalRejected() = assertFalse(isAllowed("https://www.google.com/", "http://192.168.0.54:5173/"))
  // DevUrlTest
  @Test fun off() = assertEquals(DevUrlCommand.Clear, parseDevUrl("off"))
  @Test fun valid() = assertEquals(DevUrlCommand.Set("http://192.168.0.54:5173/"), parseDevUrl("http://192.168.0.54:5173/"))
  @Test fun junk() { assertEquals(DevUrlCommand.Ignore, parseDevUrl(null)); assertEquals(DevUrlCommand.Ignore, parseDevUrl("javascript:alert(1)")); assertEquals(DevUrlCommand.Ignore, parseDevUrl("ftp://x/")) }
  // AppCatalogTest
  @Test fun mergeDedupesAndDropsSelf() = assertEquals(listOf(AppEntry("Netflix","n"), AppEntry("VLC","v")),
      mergeLaunchables(listOf(AppEntry("Netflix","n"), AppEntry("Home","dev.bogdan.tvhome")), listOf(AppEntry("Netflix (phone)","n"), AppEntry("VLC","v")), "dev.bogdan.tvhome"))
  // PageLoaderTest   (dev = "http://192.168.0.54:5173/")
  @Test fun noDevStartsBundled() = assertEquals(BUNDLED_URL, PageLoader(null).start())
  @Test fun devTimeoutFallsBack() { val p = PageLoader(dev); p.start(); assertEquals(BUNDLED_URL, p.onTimeout()) }
  @Test fun devErrorFallsBack() { val p = PageLoader(dev); p.start(); assertEquals(BUNDLED_URL, p.onMainFrameError(dev)) }
  @Test fun finishAfterErrorIsNotSuccess() { val p = PageLoader(dev); p.start(); p.onMainFrameError(dev); assertFalse(p.onMainFrameFinished(dev)) }
  @Test fun devSuccessCancelsTimeout() { val p = PageLoader(dev); p.start(); assertTrue(p.onMainFrameFinished(dev)); assertNull(p.onTimeout()) }
  @Test fun bundledErrorShowsErrorPage() { val p = PageLoader(null); p.start(); assertEquals(ERROR_PAGE, p.onMainFrameError(BUNDLED_URL)) }
  @Test fun timeoutAfterFallbackIsNoop() { val p = PageLoader(dev); p.start(); p.onTimeout(); assertNull(p.onTimeout()) }
  ```
- [ ] **Step 3: Run the tests to check they fail.** Run `cd android && ./gradlew testDebugUnitTest`. Expected: FAIL with unresolved references.
- [ ] **Step 4: Implement the four pure files** to match the Interfaces block.
- [ ] **Step 5: Run the tests to check they pass.** Run `./gradlew testDebugUnitTest`. Expected: BUILD SUCCESSFUL, 15 tests.
- [ ] **Step 6: Implement the manifest, resources, `TvHomeBridge.kt` and `MainActivity.kt`.**
  - **Manifest:**
    - `<uses-feature android:name="android.software.leanback" android:required="false"/>` and `<uses-feature android:name="android.hardware.touchscreen" android:required="false"/>`.
    - `android:banner="@drawable/banner"` and `android:networkSecurityConfig="@xml/network_security_config"`.
    - `MainActivity` is exported, with `launchMode="singleTask"`, `excludeFromRecents="true"`, `screenOrientation="landscape"`, and the theme from `themes.xml`.
    - Two intent filters: (MAIN + HOME + DEFAULT) and (MAIN + LEANBACK_LAUNCHER).
  - **`network_security_config.xml`:** `<base-config cleartextTrafficPermitted="true"/>`.
    - This is a plan decision. Android can't limit cleartext to a changing LAN IP, so `isAllowed` enforces the "dev URL only" rule at navigation time instead.
  - **`TvHomeBridge(context)`:**
    - `listApps()` queries MAIN + `CATEGORY_LEANBACK_LAUNCHER` and MAIN + `CATEGORY_LAUNCHER` and runs `mergeLaunchables`. It returns JSON built with `org.json.JSONArray`.
    - Icons use `loadBanner ?: loadIcon`, drawn to a bitmap of at most 320×180, then turned into a PNG data URL. They're cached in memory, keyed by `pkg + lastUpdateTime`.
    - `launch(pkg)` uses `getLeanbackLaunchIntentForPackage ?: getLaunchIntentForPackage` with `FLAG_ACTIVITY_NEW_TASK`. It returns false when there's no intent or `startActivity` throws.
    - `openSettings()` starts `Settings.ACTION_SETTINGS`.
  - **`MainActivity : ComponentActivity`:**
    - Creates the WebView in `onCreate` with a black background, `javaScriptEnabled` and `domStorageEnabled`.
    - Calls `WebView.setWebContentsDebuggingEnabled(true)`.
    - Uses a `WebViewAssetLoader` with `AssetsPathHandler` on `/assets/`, and `addJavascriptInterface(TvHomeBridge(this), "TvHome")`.
    - Its `WebViewClient` routes to the loader. It returns true (block) in `shouldOverrideUrlLoading` when `!isAllowed`, and feeds main-frame `onPageFinished` / `onReceivedError` into `PageLoader`.
    - Starts a `Handler` timeout of `DEV_TIMEOUT_MS` only when a dev URL is set.
    - `ERROR_PAGE` loads inline HTML through `loadDataWithBaseURL(BUNDLED_ORIGIN, …)`. The text is `Home screen didn't load.` with an autofocused button `Open Settings` that calls `TvHome.openSettings()`.
    - Back goes through the `onBackPressedDispatcher` callback, which runs `evaluateJavascript("window.dispatchEvent(new Event('tvhome:back'))")`.
    - `onResume` and `onNewIntent` dispatch `tvhome:resume` the same way.
    - The dev URL is read from `SharedPreferences("tvhome")` key `devUrl`. Task 5 writes it.
- [ ] **Step 7: Build, install and open it, without changing the home app.** Run `scripts/deploy.sh`. Expected: `Success` from install, and the activity starts.
- [ ] **Step 8: Check on the TV.**
  - Run `adb -s $TV exec-out screencap -p > <scratch dir>/home.png` and view it. Expected: wallpaper, clock and six dock tiles with real icons.
  - Then press `KEYCODE_DPAD_RIGHT`, `KEYCODE_DPAD_CENTER`. Expected: Disney+ opens.
  - Press `KEYCODE_BACK` until you're back on our screen (or start it with `am start` again). Then press `KEYCODE_DPAD_UP`, `KEYCODE_DPAD_CENTER`. Expected: the All apps grid. `KEYCODE_BACK` closes it.
  - Check `chrome://inspect` on the Mac. Expected: the TV page shows up.
- [ ] **Step 9: Commit.** `git add -A && git commit -m "feat(android): WebView home wrapper, bundled mode"`

---

### Task 5: Live mode with fallback

**Files:**
- Create: `scripts/dev.sh`
- Modify: `MainActivity.kt` to read the `devUrl` intent extra in `onCreate` and `onNewIntent`

**Interfaces:**
- Consumes: `parseDevUrl`, `PageLoader` and `DEV_TIMEOUT_MS` from Task 4.
- Produces:
  - `scripts/dev.sh on` gets the IP with `ipconfig getifaddr en0` and runs `adb -s "$TV" shell am start -n dev.bogdan.tvhome/.MainActivity --es devUrl "http://$IP:5173/"`.
  - `scripts/dev.sh off` runs the same command with `--es devUrl off`.
  - In both cases, `Set` saves to prefs and `Clear` removes the key. The activity then recreates its `PageLoader` and reloads.
  - `on` prints a reminder to run `npm --prefix web run dev` first.

- [ ] **Step 1: Wire the extra handling in `MainActivity`** using `parseDevUrl`. `Ignore` leaves the stored value alone.
- [ ] **Step 2: Write `scripts/dev.sh`** using the same `TV` default as the other scripts.
- [ ] **Step 3: Deploy, then check hot reload.**
  - Run `scripts/deploy.sh`, `npm --prefix web run dev` (in the background) and `scripts/dev.sh on`.
  - Change the clock size in `Clock.vue` and take a screenshot. Expected: the change is visible within about 2 s with no reload, then revert it.
  - If the TV can't reach the Mac, it's the macOS Local Network permission. Point the owner to `CHEATSHEET.md` step 4.
- [ ] **Step 4: Check the fallback (Review Focus 1).**
  - Stop Vite, then run `adb -s $TV shell am force-stop dev.bogdan.tvhome` and start it again.
  - Take a screenshot after 5 s. Expected: the bundled home screen, not an error page.
- [ ] **Step 5: Turn live mode off and check.** Run `scripts/dev.sh off` and take a screenshot. Expected: the bundled home screen.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: live mode via Vite with bundled fallback"`

---

### Task 6: Make it the home screen (owner review gate)

**Files:**
- Modify: `~/tv-tools/launcher-swap.sh` so it takes an optional activity argument, defaulting to `dev.bogdan.tvhome/.MainActivity`. Keep the existing `tvlauncher` disable and log lines.
- Modify: `~/tv-tools/launcher-restore.sh` to add a log line to `applied.log`.
- Modify: `~/tv-tools/CHEATSHEET.md` to add the home-screen section (deploy, dev on/off, restore).
- Modify: `~/tv-home/README.md` (create it), covering setup, editing `web/src/config.ts`, `deploy.sh`, `dev.sh` and undo.

**Interfaces:**
- Consumes: the installed `dev.bogdan.tvhome` from Task 4.

- [ ] **Step 1: Update the two scripts and show the owner the exact adb commands they will run.**
  - `cmd package set-home-activity dev.bogdan.tvhome/.MainActivity`
  - `pm disable-user --user 0 com.google.android.tvlauncher`
  - The undo is `./launcher-restore.sh`.
  - Wait for a yes.
- [ ] **Step 2: Run `./launcher-swap.sh`.** Expected: `applied.log` gains the set-home and disable lines, and the Home key shows our screen.
- [ ] **Step 3: Check Home from inside an app.** Open Netflix from the dock, then send `KEYCODE_HOME` and take a screenshot. Expected: our screen.
- [ ] **Step 4: Ask the owner before rebooting, then check a cold boot.** Run `adb -s $TV reboot`, reconnect, and take a screenshot once boot finishes. Expected: our screen, not Google's.
- [ ] **Step 5: Check waking from standby.** Send `KEYCODE_SLEEP`, wait 10 s, send `KEYCODE_WAKEUP` and take a screenshot. Expected: our screen with the current time.
- [ ] **Step 6: If any of Steps 3–5 shows Google's or Sony's screen, stop.** Run `./launcher-restore.sh` only if the owner wants to, and report back. Don't add an accessibility service or boot receiver.
- [ ] **Step 7: Update the docs and commit.** Update `CHEATSHEET.md` and the README, then run `git -C ~/tv-home add -A && git -C ~/tv-home commit -m "docs: README and home swap"`. `~/tv-tools` isn't a git repo, so its changes are only saved to disk.
