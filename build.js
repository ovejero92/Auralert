/**
 * Auralert build — concat CSS into JS, output dist/auralert.js + .min.js
 * Run: node build.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const CSS_FILES = [
  path.join(SRC, 'styles.css'),
  path.join(SRC, 'forms', 'forms.css'),
  path.join(SRC, 'themes', 'light.css'),
  path.join(SRC, 'themes', 'dark.css'),
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function buildCssBundle() {
  return CSS_FILES.map(read).join('\n');
}

function escapeForJs(css) {
  return css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function injectStyles(source, css) {
  const placeholder = "var STYLES = /* AURALERT_STYLES */ '';";
  const replacement = 'var STYLES = `' + escapeForJs(css) + '`;';
  if (!source.includes(placeholder)) {
    throw new Error('Placeholder /* AURALERT_STYLES */ not found in src/index.js');
  }
  return source.replace(placeholder, replacement);
}

function minifyBasic(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:=+\-*\/<>!?&|])\s*/g, '$1')
    .trim();
}

function minifyTerser(code) {
  try {
    execSync('npx --yes terser --version', { stdio: 'pipe' });
    const tmpIn = path.join(ROOT, '.build-tmp.js');
    const tmpOut = path.join(ROOT, '.build-tmp.min.js');
    fs.writeFileSync(tmpIn, code, 'utf8');
    execSync(`npx --yes terser "${tmpIn}" -o "${tmpOut}" -c -m`, { stdio: 'pipe' });
    const out = fs.readFileSync(tmpOut, 'utf8');
    fs.unlinkSync(tmpIn);
    fs.unlinkSync(tmpOut);
    return out;
  } catch {
    return null;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(2) + ' KB';
}

function main() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const css = buildCssBundle();
  const formsPre = read(path.join(SRC, 'forms', 'icons.js')) + '\n' +
    read(path.join(SRC, 'forms', 'pill-path.js')) + '\n' +
    read(path.join(SRC, 'forms', 'forms.js')) + '\n';
  let js = formsPre + injectStyles(read(path.join(SRC, 'index.js')), css);

  const outFull = path.join(DIST, 'auralert.js');
  fs.writeFileSync(outFull, js, 'utf8');

  let min = minifyTerser(js);
  let minMethod = 'terser';
  if (!min) {
    min = minifyBasic(js);
    minMethod = 'basic (regex)';
  }

  const outMin = path.join(DIST, 'auralert.min.js');
  fs.writeFileSync(outMin, min, 'utf8');

  const sizeFull = fs.statSync(outFull).size;
  const sizeMin = fs.statSync(outMin).size;

  console.log('\n✓ Auralert build complete\n');
  console.log('  dist/auralert.js     ', formatSize(sizeFull));
  console.log('  dist/auralert.min.js', formatSize(sizeMin), `(${minMethod})`);

  if (sizeMin > 30 * 1024) {
    console.warn('\n⚠ Warning: minified bundle exceeds 30 KB target');
  } else {
    console.log('\n✓ Under 30 KB target');
  }
  console.log('');
}

main();
