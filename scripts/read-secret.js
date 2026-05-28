/**
 * Lee license.secret en UTF-8 (rechaza UTF-16 de Notepad)
 */
const fs = require('fs');
const path = require('path');

const SECRET_FILE = path.join(__dirname, '..', 'license.secret');

function readLicenseSecret() {
  if (process.env.AURALERT_LICENSE_SECRET) {
    return process.env.AURALERT_LICENSE_SECRET.trim();
  }
  if (!fs.existsSync(SECRET_FILE)) {
    throw new Error('Falta license.secret (copiá license.secret.example)');
  }
  const buf = fs.readFileSync(SECRET_FILE);
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    throw new Error(
      'license.secret está en UTF-16 (Notepad). Guardalo como UTF-8: VS Code → Save with Encoding → UTF-8'
    );
  }
  let text = buf.toString('utf8').replace(/^\uFEFF/, '').trim();
  if (!text || text.includes('\n')) {
    throw new Error('license.secret debe ser UNA sola línea con el secret (no pegues licencias ahí)');
  }
  return text;
}

module.exports = { readLicenseSecret };
