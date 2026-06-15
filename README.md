# Guitar Studio (Гітарна студія)

A guitar theory and practice app — scales, modes, chords, triads, the circle of
fifths, and fretboard visualisation, with a Karplus-Strong audio engine and a
jam-along backing band. Bilingual UI (Ukrainian / English).

**The whole app is one file: [`index.html`](./index.html).** It has zero runtime
dependencies, no build step, and runs entirely offline. Opening the file in a
browser *is* running the app. Everything else in this repo is development
tooling and docs that never ship to the user.

## Run

Open `index.html` in any modern browser. That's it — no server, no install.

## Deploy

`index.html` is the deployable artifact. On GitHub Pages, serve the repo root
(or rename/symlink as the Pages entry point); the app loads as static files.
Because there is no build step, "deploy" means "publish `index.html`."

## Test

The release gate is a headless [jsdom](https://github.com/jsdom/jsdom) suite.
`jsdom` is a **dev-only** dependency — nothing in the shipped file depends on it.

```bash
cd tests
npm install      # installs jsdom (dev only)
npm test         # boots index.html headless, runs ~140 checks
```

`npm test` exits non-zero on any failure, so it works as a CI gate. The
[GitHub Action](./.github/workflows/test.yml) runs it on every push and PR. See
[`tests/README.md`](./tests/README.md) for what the suite covers.

## Versioning

The single source of truth for the version is `APP_VERSION` inside `index.html`
(mirrored in the `<meta name="version">` tag, the header comment, and the in-app
changelog — tap the version badge to view it). Releases are marked with git
tags rather than version-suffixed filenames:

```bash
git tag v1.11.0 && git push --tags
```

The currently shipping version is recorded at the top of
[`ROADMAP.md`](./ROADMAP.md).

## Layout

```
guitar-studio/
├── index.html              the app (deployable, zero-dependency)
├── README.md               this file
├── ROADMAP.md              phased plan; current shipping version at the top
├── .gitignore
├── .github/workflows/
│   └── test.yml            CI: runs the smoke suite on push/PR
└── tests/                  dev-only test harness
    ├── package.json
    ├── package-lock.json   committed for reproducible CI
    ├── smoke.js            the suite
    └── README.md           what it covers
```

## Architecture notes

- Single-file HTML/CSS/JS; the only external resource is Google Fonts.
- Web Audio API: Karplus-Strong synthesis, body-resonance EQ, compressor +
  convolution reverb, a lookahead scheduler for drift-free timing, and named
  buses (backing / lead-target / cue) plus a synthesized backing band.
- `localStorage` persists the full working state across reloads.
- All new UI strings need symmetric Ukrainian + English entries (enforced by the
  test harness).
