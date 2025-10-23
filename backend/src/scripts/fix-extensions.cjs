// scripts/fix-extensions.cjs
const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && p.endsWith('.js')) files.push(p);
  }
}

if (!fs.existsSync(DIST)) {
  console.log('[fix-extensions] dist yok, atlandı.');
  process.exit(0);
}

walk(DIST);

const patterns = [
  // index → app
  { re: /from\s+['"]\.\/app['"]/g, rep: "from './app.js'" },

  // core/env farklı seviye path'ler
  { re: /from\s+['"]\.\/core\/env['"]/g, rep: "from './core/env.js'" },
  { re: /from\s+['"]\.\.\/core\/env['"]/g, rep: "from '../core/env.js'" },
  { re: /from\s+['"]\.\.\/\.\.\/core\/env['"]/g, rep: "from '../../core/env.js'" },
  { re: /from\s+['"]\.\.\/\.\.\/\.\.\/core\/env['"]/g, rep: "from '../../../core/env.js'" },

  // core/error ihtimali
  { re: /from\s+['"]\.\/core\/error['"]/g, rep: "from './core/error.js'" },
  { re: /from\s+['"]\.\.\/core\/error['"]/g, rep: "from '../core/error.js'" }
];

let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  let out = s;
  for (const { re, rep } of patterns) out = out.replace(re, rep);
  if (out !== s) {
    fs.writeFileSync(f, out);
    changed++;
  }
}

console.log(`[fix-extensions] patched ${changed} file(s)`);
