/**
 * Servidor de licencias Auralert Pro (ejemplo)
 *
 * - Valida firma HMAC (mismo secret que license.secret)
 * - Registra dominios por licencia (anti-reventa básica)
 * - maxDomains por licencia (ej. 3 sitios del mismo comprador)
 *
 * npm init -y && npm i express cors
 * AURALERT_LICENSE_SECRET=... node scripts/license-server.example.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3921;
const SECRET = process.env.AURALERT_LICENSE_SECRET || fs.readFileSync(path.join(__dirname, '..', 'license.secret'), 'utf8').trim();
const DB_FILE = path.join(__dirname, '..', 'data', 'licenses-db.json');
const MAX_DOMAINS_DEFAULT = Number(process.env.AURALERT_MAX_DOMAINS || 3);

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 8).toUpperCase();
}

function parseKey(key) {
  const parts = String(key).trim().toUpperCase().split('-');
  if (parts.length !== 4 || parts[0] !== 'AURAL') return null;
  return { payload: parts.slice(0, 3).join('-'), sign: parts[3], key: parts.join('-') };
}

function isSignatureValid(key) {
  const p = parseKey(key);
  if (!p) return false;
  return sign(p.payload) === p.sign;
}

function loadDb() {
  if (!fs.existsSync(DB_FILE)) return { licenses: {} };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/** Registrar licencia manualmente tras un pago (o vía webhook) */
function registerLicense(key, opts) {
  const db = loadDb();
  const norm = parseKey(key);
  if (!norm) throw new Error('invalid key format');
  db.licenses[norm.key] = {
    email: opts.email || null,
    maxDomains: opts.maxDomains || MAX_DOMAINS_DEFAULT,
    domains: db.licenses[norm.key]?.domains || [],
    createdAt: db.licenses[norm.key]?.createdAt || new Date().toISOString()
  };
  saveDb(db);
  return db.licenses[norm.key];
}

function validateActivation(key, domain) {
  if (!isSignatureValid(key)) {
    return { valid: false, error: 'invalid_signature' };
  }
  const norm = parseKey(key).key;
  const db = loadDb();
  const row = db.licenses[norm];
  if (!row) {
    return { valid: false, error: 'license_not_registered', hint: 'register via POST /admin/register after payment' };
  }
  if (!domain || domain === 'localhost' || domain === '127.0.0.1') {
    return { valid: true, dev: true };
  }
  if (row.domains.includes(domain)) {
    return { valid: true };
  }
  if (row.domains.length >= row.maxDomains) {
    return { valid: false, error: 'max_domains_reached', domains: row.domains };
  }
  row.domains.push(domain);
  saveDb(db);
  return { valid: true, domains: row.domains };
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/validate', (req, res) => {
  const { license, domain } = req.body || {};
  const result = validateActivation(license, domain);
  res.json(result);
});

/** Solo para vos — protegé con ADMIN_TOKEN en producción */
app.post('/admin/register', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { license, email, maxDomains } = req.body || {};
  try {
    const row = registerLicense(license, { email, maxDomains });
    res.json({ ok: true, license, row });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('Auralert license server on port', PORT);
  console.log('POST /validate  { license, domain }');
  console.log('POST /admin/register  (after payment)');
});
