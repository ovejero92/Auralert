const config = require('./config');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function sendViaPidgeon({ to, subject, html }) {
  if (!config.pidgeonUrl) {
    console.log('[email mock]', to, subject);
    return { success: true, mock: true };
  }
  const res = await fetch(config.pidgeonUrl + '/v2/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      subject,
      html,
      from: config.pidgeonFrom,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Error enviando email');
  }
  return data;
}

function verificationEmail(code) {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">Auralert Pro</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p style="color:#64748b;font-size:14px">Válido 10 minutos. Si no pediste esto, ignorá el mensaje.</p>
    </div>`;
}

function purchaseEmail({ license, portalUrl, downloadUrl }) {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">¡Gracias por comprar Auralert Pro!</h2>
      <p><strong>Tu licencia:</strong></p>
      <p style="font-family:monospace;font-size:16px;background:#f1f5f9;padding:12px;border-radius:8px">${license}</p>
      <h3>Pasos</h3>
      <ol style="line-height:1.7">
        <li>Descargá <a href="${downloadUrl}">auralert-pro.min.js</a></li>
        <li>Creá <code>auralert-license.js</code> en tu proyecto (no lo subas a GitHub)</li>
        <li>Entrá al <a href="${portalUrl}">portal Pro</a> para probar skins y animaciones</li>
      </ol>
      <pre style="background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;font-size:12px;overflow:auto">window.AURALERT_LICENSE = '${license}';

await Auralert.activate(window.AURALERT_LICENSE);
Auralert.setSkin('gold');</pre>
      <p style="color:#64748b;font-size:13px">Guardá esta licencia. Máx. 3 dominios por licencia.</p>
    </div>`;
}

module.exports = {
  isValidEmail,
  sendViaPidgeon,
  verificationEmail,
  purchaseEmail,
};
