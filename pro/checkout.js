(function () {
  function apiBase() {
    if (window.AURALERT_API) return String(window.AURALERT_API).replace(/\/$/, '');
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'http://localhost:3922';
    }
    return '';
  }

  async function post(path, body) {
    const base = apiBase();
    if (!base) throw new Error('Configurá window.AURALERT_API en api-config.js');
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.error || 'Error de servidor');
    return data;
  }

  window.AuralertCheckout = {
    apiBase: apiBase,
    requestCode: function (email) {
      return post('/api/verify/request', { email: email });
    },
    confirmCode: function (email, code) {
      return post('/api/verify/confirm', { email: email, code: code });
    },
    startCheckout: function (checkoutToken) {
      return post('/api/checkout', { checkoutToken: checkoutToken });
    },
    validateLicense: function (license) {
      return post('/api/license/validate', { license: license });
    },
    downloadUrl: function (license) {
      return apiBase() + '/api/download/auralert-pro.min.js?license=' + encodeURIComponent(license);
    },
  };
})();
