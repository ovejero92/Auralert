const crypto = require('crypto');
const config = require('./config');

function randomBlock() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function sign(payload) {
  return crypto
    .createHmac('sha256', config.licenseSecret)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

function generateLicense() {
  if (!config.licenseSecret) throw new Error('AURALERT_LICENSE_SECRET no configurado');
  const payload = 'AURAL-' + randomBlock() + '-' + randomBlock();
  return payload + '-' + sign(payload);
}

function parseKey(key) {
  if (!key || typeof key !== 'string') return null;
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 4 || parts[0] !== 'AURAL') return null;
  return { payload: parts.slice(0, 3).join('-'), sign: parts[3], key: parts.join('-') };
}

function isValidSignature(key) {
  const p = parseKey(key);
  if (!p) return false;
  return sign(p.payload) === p.sign;
}

module.exports = { generateLicense, isValidSignature, parseKey };
