/**
 * Auralert — vanilla JS alert library
 * @license MIT
 */
(function (global) {
  'use strict';

  var STYLES = `/* Auralert — base styles */
.auralert-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

.auralert-root *,
.auralert-root *::before,
.auralert-root *::after {
  box-sizing: border-box;
}

/* ── Containers ── */
.aa-toast-container {
  position: fixed;
  z-index: 99990;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.aa-toast-container[data-position="top-right"] { top: 0; right: 0; align-items: flex-end; }
.aa-toast-container[data-position="top-left"] { top: 0; left: 0; align-items: flex-start; }
.aa-toast-container[data-position="bottom-right"] { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }
.aa-toast-container[data-position="bottom-left"] { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }

.aa-notify-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 99985;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: calc(100% - 32px);
  pointer-events: none;
}

.aa-banner-container {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 99980;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.aa-banner-container[data-position="top"] { top: 0; }
.aa-banner-container[data-position="bottom"] { bottom: 0; flex-direction: column-reverse; }

/* ── Toast ── */
.aa-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--aa-bg-elevated);
  color: var(--aa-text);
  border-radius: 8px;
  box-shadow: var(--aa-shadow);
  border: 1px solid var(--aa-border);
  min-width: 260px;
  max-width: 100%;
  font-size: 14px;
  line-height: 1.45;
}

.aa-toast[data-type="success"] { border-left: 4px solid var(--aa-success); }
.aa-toast[data-type="error"] { border-left: 4px solid var(--aa-error); }
.aa-toast[data-type="warning"] { border-left: 4px solid var(--aa-warning); }
.aa-toast[data-type="info"] { border-left: 4px solid var(--aa-info); }

.aa-toast-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.aa-toast[data-type="success"] .aa-toast-icon { background: var(--aa-success-bg); color: var(--aa-success); }
.aa-toast[data-type="error"] .aa-toast-icon { background: var(--aa-error-bg); color: var(--aa-error); }
.aa-toast[data-type="warning"] .aa-toast-icon { background: var(--aa-warning-bg); color: var(--aa-warning); }
.aa-toast[data-type="info"] .aa-toast-icon { background: var(--aa-info-bg); color: var(--aa-info); }

.aa-toast-msg { flex: 1; }

.aa-toast.aa-enter-top-right,
.aa-toast.aa-enter-bottom-right { animation: aa-toast-in-right 0.35s ease forwards; }
.aa-toast.aa-enter-top-left,
.aa-toast.aa-enter-bottom-left { animation: aa-toast-in-left 0.35s ease forwards; }
.aa-toast.aa-exit-top-right,
.aa-toast.aa-exit-bottom-right { animation: aa-toast-out-right 0.3s ease forwards; }
.aa-toast.aa-exit-top-left,
.aa-toast.aa-exit-bottom-left { animation: aa-toast-out-left 0.3s ease forwards; }

@keyframes aa-toast-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes aa-toast-in-left {
  from { opacity: 0; transform: translateX(-100%); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes aa-toast-out-right {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
}
@keyframes aa-toast-out-left {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-100%); }
}

/* ── Modal ── */
.aa-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--aa-overlay);
  opacity: 0;
  animation: aa-overlay-in 0.25s ease forwards;
}

.aa-modal-overlay.aa-closing {
  animation: aa-overlay-out 0.2s ease forwards;
}

.aa-modal {
  background: var(--aa-bg-elevated);
  color: var(--aa-text);
  border-radius: 12px;
  box-shadow: var(--aa-shadow-lg);
  border: 1px solid var(--aa-border);
  max-width: 420px;
  width: 100%;
  padding: 28px 28px 24px;
  transform: scale(0.8);
  opacity: 0;
  animation: aa-modal-in 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
}

.aa-modal-overlay.aa-closing .aa-modal {
  animation: aa-modal-out 0.2s ease forwards;
}

.aa-modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  margin: 0 auto 16px;
}

.aa-modal[data-type="success"] .aa-modal-icon { background: var(--aa-success-bg); color: var(--aa-success); }
.aa-modal[data-type="error"] .aa-modal-icon { background: var(--aa-error-bg); color: var(--aa-error); }
.aa-modal[data-type="warning"] .aa-modal-icon { background: var(--aa-warning-bg); color: var(--aa-warning); }
.aa-modal[data-type="info"] .aa-modal-icon { background: var(--aa-info-bg); color: var(--aa-info); }

.aa-modal-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 8px;
  line-height: 1.35;
}

.aa-modal-message {
  font-size: 14px;
  color: var(--aa-text-muted);
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.55;
}

.aa-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.aa-btn {
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}

.aa-btn:hover { opacity: 0.9; }
.aa-btn:active { transform: scale(0.98); }

.aa-btn-primary {
  background: var(--aa-btn-primary-bg);
  color: var(--aa-btn-primary-text);
}

.aa-btn-secondary {
  background: var(--aa-btn-secondary-bg);
  color: var(--aa-btn-secondary-text);
}

@keyframes aa-overlay-in {
  to { opacity: 1; }
}
@keyframes aa-overlay-out {
  to { opacity: 0; }
}
@keyframes aa-modal-in {
  to { opacity: 1; transform: scale(1); }
}
@keyframes aa-modal-out {
  to { opacity: 0; transform: scale(0.9); }
}

/* ── Banner ── */
.aa-banner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--aa-bg-elevated);
  color: var(--aa-text);
  border-bottom: 1px solid var(--aa-border);
  box-shadow: var(--aa-shadow);
  font-size: 14px;
  line-height: 1.45;
}

.aa-banner-container[data-position="bottom"] .aa-banner {
  border-bottom: none;
  border-top: 1px solid var(--aa-border);
}

.aa-banner[data-type="success"] { background: var(--aa-success-bg); border-color: var(--aa-success); }
.aa-banner[data-type="error"] { background: var(--aa-error-bg); }
.aa-banner[data-type="warning"] { background: var(--aa-warning-bg); }
.aa-banner[data-type="info"] { background: var(--aa-info-bg); }

.aa-banner-icon {
  font-weight: 700;
  font-size: 16px;
}

.aa-banner[data-type="success"] .aa-banner-icon { color: var(--aa-success); }
.aa-banner[data-type="error"] .aa-banner-icon { color: var(--aa-error); }
.aa-banner[data-type="warning"] .aa-banner-icon { color: var(--aa-warning); }
.aa-banner[data-type="info"] .aa-banner-icon { color: var(--aa-info); }

.aa-banner-close {
  background: none;
  border: none;
  color: var(--aa-text-muted);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  margin-left: 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.aa-banner-close:hover {
  background: var(--aa-border);
  color: var(--aa-text);
}

.aa-banner.aa-enter-top { animation: aa-banner-in-top 0.35s ease forwards; }
.aa-banner.aa-enter-bottom { animation: aa-banner-in-bottom 0.35s ease forwards; }
.aa-banner.aa-exit-top { animation: aa-banner-out-top 0.3s ease forwards; }
.aa-banner.aa-exit-bottom { animation: aa-banner-out-bottom 0.3s ease forwards; }

@keyframes aa-banner-in-top {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes aa-banner-in-bottom {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes aa-banner-out-top {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-100%); }
}
@keyframes aa-banner-out-bottom {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(100%); }
}

/* ── Notify ── */
.aa-notify {
  pointer-events: auto;
  display: flex;
  gap: 14px;
  padding: 16px 18px;
  background: var(--aa-bg-elevated);
  color: var(--aa-text);
  border-radius: 12px;
  box-shadow: var(--aa-shadow-lg);
  border: 1px solid var(--aa-border);
  font-size: 14px;
  line-height: 1.45;
}

.aa-notify-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.aa-notify[data-type="success"] .aa-notify-icon { background: var(--aa-success-bg); color: var(--aa-success); }
.aa-notify[data-type="error"] .aa-notify-icon { background: var(--aa-error-bg); color: var(--aa-error); }
.aa-notify[data-type="warning"] .aa-notify-icon { background: var(--aa-warning-bg); color: var(--aa-warning); }
.aa-notify[data-type="info"] .aa-notify-icon { background: var(--aa-info-bg); color: var(--aa-info); }

.aa-notify-body { flex: 1; min-width: 0; }

.aa-notify-title {
  font-weight: 600;
  font-size: 15px;
  margin: 0 0 4px;
}

.aa-notify-message {
  color: var(--aa-text-muted);
  margin: 0;
  font-size: 13px;
}

.aa-notify-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--aa-text-muted);
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
  line-height: 1;
  align-self: flex-start;
}

.aa-notify-close:hover { color: var(--aa-text); }

.aa-notify.aa-enter { animation: aa-notify-in 0.45s cubic-bezier(0.34, 1.35, 0.64, 1) forwards; }
.aa-notify.aa-exit { animation: aa-notify-out 0.3s ease forwards; }

@keyframes aa-notify-in {
  0% { opacity: 0; transform: translateX(120%); }
  70% { transform: translateX(-6px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes aa-notify-out {
  to { opacity: 0; transform: translateX(120%); }
}

/* Auralert — light theme (default) */
.auralert-root[data-auralert-theme="light"],
.auralert-root:not([data-auralert-theme]) {
  --aa-bg: #ffffff;
  --aa-bg-muted: #f8fafc;
  --aa-bg-elevated: #ffffff;
  --aa-text: #0f172a;
  --aa-text-muted: #64748b;
  --aa-border: rgba(15, 23, 42, 0.08);
  --aa-overlay: rgba(15, 23, 42, 0.45);
  --aa-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 10px 24px -4px rgba(0, 0, 0, 0.1);
  --aa-shadow-lg: 0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 24px 48px -12px rgba(0, 0, 0, 0.15);
  --aa-success: #10b981;
  --aa-error: #ef4444;
  --aa-warning: #f59e0b;
  --aa-info: #6366f1;
  --aa-success-bg: rgba(16, 185, 129, 0.12);
  --aa-error-bg: rgba(239, 68, 68, 0.12);
  --aa-warning-bg: rgba(245, 158, 11, 0.12);
  --aa-info-bg: rgba(99, 102, 241, 0.12);
  --aa-btn-primary-bg: #0f172a;
  --aa-btn-primary-text: #ffffff;
  --aa-btn-secondary-bg: #f1f5f9;
  --aa-btn-secondary-text: #334155;
}

/* Auralert — dark theme */
.auralert-root[data-auralert-theme="dark"] {
  --aa-bg: #1e1e2e;
  --aa-bg-muted: #27273a;
  --aa-bg-elevated: #2a2a3d;
  --aa-text: #f1f5f9;
  --aa-text-muted: #94a3b8;
  --aa-border: rgba(255, 255, 255, 0.08);
  --aa-overlay: rgba(0, 0, 0, 0.65);
  --aa-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 10px 24px -4px rgba(0, 0, 0, 0.4);
  --aa-shadow-lg: 0 8px 16px -4px rgba(0, 0, 0, 0.35), 0 24px 48px -12px rgba(0, 0, 0, 0.5);
  --aa-success: #34d399;
  --aa-error: #f87171;
  --aa-warning: #fbbf24;
  --aa-info: #818cf8;
  --aa-success-bg: rgba(52, 211, 153, 0.18);
  --aa-error-bg: rgba(248, 113, 113, 0.18);
  --aa-warning-bg: rgba(251, 191, 36, 0.18);
  --aa-info-bg: rgba(129, 140, 248, 0.18);
  --aa-btn-primary-bg: #818cf8;
  --aa-btn-primary-text: #0f172a;
  --aa-btn-secondary-bg: #3f3f5a;
  --aa-btn-secondary-text: #e2e8f0;
}
`;

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

  function getContainer(className, attrs) {
    init();
    var root = ensureRoot();
    var key = className + JSON.stringify(attrs || {});
    var existing = root.querySelector('[data-aa-container="' + key + '"]');
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
