/**
 * Auralert — vanilla JS alert library
 * @license MIT
 */
(function (global) {
  'use strict';

  var STYLES = /* AURALERT_STYLES */ '';

  var TYPES = ['success', 'error', 'warning', 'info'];
  var ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' };
  var DEFAULT_TYPE = 'info';

  var themeMode = 'auto';
  var resolvedTheme = 'light';
  var rootEl = null;
  var mediaQuery = null;

  function normalizeType(type) {
    return TYPES.indexOf(type) >= 0 ? type : DEFAULT_TYPE;
  }

  function loadFont() {
    if (document.getElementById('auralert-inter-font')) return;
    var link = document.createElement('link');
    link.id = 'auralert-inter-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  function injectStyles() {
    if (document.getElementById('auralert-styles')) return;
    var style = document.createElement('style');
    style.id = 'auralert-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function resolveTheme() {
    if (themeMode === 'light' || themeMode === 'dark') {
      resolvedTheme = themeMode;
    } else {
      resolvedTheme = mediaQuery && mediaQuery.matches ? 'dark' : 'light';
    }
    if (rootEl) {
      rootEl.setAttribute('data-auralert-theme', resolvedTheme);
    }
    return resolvedTheme;
  }

  function ensureRoot() {
    if (rootEl && document.body.contains(rootEl)) return rootEl;
    rootEl = document.createElement('div');
    rootEl.className = 'auralert-root';
    rootEl.setAttribute('data-auralert-theme', resolvedTheme);
    document.body.appendChild(rootEl);
    return rootEl;
  }

  function themedShell(className) {
    var el = document.createElement('div');
    el.className = className + ' auralert-root';
    el.setAttribute('data-auralert-theme', resolvedTheme);
    return el;
  }

  function init() {
    loadFont();
    injectStyles();
    if (!mediaQuery) {
      mediaQuery = global.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function () {
        if (themeMode === 'auto') resolveTheme();
      });
    }
    resolveTheme();
  }

  function makeContainerKey(className, attrs) {
    if (!attrs || !Object.keys(attrs).length) return className;
    var parts = [className];
    Object.keys(attrs).sort().forEach(function (k) {
      parts.push(k + '-' + String(attrs[k]));
    });
    return parts.join('--');
  }

  function findContainer(root, key) {
    var nodes = root.querySelectorAll('[data-aa-container]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('data-aa-container') === key) return nodes[i];
    }
    return null;
  }

  function getContainer(className, attrs) {
    init();
    var root = ensureRoot();
    var key = makeContainerKey(className, attrs);
    var existing = findContainer(root, key);
    if (existing) return existing;

    var el = document.createElement('div');
    el.className = className;
    el.setAttribute('data-aa-container', key);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        el.setAttribute('data-' + k, attrs[k]);
      });
    }
    root.appendChild(el);
    return el;
  }

  function applyClasses(el, options, keys) {
    if (!options) return;
    keys.forEach(function (k) {
      if (options[k]) {
        String(options[k]).split(/\s+/).forEach(function (c) {
          if (c) el.classList.add(c);
        });
      }
    });
  }

  function applyStyles(el, style) {
    if (!style || typeof style !== 'object') return;
    Object.keys(style).forEach(function (k) {
      el.style[k] = style[k];
    });
  }

  function setNodeContent(node, text, html) {
    if (html) {
      node.innerHTML = html;
    } else if (text !== undefined && text !== null) {
      node.textContent = text;
    }
  }

  function resolveIcon(options, fallbackType) {
    if (options.icon === false || options.showIcon === false) return null;
    if (options.icon !== undefined && options.icon !== null) return options.icon;
    return ICONS[normalizeType(options.type || fallbackType)];
  }

  function callFn(fn, arg) {
    if (typeof fn === 'function') fn(arg);
  }

  function removeAfterAnimation(el, animClass, ms) {
    return new Promise(function (resolve) {
      el.classList.add(animClass);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        resolve();
      }, ms || 300);
    });
  }

  function toast(options) {
    options = options || {};
    var type = normalizeType(options.type);
    var duration = options.duration !== undefined ? options.duration : 3000;
    var position = options.position || 'top-right';
    var enterClass = 'aa-enter-' + position;
    var exitClass = 'aa-exit-' + position;

    var container = getContainer('aa-toast-container', { position: position });

    var el = document.createElement('div');
    el.className = 'aa-toast ' + enterClass;
    el.setAttribute('data-type', type);
    applyClasses(el, options, ['className', 'toastClass', 'customClass']);
    applyStyles(el, options.style);

    var iconChar = resolveIcon(options, type);
    if (iconChar !== null) {
      var icon = document.createElement('span');
      icon.className = 'aa-toast-icon';
      icon.textContent = iconChar;
      icon.setAttribute('aria-hidden', 'true');
      applyClasses(icon, options, ['iconClass']);
      el.appendChild(icon);
    }

    var msg = document.createElement('span');
    msg.className = 'aa-toast-msg';
    setNodeContent(msg, options.message, options.html);
    applyClasses(msg, options, ['messageClass']);
    el.appendChild(msg);

    container.appendChild(el);
    callFn(options.onShow, el);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      callFn(options.onClose, el);
      removeAfterAnimation(el, exitClass, options.animationDuration || 300);
    }

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss, element: el };
  }

  function modal(options) {
    options = options || {};
    var type = normalizeType(options.type);
    var confirmText = options.confirmText || 'Aceptar';
    var cancelText = options.cancelText || 'Cancelar';
    var showCancel = options.showCancel;
    var closeOnBackdrop = options.closeOnBackdrop !== false;
    var closeOnEscape = options.closeOnEscape !== false;
    var showIcon = resolveIcon(options, type);

    if (showCancel === undefined) {
      showCancel = !!(options.onCancel || options.cancelText);
    }

    init();
    ensureRoot();

    return new Promise(function (resolve) {
      var settled = false;

      function finish(value) {
        if (settled) return;
        settled = true;
        callFn(options.onClose, value);
        overlay.classList.add('aa-closing');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(value);
        }, options.animationDuration || 200);
      }

      var overlay = themedShell('aa-modal-overlay');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      applyClasses(overlay, options, ['overlayClass', 'customClass']);
      applyStyles(overlay, options.overlayStyle);

      if (options.backdrop === false) {
        overlay.style.background = 'transparent';
      }

      var box = document.createElement('div');
      box.className = 'aa-modal';
      box.setAttribute('data-type', type);
      applyClasses(box, options, ['className', 'modalClass', 'customClass']);
      applyStyles(box, options.style);
      if (options.width) box.style.maxWidth = options.width;
      if (options.maxWidth) box.style.maxWidth = options.maxWidth;

      if (showIcon !== null) {
        var iconEl = document.createElement('div');
        iconEl.className = 'aa-modal-icon';
        iconEl.textContent = showIcon;
        iconEl.setAttribute('aria-hidden', 'true');
        applyClasses(iconEl, options, ['iconClass']);
        box.appendChild(iconEl);
      }

      if (options.title || options.titleHtml) {
        var titleEl = document.createElement('h2');
        titleEl.className = 'aa-modal-title';
        setNodeContent(titleEl, options.title, options.titleHtml);
        applyClasses(titleEl, options, ['titleClass']);
        box.appendChild(titleEl);
      }

      if (options.message || options.html) {
        var msgEl = document.createElement('p');
        msgEl.className = 'aa-modal-message';
        setNodeContent(msgEl, options.message, options.html);
        applyClasses(msgEl, options, ['messageClass']);
        box.appendChild(msgEl);
      }

      var actions = document.createElement('div');
      actions.className = 'aa-modal-actions';
      applyClasses(actions, options, ['actionsClass']);

      function wireButton(btn, defaultClass, defaultValue) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'aa-btn ' + (btn.className || defaultClass);
        b.textContent = btn.text || btn.label || 'OK';
        applyStyles(b, btn.style);
        b.addEventListener('click', function () {
          callFn(btn.onClick, b);
          if (btn.handler) btn.handler();
          finish(btn.value !== undefined ? btn.value : defaultValue);
        });
        return b;
      }

      if (options.buttons && options.buttons.length) {
        options.buttons.forEach(function (btn) {
          actions.appendChild(wireButton(btn, 'aa-btn-primary', true));
        });
      } else {
        var btnConfirm = document.createElement('button');
        btnConfirm.type = 'button';
        btnConfirm.className = 'aa-btn aa-btn-primary';
        btnConfirm.textContent = confirmText;
        applyClasses(btnConfirm, options, ['confirmClass']);
        applyStyles(btnConfirm, options.confirmStyle);
        btnConfirm.addEventListener('click', function () {
          callFn(options.onConfirm);
          finish(true);
        });

        var btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'aa-btn aa-btn-secondary';
        btnCancel.textContent = cancelText;
        applyClasses(btnCancel, options, ['cancelClass']);
        applyStyles(btnCancel, options.cancelStyle);
        btnCancel.addEventListener('click', function () {
          callFn(options.onCancel);
          finish(false);
        });

        actions.appendChild(btnConfirm);
        if (showCancel) actions.appendChild(btnCancel);
      }

      box.appendChild(actions);
      overlay.appendChild(box);
      ensureRoot().appendChild(overlay);

      if (closeOnBackdrop) {
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) {
            callFn(options.onCancel);
            finish(false);
          }
        });
      }

      if (closeOnEscape) {
        document.addEventListener('keydown', function onKey(e) {
          if (e.key === 'Escape') {
            document.removeEventListener('keydown', onKey);
            callFn(options.onCancel);
            finish(false);
          }
        });
      }

      var firstBtn = overlay.querySelector('button');
      if (firstBtn) firstBtn.focus();

      callFn(options.onOpen, overlay);
    });
  }

  function banner(options) {
    options = options || {};
    var type = normalizeType(options.type);
    var position = options.position || 'top';
    var duration = options.duration !== undefined ? options.duration : 0;
    var closeable = options.closeable !== false;
    var enterClass = 'aa-enter-' + position;
    var exitClass = 'aa-exit-' + position;

    var container = getContainer('aa-banner-container', { position: position });

    var el = document.createElement('div');
    el.className = 'aa-banner ' + enterClass;
    el.setAttribute('data-type', type);
    el.setAttribute('role', 'alert');
    applyClasses(el, options, ['className', 'bannerClass', 'customClass']);
    applyStyles(el, options.style);

    var iconChar = resolveIcon(options, type);
    if (iconChar !== null) {
      var icon = document.createElement('span');
      icon.className = 'aa-banner-icon';
      icon.textContent = iconChar;
      icon.setAttribute('aria-hidden', 'true');
      el.appendChild(icon);
    }

    var text = document.createElement('span');
    setNodeContent(text, options.message, options.html);
    applyClasses(text, options, ['messageClass']);
    el.appendChild(text);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      callFn(options.onClose, el);
      removeAfterAnimation(el, exitClass, options.animationDuration || 300);
    }

    if (closeable) {
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'aa-banner-close';
      closeBtn.setAttribute('aria-label', 'Cerrar');
      closeBtn.textContent = options.closeText || '×';
      closeBtn.addEventListener('click', dismiss);
      el.appendChild(closeBtn);
    }

    container.appendChild(el);
    callFn(options.onShow, el);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss, element: el };
  }

  function notify(options) {
    options = options || {};
    var type = normalizeType(options.type);
    var duration = options.duration !== undefined ? options.duration : 5000;

    var container = getContainer('aa-notify-container', {});

    var el = document.createElement('div');
    el.className = 'aa-notify aa-enter';
    el.setAttribute('data-type', type);
    applyClasses(el, options, ['className', 'notifyClass', 'customClass']);
    applyStyles(el, options.style);

    var iconChar = resolveIcon(options, type);
    if (iconChar !== null) {
      var icon = document.createElement('div');
      icon.className = 'aa-notify-icon';
      icon.textContent = iconChar;
      icon.setAttribute('aria-hidden', 'true');
      applyClasses(icon, options, ['iconClass']);
      el.appendChild(icon);
    }

    var body = document.createElement('div');
    body.className = 'aa-notify-body';
    applyClasses(body, options, ['bodyClass']);

    if (options.title || options.titleHtml) {
      var titleEl = document.createElement('p');
      titleEl.className = 'aa-notify-title';
      setNodeContent(titleEl, options.title, options.titleHtml);
      applyClasses(titleEl, options, ['titleClass']);
      body.appendChild(titleEl);
    }

    if (options.message || options.html) {
      var msgEl = document.createElement('p');
      msgEl.className = 'aa-notify-message';
      setNodeContent(msgEl, options.message, options.html);
      applyClasses(msgEl, options, ['messageClass']);
      body.appendChild(msgEl);
    }

    el.appendChild(body);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'aa-notify-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = options.closeText || '×';
    closeBtn.addEventListener('click', dismiss);

    el.appendChild(closeBtn);
    container.appendChild(el);
    callFn(options.onShow, el);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      callFn(options.onClose, el);
      removeAfterAnimation(el, 'aa-exit', options.animationDuration || 300);
    }

    closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss, element: el };
  }

  function setTheme(theme) {
    if (theme === 'light' || theme === 'dark' || theme === 'auto') {
      themeMode = theme;
      resolveTheme();
    }
    return resolvedTheme;
  }

  function getTheme() {
    return { mode: themeMode, resolved: resolvedTheme };
  }

  function configure(defaults) {
    if (!defaults || typeof defaults !== 'object') return;
    var wrap = function (fn) {
      return function (opts) {
        var merged = {};
        var k;
        for (k in defaults) {
          if (Object.prototype.hasOwnProperty.call(defaults, k)) merged[k] = defaults[k];
        }
        opts = opts || {};
        for (k in opts) {
          if (Object.prototype.hasOwnProperty.call(opts, k)) merged[k] = opts[k];
        }
        return fn(merged);
      };
    };
    if (defaults.toast) Auralert.toast = wrap(toast);
    if (defaults.modal) Auralert.modal = wrap(modal);
    if (defaults.banner) Auralert.banner = wrap(banner);
    if (defaults.notify) Auralert.notify = wrap(notify);
    if (defaults.theme) setTheme(defaults.theme);
  }

  var Auralert = {
    toast: toast,
    modal: modal,
    banner: banner,
    notify: notify,
    setTheme: setTheme,
    getTheme: getTheme,
    configure: configure,
    version: '1.4.0'
  };

  var _helpers = {
    init: init,
    ensureRoot: ensureRoot,
    themedShell: themedShell,
    getContainer: getContainer,
    applyClasses: applyClasses,
    applyStyles: applyStyles,
    callFn: callFn,
    normalizeType: normalizeType,
    TYPES: TYPES,
    POSITIONS: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
  };

  if (typeof global.__auralertInstallForms === 'function') {
    global.__auralertInstallForms(Auralert, _helpers);
  }

  /** shape: 'pill' | 'ribbon' | 'sheet' — formas alternativas con animaciones morph */
  var _classicToast = toast;
  var _classicBanner = banner;
  var _classicModal = modal;

  Auralert.toast = function (options) {
    options = options || {};
    if (options.shape === 'pill' && Auralert._forms) {
      if (options.promise) return Auralert._forms.toastPromise(options.promise, options);
      return Auralert._forms.toast(options);
    }
    return _classicToast(options);
  };

  Auralert.banner = function (options) {
    options = options || {};
    if (options.shape === 'ribbon' && Auralert._forms) {
      return Auralert._forms.banner(options);
    }
    return _classicBanner(options);
  };

  Auralert.modal = function (options) {
    options = options || {};
    if (options.shape === 'sheet' && Auralert._forms) {
      if (options.promise) return Auralert._forms.modalPromise(options.promise, options);
      return Auralert._forms.modal(options);
    }
    return _classicModal(options);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auralert;
  } else {
    global.Auralert = Auralert;
  }
})(typeof window !== 'undefined' ? window : global);
