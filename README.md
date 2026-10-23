# TV Home

A minimal home screen for the Sony BRAVIA (Android TV 9). The look and behaviour are a Vue page in `web/`; `android/` is a small Kotlin app that shows it full-screen and registers as the TV's home screen.

Design: [docs/design.md](docs/design.md) · Plan: [docs/plan.md](docs/plan.md)

## Change something

Most things live in [`web/src/config.ts`](web/src/config.ts): which apps sit in the dock and in what order, the clock format, and the wallpaper. Drop a photo into `web/public/` and point `wallpaper` at it. Styling is in `web/src/styles.css` and the components in `web/src/components/`.

The TV shows the page at 960×540 CSS px.

## See it on the TV

| What | Command |
|---|---|
| Install your latest changes | `scripts/deploy.sh` |
| Live mode: edit and see it on the TV within a second | `npm --prefix web run dev`, then `scripts/dev.sh on` |
| Back to the built-in copy | `scripts/dev.sh off` |
| Try it in a desktop browser | `npm --prefix web run dev`, open http://localhost:5173 at 960×540 |
| Console / inspect the page on the TV | Chrome on the Mac → `chrome://inspect` |
| Tests | `npm --prefix web test` and `(eval "$(scripts/setup-mac.sh env)"; cd android && ./gradlew testDebugUnitTest)` |

In live mode, if the TV can't reach the Mac it shows the built-in copy after about 2 s. Live mode only accepts a dev server on the local network (`http://<10.x / 172.16–31.x / 192.168.x>:5173/`).

If the TV can't reach the Mac at all, allow your terminal in System Settings → Privacy & Security → Local Network.

## One-time setup

`scripts/setup-mac.sh` installs Java 17, the Android SDK and Gradle with Homebrew.

## Home screen switch and undo

From `~/tv-tools`:

- `./launcher-swap.sh` makes TV Home the home screen and turns off Google's launcher.
- `./launcher-restore.sh` brings Google's launcher back. TV Home stays installed.

Both log to `~/tv-tools/applied.log`.
