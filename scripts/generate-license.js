#!/usr/bin/env node
/**
 * Genera claves de licencia Auralert Pro
 *
 * Uso:
 *   node scripts/generate-license.js
 *   node scripts/generate-license.js --email cliente@mail.com
 *
 * Requiere license.secret en la raíz (copiá license.secret.example)
 */
const crypto = require('crypto');
const { readLicenseSecret } = require('./read-secret');

function getSecret() {
  try {
    return readLicenseSecret();
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
}

function randomBlock() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function sign(secret, payload) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

function generateLicense() {
  const secret = getSecret();
  const payload = 'AURAL-' + randomBlock() + '-' + randomBlock();
  const signature = sign(secret, payload);
  return payload + '-' + signature;
}

const email = process.argv.includes('--email')
  ? process.argv[process.argv.indexOf('--email') + 1]
  : null;

const key = generateLicense();
const secret = getSecret();
const payload = key.split('-').slice(0, 3).join('-');
const expected = sign(secret, payload);

console.log('\n  Licencia Auralert Pro generada:\n');
console.log('  ' + key + '\n');
if (email) console.log('  Cliente: ' + email + '\n');
console.log('  Verificación local: node scripts/verify-license.js ' + key);
console.log('\n  Después: node build-pro.js  (inyecta el mismo secret en dist/auralert-pro.js)\n');
console.log('  Uso en proyecto del comprador:\n');
console.log("  await Auralert.activate('" + key + "');\n");
console.log('  Firma interna OK:', key.endsWith(expected) ? 'sí' : 'no — revisá license.secret\n');
