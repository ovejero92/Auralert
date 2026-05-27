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
    var message = options.message || '';
    var type = normalizeType(options.type);
    var duration = options.duration !== undefined ? options.duration : 3000;
    var position = options.position || 'top-right';

    var container = getContainer('aa-toast-container', { position: position });
    var isRight = position.indexOf('right') >= 0;
    var enterClass = 'aa-enter-' + position;
    var exitClass = 'aa-exit-' + position;

    var el = document.createElement('div');
    el.className = 'aa-toast ' + enterClass;
    el.setAttribute('data-type', type);

    var icon = document.createElement('span');
    icon.className = 'aa-toast-icon';
    icon.textContent = ICONS[type];
    icon.setAttribute('aria-hidden', 'true');

    var msg = document.createElement('span');
    msg.className = 'aa-toast-msg';
    msg.textContent = message;

    el.appendChild(icon);
    el.appendChild(msg);
    container.appendChild(el);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      removeAfterAnimation(el, exitClass, 300);
    }

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss, element: el };
  }

  function modal(options) {
    options = options || {};
    var title = options.title || '';
    var message = options.message || '';
    var type = normalizeType(options.type);
    var confirmText = options.confirmText || 'Aceptar';
    var cancelText = options.cancelText || 'Cancelar';
    var showCancel = options.showCancel;
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
        close(value);
      }

      var overlay = document.createElement('div');
      overlay.className = 'aa-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      var box = document.createElement('div');
      box.className = 'aa-modal';
      box.setAttribute('data-type', type);

      var iconEl = document.createElement('div');
      iconEl.className = 'aa-modal-icon';
      iconEl.textContent = ICONS[type];
      iconEl.setAttribute('aria-hidden', 'true');

      var titleEl = document.createElement('h2');
      titleEl.className = 'aa-modal-title';
      titleEl.textContent = title;

      var msgEl = document.createElement('p');
      msgEl.className = 'aa-modal-message';
      msgEl.textContent = message;

      var actions = document.createElement('div');
      actions.className = 'aa-modal-actions';

      var btnConfirm = document.createElement('button');
      btnConfirm.type = 'button';
      btnConfirm.className = 'aa-btn aa-btn-primary';
      btnConfirm.textContent = confirmText;

      var btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.className = 'aa-btn aa-btn-secondary';
      btnCancel.textContent = cancelText;

      function close(result) {
        overlay.classList.add('aa-closing');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(result);
        }, 200);
      }

      btnConfirm.addEventListener('click', function () {
        if (options.onConfirm) options.onConfirm();
        finish(true);
      });

      btnCancel.addEventListener('click', function () {
        if (options.onCancel) options.onCancel();
        finish(false);
      });

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) finish(false);
      });

      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', onKey);
          if (options.onCancel) options.onCancel();
          finish(false);
        }
      });

      actions.appendChild(btnConfirm);
      if (showCancel) actions.appendChild(btnCancel);

      box.appendChild(iconEl);
      if (title) box.appendChild(titleEl);
      if (message) box.appendChild(msgEl);
      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      btnConfirm.focus();
    });
  }

  function banner(options) {
    options = options || {};
    var message = options.message || '';
    var type = normalizeType(options.type);
    var position = options.position || 'top';
    var duration = options.duration !== undefined ? options.duration : 0;
    var closeable = options.closeable !== false;

    var container = getContainer('aa-banner-container', { position: position });
    var enterClass = 'aa-enter-' + position;
    var exitClass = 'aa-exit-' + position;

    var el = document.createElement('div');
    el.className = 'aa-banner ' + enterClass;
    el.setAttribute('data-type', type);
    el.setAttribute('role', 'alert');

    var icon = document.createElement('span');
    icon.className = 'aa-banner-icon';
    icon.textContent = ICONS[type];
    icon.setAttribute('aria-hidden', 'true');

    var text = document.createElement('span');
    text.textContent = message;

    el.appendChild(icon);
    el.appendChild(text);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      removeAfterAnimation(el, exitClass, 300);
    }

    if (closeable) {
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'aa-banner-close';
      closeBtn.setAttribute('aria-label', 'Cerrar');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', dismiss);
      el.appendChild(closeBtn);
    }

    container.appendChild(el);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss, element: el };
  }

  function notify(options) {
    options = options || {};
    var title = options.title || '';
    var message = options.message || '';
    var type = normalizeType(options.type);
    var duration = options.duration !== undefined ? options.duration : 5000;

    var container = getContainer('aa-notify-container', {});

    var el = document.createElement('div');
    el.className = 'aa-notify aa-enter';
    el.setAttribute('data-type', type);

    var icon = document.createElement('div');
    icon.className = 'aa-notify-icon';
    icon.textContent = ICONS[type];
    icon.setAttribute('aria-hidden', 'true');

    var body = document.createElement('div');
    body.className = 'aa-notify-body';

    if (title) {
      var titleEl = document.createElement('p');
      titleEl.className = 'aa-notify-title';
      titleEl.textContent = title;
      body.appendChild(titleEl);
    }

    if (message) {
      var msgEl = document.createElement('p');
      msgEl.className = 'aa-notify-message';
      msgEl.textContent = message;
      body.appendChild(msgEl);
    }

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'aa-notify-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = '×';

    el.appendChild(icon);
    el.appendChild(body);
    el.appendChild(closeBtn);
    container.appendChild(el);

    var timer;
    function dismiss() {
      if (timer) clearTimeout(timer);
      removeAfterAnimation(el, 'aa-exit', 300);
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

  var Auralert = {
    toast: toast,
    modal: modal,
    banner: banner,
    notify: notify,
    setTheme: setTheme,
    getTheme: getTheme,
    version: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auralert;
  } else {
    global.Auralert = Auralert;
  }
})(typeof window !== 'undefined' ? window : global);
