require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

module.exports = {
  port: Number(process.env.PORT || 3922),
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3922').replace(/\/$/, ''),
  siteUrl: (process.env.SITE_URL || 'http://localhost:5500').replace(/\/$/, ''),
  licenseSecret: process.env.AURALERT_LICENSE_SECRET || '',
  mpToken: process.env.MP_ACCESS_TOKEN || '',
  proTitle: process.env.PRO_TITLE || 'Auralert Pro',
  proPrice: Number(process.env.PRO_PRICE || 15000),
  proCurrency: process.env.PRO_CURRENCY || 'ARS',
  pidgeonUrl: (process.env.PIDGEON_URL || '').replace(/\/$/, ''),
  pidgeonFrom: process.env.PIDGEON_FROM || 'noreply@auralert.local',
  mockCheckout: process.env.MOCK_CHECKOUT === 'true',
  proBundlePath: path.join(ROOT, 'dist', 'auralert-pro.min.js'),
  dataDir: path.join(ROOT, 'data'),
};
