#!/usr/bin/env node
/**
 * Simula "alguien pagó" — genera licencia, registra en DB, muestra email listo para Pidgeon
 *
 * Uso:
 *   node scripts/fulfill-order.js --email cliente@mail.com
 *
 * Requiere: license.secret + (opcional) servidor con data/licenses-db.json
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readLicenseSecret } = require('./read-secret');

const email = process.argv.includes('--email')
  ? process.argv[process.argv.indexOf('--email') + 1]
  : 'cliente@ejemplo.com';

function randomBlock() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function sign(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 8).toUpperCase();
}

function generateLicense(secret) {
  const payload = 'AURAL-' + randomBlock() + '-' + randomBlock();
  return payload + '-' + sign(secret, payload);
}

const secret = readLicenseSecret();
const license = generateLicense(secret);

const dbPath = path.join(__dirname, '..', 'data', 'licenses-db.json');
let db = { licenses: {} };
if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.licenses[license] = {
  email: email,
  maxDomains: 3,
  domains: [],
  createdAt: new Date().toISOString(),
  source: 'fulfill-order'
};

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('\n══════════════════════════════════════');
console.log('  PAGO SIMULADO — orden completada');
console.log('══════════════════════════════════════\n');
console.log('  Email:    ', email);
console.log('  Licencia: ', license);
console.log('\n  Archivos para el cliente:');
console.log('    1. dist/auralert-pro.min.js  (enviar por link privado, NO GitHub)');
console.log('    2. auralert-license.example.js → renombrar a auralert-license.js');
console.log('\n  Email (texto para Pidgeon):');
console.log('  ─────────────────────────────');
console.log('  Asunto: Tu licencia Auralert Pro');
console.log('');
console.log('  Hola,');
console.log('');
console.log('  Gracias por tu compra. Tu licencia:');
console.log('  ' + license);
console.log('');
console.log('  Descargá auralert-pro.min.js desde el link adjunto.');
console.log('  Guardá la licencia en auralert-license.js (no la subas a GitHub).');
console.log('');
console.log('  Activación:');
console.log("  await Auralert.activate('" + license + "');");
console.log('  ─────────────────────────────\n');
console.log('  Registrada en data/licenses-db.json (gitignored si agregás data/ a .gitignore)\n');
