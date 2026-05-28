const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const db = require('../lib/db');
const config = require('../lib/config');
const email = require('../lib/email');
const licenses = require('../lib/licenses');
const mercadopago = require('../lib/mercadopago');
const { fulfillOrder } = require('../lib/fulfill');

const router = express.Router();

const CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;

function cleanExpired(d) {
  const now = Date.now();
  for (const [k, v] of Object.entries(d.verifyCodes || {})) {
    if (v.expiresAt < now) delete d.verifyCodes[k];
  }
  for (const [k, v] of Object.entries(d.checkoutTokens || {})) {
    if (v.expiresAt < now) delete d.checkoutTokens[k];
  }
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mp: !!config.mpToken,
    pidgeon: !!config.pidgeonUrl,
    mock: config.mockCheckout,
  });
});

/** Paso 1: enviar código al correo */
router.post('/verify/request', async (req, res) => {
  try {
    const addr = String(req.body.email || '')
      .trim()
      .toLowerCase();
    if (!email.isValidEmail(addr)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const code = String(crypto.randomInt(100000, 999999));
    db.update((d) => {
      cleanExpired(d);
      d.verifyCodes[addr] = { code, expiresAt: Date.now() + CODE_TTL_MS };
    });

    await email.sendViaPidgeon({
      to: addr,
      subject: 'Código Auralert Pro',
      html: email.verificationEmail(code),
    });
    if (!config.pidgeonUrl) console.log('[verify]', addr, 'código:', code);

    res.json({ ok: true, message: 'Código enviado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'No se pudo enviar el código' });
  }
});

/** Paso 2: confirmar código → token para checkout */
router.post('/verify/confirm', (req, res) => {
  const addr = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const code = String(req.body.code || '').trim();

  const d = db.load();
  const entry = d.verifyCodes[addr];
  if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Código incorrecto o expirado' });
  }

  const checkoutToken = crypto.randomBytes(24).toString('hex');
  db.update((db2) => {
    delete db2.verifyCodes[addr];
    cleanExpired(db2);
    db2.checkoutTokens[checkoutToken] = {
      email: addr,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };
  });

  res.json({ ok: true, checkoutToken });
});

/** Paso 3: crear pago Mercado Pago */
router.post('/checkout', async (req, res) => {
  try {
    const checkoutToken = req.body.checkoutToken;
    const d = db.load();
    const tok = d.checkoutTokens[checkoutToken];
    if (!tok || tok.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Sesión expirada. Verificá el email de nuevo.' });
    }

    const addr = tok.email;
    if (config.mockCheckout || !mercadopago.getClient()) {
      const result = await fulfillOrder({
        email: addr,
        paymentId: 'mock-' + Date.now(),
        amount: config.proPrice,
        currency: config.proCurrency,
      });
      db.update((db2) => {
        delete db2.checkoutTokens[checkoutToken];
      });
      return res.json({
        ok: true,
        mock: true,
        license: result.license,
        portalUrl: result.portalUrl,
      });
    }

    const pref = await mercadopago.createPreference(addr);
    db.update((db2) => {
      delete db2.checkoutTokens[checkoutToken];
    });

    res.json({
      ok: true,
      preferenceId: pref.id,
      initPoint: pref.initPoint,
      sandboxInitPoint: pref.sandboxInitPoint,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Error al crear el pago' });
  }
});

/** Webhook Mercado Pago */
router.post('/webhooks/mercadopago', async (req, res) => {
  res.status(200).send('OK');

  try {
    const topic = req.query.topic || req.body?.type;
    const id = req.query.id || req.body?.data?.id;
    if (topic !== 'payment' && req.body?.type !== 'payment') return;

    const payment = await mercadopago.getPayment(id);
    if (!payment || payment.status !== 'approved') return;

    const payerEmail =
      payment.payer?.email ||
      payment.additional_info?.payer?.email ||
      payment.external_reference;
    if (!payerEmail) return;

    const d = db.load();
    const already = Object.values(d.orders || {}).some((o) => o.paymentId === String(id));
    if (already) return;

    await fulfillOrder({
      email: payerEmail,
      paymentId: String(id),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
    });
  } catch (e) {
    console.error('webhook', e);
  }
});

/** Validar licencia (portal + activate remoto opcional) */
router.post('/license/validate', (req, res) => {
  const key = String(req.body.license || '').trim().toUpperCase();
  if (!licenses.isValidSignature(key)) {
    return res.json({ valid: false });
  }
  const d = db.load();
  const rec = d.licenses[key];
  if (!rec || rec.status !== 'active') {
    return res.json({ valid: false, reason: 'not_found' });
  }
  res.json({
    valid: true,
    email: rec.email,
    maxDomains: rec.maxDomains,
    domains: rec.domains,
  });
});

/** Descarga del bundle Pro (solo con licencia activa) */
router.get('/download/auralert-pro.min.js', (req, res) => {
  const key = String(req.query.license || '')
    .trim()
    .toUpperCase();
  if (!licenses.isValidSignature(key)) {
    return res.status(403).send('Licencia inválida');
  }
  const d = db.load();
  const rec = d.licenses[key];
  if (!rec || rec.status !== 'active') {
    return res.status(403).send('Licencia no activa');
  }
  if (!fs.existsSync(config.proBundlePath)) {
    return res.status(503).send('Bundle no disponible en el servidor');
  }
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', 'attachment; filename="auralert-pro.min.js"');
  fs.createReadStream(config.proBundlePath).pipe(res);
});

module.exports = router;
