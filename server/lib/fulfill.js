const db = require('./db');
const licenses = require('./licenses');
const mail = require('./email');
const config = require('./config');

async function fulfillOrder({ email, paymentId, amount, currency }) {
  const normalized = String(email).trim().toLowerCase();
  let license;

  db.update((d) => {
    const existing = Object.entries(d.licenses || {}).find(
      ([, v]) => v.email === normalized && v.status === 'active'
    );
    if (existing) {
      license = existing[0];
      return;
    }
    license = licenses.generateLicense();
    d.licenses[license] = {
      email: normalized,
      maxDomains: 3,
      domains: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      paymentId: paymentId || null,
      amount,
      currency,
    };
    d.orders[paymentId || 'mock-' + Date.now()] = {
      email: normalized,
      license,
      at: new Date().toISOString(),
    };
  });

  const portalUrl = config.siteUrl + '/pro/portal.html';
  const downloadUrl =
    config.publicUrl + '/api/download/auralert-pro.min.js?license=' + encodeURIComponent(license);

  await mail.sendViaPidgeon({
    to: normalized,
    subject: 'Tu licencia Auralert Pro',
    html: mail.purchaseEmail({ license, portalUrl, downloadUrl }),
  });

  return { license, email: normalized, portalUrl, downloadUrl };
}

module.exports = { fulfillOrder };
