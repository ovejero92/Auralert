#!/usr/bin/env node
/**
 * Verifica si una licencia coincide con license.secret
 * Uso: node scripts/verify-license.js AURAL-XXXX-XXXX-XXXXXXXX
 */
const crypto = require('crypto');
const { readLicenseSecret } = require('./read-secret');

const key = process.argv[2];
if (!key) {
  console.error('Uso: node scripts/verify-license.js AURAL-XXXX-XXXX-XXXXXXXX');
  process.exit(1);
}

let secret;
try {
  secret = readLicenseSecret();
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}

const parts = key.trim().toUpperCase().split('-');
if (parts.length !== 4 || parts[0] !== 'AURAL') {
  console.log('\n✗ Formato inválido (esperado AURAL-XXXX-XXXX-SIGNATURE)\n');
  process.exit(1);
}

const payload = parts.slice(0, 3).join('-');
const got = parts[3];
const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 8).toUpperCase();

console.log('\n  Licencia:', key);
console.log('  Payload: ', payload);
console.log('  Secret:  ', secret.slice(0, 4) + '…' + secret.slice(-4));
console.log('  Firma en licencia:', got);
console.log('  Firma esperada:   ', expected);
console.log('');

if (got === expected) {
  console.log('  ✓ VÁLIDA — usala en pro-preview después de node build-pro.js\n');
  process.exit(0);
}

console.log('  ✗ INVÁLIDA — generá otra con: node scripts/generate-license.js\n');
console.log('  (No reutilices licencias viejas si cambiaste license.secret)\n');
process.exit(1);
