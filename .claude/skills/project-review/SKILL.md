---
name: project-review
description: Full review of a Euterpe diff — runs the built-in /code-review for correctness/cleanup AND layers Euterpe's own invariants (generated-file edits, i18n symmetry, single-scope discipline, dependency policy, version/changelog coupling). Use when reviewing changes in this repo. Catches rule violations generic review can't know about.
---

# Euterpe project-invariant review

A complete review = generic correctness/cleanup **plus** this repo's unique rules.
This skill runs **both** so you get one combined report on the current diff
(`git diff` / `git diff --cached`).

## Step 1 — run the built-in code review

First invoke the **`code-review`** skill (i.e. run `/code-review`; default to
`medium` effort, or pass the effort the user asked for — `high`/`max`/`ultra`).
That covers correctness bugs and reuse/simplification/efficiency cleanups. Keep
its findings to fold into the combined report below.

## Step 2 — check the Euterpe invariants

Then check the rules **unique to this repo** that generic review has no way to
know, reporting violations with `file:line` and a fix.

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

Merge the `/code-review` findings (Step 1) with the invariant violations (Step 2)
into **one** list, grouped by severity (blocker / should-fix / nit), each with
`file:line` and the fix. Tag each item with its source — `[code-review]` or
`[invariant]` — so it's clear which pass caught it. If the diff is clean on both
passes, say so explicitly.
