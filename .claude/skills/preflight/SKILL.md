---
name: preflight
description: Run all of Euterpe's quality gates on demand before committing or pushing. Use when asked to run the checks, pre-push/pre-commit check, "is this safe to commit/push", full check, or to verify everything is green.
---

# Preflight — run every gate

The on-demand **superset** of the `tools/githooks/pre-commit` hook. The hook
(when installed) runs lint → test → sync-check on commit but skips the slow
headless checks. This skill runs everything, including those.

Run each gate in order. Report **pass/fail per gate**; if one fails, stop and
surface the failure rather than pressing on.

## 1. Lint (src/js as one concatenated scope)

```bash
npm run lint
```

## 2. Build + smoke suite

```bash
npm test            # pretest rebuilds, then the jsdom smoke suite
```

## 3. Generated files in sync with src/

A fresh build must leave the committed artifacts unchanged:

```bash
node build.js
git diff --quiet -- index.html sw.js CHANGELOG.md && echo "in sync" || echo "STALE: stage the rebuilt files"
```

If stale, the generated files were edited by hand or not rebuilt — stage the
regenerated `index.html` / `sw.js` / `CHANGELOG.md`.

## 4. Scroll / sticky-header regression (headless)

```bash
node tools/scroll-check.js 390x740 390x1100
```

~15s per viewport; exits non-zero on a condensing-header bug.

## 5. Keyboard shortcuts (headless)

```bash
node tools/kbd-check.js
```

Asserts tab switch (1/2/3), root set, transpose ([ / ]), help overlay, and the
typing/focus guards.

## Report

Summarise: which gates passed, which failed (with the relevant output), and
whether it's safe to commit/push. If styles or markup changed, recommend the
`visual-review` skill too — that one isn't a pass/fail script.
