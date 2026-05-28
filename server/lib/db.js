const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_FILE = path.join(config.dataDir, 'store.json');

function load() {
  if (!fs.existsSync(DB_FILE)) {
    return { licenses: {}, orders: {}, verifyCodes: {}, checkoutTokens: {} };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function save(db) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function update(mutator) {
  const db = load();
  mutator(db);
  save(db);
  return db;
}

module.exports = { load, save, update, DB_FILE };
