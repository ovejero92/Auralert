/**
 * Auralert Pro — extension (requires Auralert free loaded first, or use auralert-pro bundle)
 */
(function (global) {
  'use strict';

  var PRO_STYLES = /* AURALERT_PRO_STYLES */ '';
  var SKINS = ['glass', 'marble', 'gold', 'neon'];
  var ANIMATIONS = ['spring', 'glow', 'warp', 'electric', 'float', 'none'];

  var LICENSE_KEY = 'auralert_pro_license';
  var licenseActive = false;
  var currentSkin = null;
  var currentAnimation = 'spring';
  var config = { licenseServer: null };

  /* Inyectado en build desde license.secret — NO editar a mano */
  var LICENSE_SECRET = /* AURALERT_LICENSE_SECRET */ '';

  function getSecret() {
    return LICENSE_SECRET;
  }

  function baseAuralert() {
    return global.Auralert;
  }

  function injectProStyles() {
    if (document.getElementById('auralert-pro-styles')) return;
    var s = document.createElement('style');
    s.id = 'auralert-pro-styles';
    s.textContent = PRO_STYLES;
    document.head.appendChild(s);
  }

  function applyToAllRoots(fn) {
    document.querySelectorAll('.auralert-root').forEach(fn);
  }

  function markProRoots() {
    applyToAllRoots(function (root) {
      root.classList.add('aa-pro');
    });
  }

  function applySkinToRoots(skin) {
    applyToAllRoots(function (root) {
      if (skin) root.setAttribute('data-aa-skin', skin);
      else root.removeAttribute('data-aa-skin');
    });
  }

  function flashSkinTransition() {
    applyToAllRoots(function (root) {
      root.classList.add('aa-pro-skin-transition');
      setTimeout(function () {
        root.classList.remove('aa-pro-skin-transition');
      }, 520);
    });
  }

  function applyAnimationToRoots(anim) {
    applyToAllRoots(function (root) {
      ANIMATIONS.forEach(function (a) {
        root.classList.remove('aa-pro-anim-' + a);
      });
      if (anim && anim !== 'none') root.classList.add('aa-pro-anim-' + anim);
    });
  }

  function parseLicenseKey(key) {
    if (!key || typeof key !== 'string') return null;
    var parts = key.trim().toUpperCase().split('-');
    if (parts.length !== 4 || parts[0] !== 'AURAL') return null;
    return { payload: parts.slice(0, 3).join('-'), sign: parts[3] };
  }

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('')
      .slice(0, 8)
      .toUpperCase();
  }

  function hmacSign(secret, message) {
    if (!global.isSecureContext || !global.crypto || !crypto.subtle) {
      return Promise.reject(
        new Error('Crypto unavailable (use https/localhost; file:// suele fallar)')
      );
    }
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (key) {
        return crypto.subtle.sign('HMAC', key, enc.encode(message));
      })
      .then(bufToHex);
  }

  function validateOffline(key) {
    var parsed = parseLicenseKey(key);
    if (!parsed) return Promise.resolve({ valid: false, reason: 'format' });
    if (!getSecret()) return Promise.resolve({ valid: false, reason: 'no_secret' });
    return hmacSign(getSecret(), parsed.payload)
      .then(function (sign) {
        return {
          valid: sign === parsed.sign,
          reason: sign === parsed.sign ? 'ok' : 'bad_signature',
          expected: sign,
          got: parsed.sign
        };
      })
      .catch(function (err) {
        return { valid: false, reason: 'crypto', error: err && err.message ? err.message : String(err) };
      });
  }

  function validateRemote(key) {
    return fetch(config.licenseServer, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license: key,
        domain: global.location ? global.location.hostname : '',
        product: 'auralert-pro'
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { return !!(data && data.valid); })
      .catch(function () { return false; });
  }

  function persistLicense(key) {
    try {
      localStorage.setItem(LICENSE_KEY, key);
    } catch (e) { /* private mode */ }
  }

  function loadStoredLicense() {
    try {
      return localStorage.getItem(LICENSE_KEY);
    } catch (e) {
      return null;
    }
  }

  function clearLicense() {
    licenseActive = false;
    try { localStorage.removeItem(LICENSE_KEY); } catch (e) { /* */ }
  }

  function requirePro(feature) {
    if (!licenseActive) {
      var A = baseAuralert();
      if (A) {
        A.toast({
          message: 'Auralert Pro: activá tu licencia con Auralert.activate(key)',
          type: 'warning',
          duration: 5000
        });
      }
      throw new Error('Auralert Pro license required' + (feature ? ' (' + feature + ')' : ''));
    }
  }

  function mergeOpts(opts, extra) {
    var o = {};
    var k;
    opts = opts || {};
    for (k in opts) {
      if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    }
    for (k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    }
    return o;
  }

  function wrapMethod(name, fn) {
    return function (opts) {
      opts = opts || {};
      if (opts.skin || opts.animation) requirePro(name);
      if (opts.skin) setSkin(opts.skin);
      if (opts.animation) setAnimation(opts.animation);
      var result = fn(opts);
      if (currentSkin) {
        setTimeout(function () { applySkinToRoots(currentSkin); }, 0);
      }
      return result;
    };
  }

  function installWrappers() {
    var A = baseAuralert();
    if (!A || A._proInstalled) return;
    A._originalToast = A._originalToast || A.toast;
    A._originalModal = A._originalModal || A.modal;
    A._originalBanner = A._originalBanner || A.banner;
    A._originalNotify = A._originalNotify || A.notify;
    A.toast = wrapMethod('toast', A._originalToast);
    A.modal = wrapMethod('modal', A._originalModal);
    A.banner = wrapMethod('banner', A._originalBanner);
    A.notify = wrapMethod('notify', A._originalNotify);
    A._proInstalled = true;
  }

  function isValidResult(result) {
    return result === true || !!(result && result.valid);
  }

  function activate(licenseKey) {
    if (!licenseKey) return Promise.resolve(false);

    function finish(result) {
      var ok = isValidResult(result);
      licenseActive = ok;
      if (ok) {
        persistLicense(licenseKey);
        injectProStyles();
        installWrappers();
        markProRoots();
        applySkinToRoots(currentSkin);
        applyAnimationToRoots(currentAnimation);
      }
      return ok;
    }

    if (config.licenseServer) {
      return validateRemote(licenseKey).then(function (remoteOk) {
        if (remoteOk) return finish(true);
        return validateOffline(licenseKey).then(finish);
      });
    }
    return validateOffline(licenseKey).then(finish);
  }

  function checkLicense(licenseKey) {
    return validateOffline(licenseKey);
  }

  function deactivate() {
    clearLicense();
  }

  function isActive() {
    return licenseActive;
  }

  function setSkin(skin) {
    requirePro('setSkin');
    if (SKINS.indexOf(skin) < 0) {
      throw new Error('Unknown skin. Use: ' + SKINS.join(', '));
    }
    currentSkin = skin;
    injectProStyles();
    markProRoots();
    applySkinToRoots(skin);
    flashSkinTransition();
    return skin;
  }

  function setAnimation(anim) {
    requirePro('setAnimation');
    if (ANIMATIONS.indexOf(anim) < 0) {
      throw new Error('Unknown animation. Use: ' + ANIMATIONS.join(', '));
    }
    currentAnimation = anim;
    injectProStyles();
    applyAnimationToRoots(anim);
    return anim;
  }

  function configure(opts) {
    if (!opts) return;
    if (opts.licenseServer) config.licenseServer = opts.licenseServer;
    if (opts.skin) setSkin(opts.skin);
    if (opts.animation) setAnimation(opts.animation);
  }

  function initFromStorage() {
    var stored = loadStoredLicense();
    if (stored) return activate(stored);
    return Promise.resolve(false);
  }

  var AuralertPro = {
    activate: activate,
    deactivate: deactivate,
    isActive: isActive,
    checkLicense: checkLicense,
    setSkin: setSkin,
    setAnimation: setAnimation,
    configure: configure,
    skins: SKINS.slice(),
    animations: ANIMATIONS.slice(),
    version: '1.0.1'
  };

  global.AuralertPro = AuralertPro;

  var A = baseAuralert();
  if (A) {
    A.activate = activate;
    A.deactivate = deactivate;
    A.isPro = isActive;
    A.setSkin = setSkin;
    A.setAnimation = setAnimation;
    A.checkLicense = checkLicense;
    A.pro = AuralertPro;
    initFromStorage();
  }
})(typeof window !== 'undefined' ? window : global);
