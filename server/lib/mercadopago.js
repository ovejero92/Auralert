const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const config = require('./config');

let client = null;

function getClient() {
  if (!config.mpToken) return null;
  if (!client) client = new MercadoPagoConfig({ accessToken: config.mpToken });
  return client;
}

async function createPreference(email) {
  const mp = getClient();
  if (!mp) throw new Error('MP_ACCESS_TOKEN no configurado');

  const preference = new Preference(mp);
  const result = await preference.create({
    body: {
      items: [
        {
          id: 'auralert-pro',
          title: config.proTitle,
          quantity: 1,
          unit_price: config.proPrice,
          currency_id: config.proCurrency,
        },
      ],
      payer: { email },
      external_reference: email,
      notification_url: config.publicUrl + '/api/webhooks/mercadopago',
      back_urls: {
        success: config.siteUrl + '/pro/gracias.html',
        failure: config.siteUrl + '/pro/index.html?payment=failed',
        pending: config.siteUrl + '/pro/gracias.html?pending=1',
      },
      auto_return: 'approved',
    },
  });

  return {
    id: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  };
}

async function getPayment(paymentId) {
  const mp = getClient();
  if (!mp) return null;
  const payment = new Payment(mp);
  const result = await payment.get({ id: paymentId });
  return result;
}

module.exports = { createPreference, getPayment, getClient };
