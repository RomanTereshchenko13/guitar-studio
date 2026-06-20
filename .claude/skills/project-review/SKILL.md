---
name: project-review
description: Review a Euterpe diff against the project's own invariants — generated-file edits, i18n symmetry, single-scope discipline, dependency policy, version/changelog coupling. Use alongside /code-review when reviewing changes in this repo. Catches rule violations generic review can't know about.
---

# Euterpe project-invariant review

Generic `/code-review` finds correctness and cleanup issues. This skill checks the
rules **unique to this repo** that generic review has no way to know. Run it on the
current diff (`git diff` / `git diff --cached`) and report violations with
`file:line` and a fix. These complement, not replace, `/code-review`.

## Checklist

1. **No hand-edits to generated files.** `index.html`, `sw.js`, `CHANGELOG.md`,
   `icons/*.png`, `icons/icon.svg`, and `dist/*` are build output. If the diff
   touches them, there must be a corresponding `src/` change that *produces* that
   output, and a fresh `node build.js` must reproduce it exactly. Flag any direct
   edit to a generated file. (Editable sidecar exception: `manifest.webmanifest`.)

2. **Edit `src/`, not `dist/`.** Changes to app behaviour/markup/styles belong in
   `src/index.template.html`, `src/styles.css`, `src/js/NN-*.js`, `src/sw.template.js`.

3. **i18n symmetry.** Every new/changed UI string must exist in **both** the `uk`
   and `en` blocks of `src/js/03-i18n.js`, with matching meaning and (for
   changelog/list strings) matching bullet counts. An unpaired key fails tests —
   flag it before the suite does.

4. **Single concatenated scope.** All `src/js/*.js` modules share one runtime
   scope. Flag duplicate top-level names across files (`no-redeclare`), references
   to symbols defined in no file (`no-undef`), and obvious dead code. (`npm run
   lint` enforces this — call it out if the diff looks risky here.)

5. **Dependency policy.** The guarantee is behavioural: one file, fetches nothing
   at runtime (Google Fonts is the only sanctioned fetch), no supply-chain dep,
   works offline. Any new third-party code must be (a) permissively licensed
   (MIT/BSD/0BSD/Apache-2.0 — **never copyleft/GPL**), (b) vendored into `src/`
   and concatenated by `build.js`, (c) solving a genuinely hard already-solved
   problem. Flag new runtime `fetch`/`import`/CDN URLs and any added dependency.

6. **Version ↔ changelog coupling.** If `APP_VERSION` (`src/js/01-version.js`)
   changed, there must be a matching top entry in `src/js/02-changelog.js` (and
   vice-versa). User-facing changes should have a changelog entry. Sanity-check
   patch-vs-minor (polish = patch).

7. **PWA stays sidecar.** The PWA module (`src/js/*-pwa.js`) must self-disable off
   HTTPS; the app must still work as the single `file://` `index.html` with the PWA
   dormant.

## Report

Group findings by severity (blocker / should-fix / nit), each with `file:line`,
the rule violated, and the fix. If the diff is clean against all invariants, say
so explicitly.
