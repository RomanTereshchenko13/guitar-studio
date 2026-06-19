/* Dev-only static-analysis gate. Concatenates src/js/*.js in the SAME order
   build.js uses and lints the result as ONE shared script scope, then maps every
   finding back to its real src/js file:line. Modelling the single concatenated
   scope is the whole point: it makes `no-undef`, `no-redeclare`, `no-unused-vars`
   and `no-use-before-define` see cross-file references the way the shipped app
   does — the bug class the jsdom suite can't reach.

   No bundled browser, nothing added to the shipped app. ESLint + globals are
   dev-only devDependencies (same status as jsdom in tests/).

   Run:  npm run lint          (exits non-zero on any error) */
'use strict';
const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'src', 'js');
const concatPath = path.join(__dirname, '.eslint-concat.js');   // gitignored scratch

// Same selection + order as build.js: zero-padded NN-*.js, alphabetical.
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();

// Build the concatenation while recording the concat line each file starts on,
// so a reported line can be mapped back to "src/js/NN-foo.js:localLine".
let out = '';
let newlines = 0;          // newlines written so far == lines fully emitted
const map = [];            // { startLine, rel } per source file, ascending
const countNl = s => (s.match(/\n/g) || []).length;

for (const f of jsFiles) {
  const rel = path.posix.join('src/js', f);
  const banner = `/* ===== ${rel} ===== */\n`;
  out += banner; newlines += countNl(banner);
  map.push({ startLine: newlines + 1, rel });
  let content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  if (!content.endsWith('\n')) content += '\n';   // keep file boundaries on line breaks
  out += content; newlines += countNl(content);
}
fs.writeFileSync(concatPath, out);

// Map a concat line number back to its source file + local line.
function locate(concatLine) {
  let hit = map[0];
  for (const m of map) { if (m.startLine <= concatLine) hit = m; else break; }
  return { rel: hit.rel, line: concatLine - hit.startLine + 1 };
}

(async () => {
  try {
    const eslint = new ESLint({ cwd: root });
    const results = await eslint.lintFiles([concatPath]);
    const msgs = results[0] ? results[0].messages : [];

    let errors = 0, warnings = 0;
    const byFile = new Map();
    for (const m of msgs) {
      const { rel, line } = locate(m.line);
      if (!byFile.has(rel)) byFile.set(rel, []);
      byFile.get(rel).push({ line, col: m.column, sev: m.severity, ruleId: m.ruleId, message: m.message });
      if (m.severity === 2) errors++; else warnings++;
    }

    if (msgs.length === 0) {
      console.log(`lint: clean — ${jsFiles.length} modules linted as one scope.`);
    } else {
      for (const [rel, list] of byFile) {
        console.log('\n' + rel);
        list.sort((a, b) => a.line - b.line || a.col - b.col);
        for (const m of list) {
          const tag = m.sev === 2 ? 'error  ' : 'warning';
          console.log(`  ${String(m.line).padStart(4)}:${m.col}  ${tag}  ${m.message}  ${m.ruleId || ''}`);
        }
      }
      console.log(`\nlint: ${errors} error(s), ${warnings} warning(s).`);
    }

    fs.unlinkSync(concatPath);
    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    try { fs.unlinkSync(concatPath); } catch { /* already gone */ }
    console.error('lint: failed to run —', err.message);
    process.exit(2);
  }
})();
