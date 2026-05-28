/**
 * Build Auralert Pro = free bundle + pro extension (single file)
 * Inyecta license.secret en el bundle para que coincida con generate-license.js
 * Run: node build.js && node build-pro.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PRO_SRC = path.join(ROOT, 'src', 'pro');
function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function escapeForJs(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function readSecret() {
  const { readLicenseSecret } = require('./scripts/read-secret');
  try {
    return readLicenseSecret();
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
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
    const tmpIn = path.join(ROOT, '.build-pro-tmp.js');
    const tmpOut = path.join(ROOT, '.build-pro-tmp.min.js');
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
  const freePath = path.join(DIST, 'auralert.js');
  if (!fs.existsSync(freePath)) {
    console.error('✗ Run node build.js first');
    process.exit(1);
  }

  const secret = readSecret();
  const freeJs = read(freePath);
  const proCss = read(path.join(PRO_SRC, 'skins.css'));
  let proJs = read(path.join(PRO_SRC, 'index.js'));

  proJs = proJs.replace(
    "var PRO_STYLES = /* AURALERT_PRO_STYLES */ '';",
    'var PRO_STYLES = `' + escapeForJs(proCss) + '`;'
  );
  proJs = proJs.replace(
    "var LICENSE_SECRET = /* AURALERT_LICENSE_SECRET */ '';",
    "var LICENSE_SECRET = '" + secret.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "';"
  );

  const bundle = freeJs + '\n' + proJs;

  const outFull = path.join(DIST, 'auralert-pro.js');
  fs.writeFileSync(outFull, bundle, 'utf8');

  let min = minifyTerser(bundle);
  let minMethod = 'terser';
  if (!min) {
    min = minifyBasic(bundle);
    minMethod = 'basic';
  }

  const outMin = path.join(DIST, 'auralert-pro.min.js');
  fs.writeFileSync(outMin, min, 'utf8');

  console.log('\n✓ Auralert Pro build complete\n');
  console.log('  Secret inyectado desde license.secret');
  console.log('  dist/auralert-pro.js     ', formatSize(fs.statSync(outFull).size));
  console.log('  dist/auralert-pro.min.js ', formatSize(fs.statSync(outMin).size), `(${minMethod})`);
  console.log('\n  Verificá una licencia: node scripts/verify-license.js AURAL-...\n');
  console.log('  ⚠ No publiques auralert-pro.min.js en el repo público.\n');
}

main();
