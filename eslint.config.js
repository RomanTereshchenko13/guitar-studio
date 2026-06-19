/* ESLint flat config — DEV-ONLY, never shipped.

   The app is authored as 14 separate src/js/NN-*.js modules but build.js
   concatenates them into ONE <script> with ONE shared scope (no per-file module
   boundary). So a `const` in 10-scales.js is visible to 13-wiring-init.js, and a
   typo'd reference or accidental global only blows up at runtime — exactly the
   class of bug the jsdom suite can miss because it only exercises the paths it
   touches.

   To model that single shared scope faithfully, we do NOT lint the files
   individually (that would flag every cross-file reference as `no-undef`).
   Instead `tools/lint.js` concatenates them in the same order build.js uses and
   lints the result as one script, then maps any finding back to its source file.
   This config is what that concat file is linted against. Run via `npm run lint`. */
'use strict';
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'tools/shots/**', 'index.html'] },
  js.configs.recommended,
  {
    // The concatenated app: one shared, browser-global script scope.
    files: ['tools/.eslint-concat.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // test-only introspection hook the harness reads off window
        __GS_TEST__: 'writable',
      },
    },
    rules: {
      // The bugs this gate exists to catch in a concatenated single scope:
      //  - no-undef: a typo'd or missing cross-file symbol (the main prize — a
      //    reference that resolves at runtime in build.js only because every
      //    module shares one scope; a misspelling here is a real, silent bug).
      //  - no-redeclare: the same top-level name defined in two files.
      'no-undef': 'error',
      'no-redeclare': 'error',
      // genuinely-dead top-level/local bindings (warning, doesn't block the gate):
      // cross-file-used names count as "used" in the one scope, so what's left is
      // real dead code. Ignore leading-underscore args and unused catch bindings.
      'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // `catch (_) {}` is the codebase's deliberate best-effort idiom (see 14-pwa.js).
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Deliberately OFF for this architecture: the modules are authored in
      // load order, but a function in an earlier file routinely references a
      // const defined in a later file. That reference only *executes* after the
      // whole concatenated script has loaded and init runs, so there is no real
      // temporal-dead-zone hazard — yet the lexical check flags every one. It's
      // pure false-positive noise here, so we don't run it. (no-undef already
      // guarantees the symbol exists somewhere in the shared scope.)
      'no-use-before-define': 'off',
    },
  },
];
