// backend/scripts/fix-esm-extensions.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');

const JS_FILES = [];
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile() && p.endsWith('.js')) JS_FILES.push(p);
  }
}

const hasExt = (s) =>
  s.endsWith('.js') || s.endsWith('.mjs') || s.endsWith('.cjs') ||
  s.endsWith('.json') || s.endsWith('.node');

const isRelative = (s) => s.startsWith('./') || s.startsWith('../');

function fixCode(code) {
  // import ... from '...';
  code = code.replace(
    /from\s+['"]([^'"]+)['"]/g,
    (m, spec) => {
      if (isRelative(spec) && !hasExt(spec)) {
        return `from "${spec}.js"`;
      }
      return m;
    }
  );
  // dynamic import('...')
  code = code.replace(
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    (m, spec) => {
      if (isRelative(spec) && !hasExt(spec)) {
        return `import("${spec}.js")`;
      }
      return m;
    }
  );
  return code;
}

(async () => {
  await walk(DIST_DIR);
  await Promise.all(JS_FILES.map(async (file) => {
    const src = await fs.readFile(file, 'utf8');
    const out = fixCode(src);
    if (out !== src) {
      await fs.writeFile(file, out, 'utf8');
      // console.log('fixed', path.relative(DIST_DIR, file));
    }
  }));
})();
