/** SVG icons for pill / ribbon / sheet forms */
var AA_FORM_ICONS = {
  success:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  loading:
    '<svg class="aa-form-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>'
};

/**
 * Formas alternativas: pill (toast), ribbon (banner), sheet (modal)
 */
(function (global) {
  'use strict';

  var POSITIONS = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];
  var STATES = ['success', 'error', 'warning', 'info', 'loading'];
  var DEFAULT_DURATION = 6000;
  var toastSeq = 0;
  var bannerSeq = 0;
  var toastRegistry = {};
  var bannerRegistry = {};

  function normalizePos(p) {
    return POSITIONS.indexOf(p) >= 0 ? p : 'top-right';
  }

  function normalizeState(s) {
    return STATES.indexOf(s) >= 0 ? s : 'info';
  }

  function mergeOpts(a, b) {
    var o = {};
    var k;
    a = a || {};
    b = b || {};
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) o[k] = a[k];
    for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) o[k] = b[k];
    return o;
  }

  function iconHtml(state, custom) {
    if (custom === false || custom === null) return '';
    if (typeof custom === 'string' && custom.indexOf('<') >= 0) return custom;
    if (typeof custom === 'string') return custom;
    var icons = global.AA_FORM_ICONS || {};
    return icons[state] || icons.info || '';
  }

  function mapPositionToEnter(position) {
    if (position.indexOf('bottom') === 0) return 'aa-enter-bottom-right';
    if (position.indexOf('top') === 0 && position !== 'top-right') return 'aa-enter-top-left';
    return 'aa-enter-top-right';
  }

  function appendFormContent(body, h, options) {
    var hasDesc = false;
    var desc = options.description;
    if (desc !== undefined && desc !== null && desc !== '') {
      var descEl = document.createElement('p');
      descEl.className = 'aa-form-desc';
      descEl.textContent = typeof desc === 'string' ? desc : '';
      h.applyClasses(descEl, options, ['messageClass', 'descriptionClass']);
      body.appendChild(descEl);
      hasDesc = true;
    }
    if (options.html) {
      var htmlEl = document.createElement('div');
      htmlEl.className = 'aa-form-html';
      htmlEl.innerHTML = options.html;
      body.appendChild(htmlEl);
      hasDesc = true;
    }
    if (options.button && options.button.title) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aa-form-btn';
      btn.textContent = options.button.title;
      h.applyClasses(btn, options, ['buttonClass']);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        h.callFn(options.button.onClick);
        if (options.button.dismiss !== false && options._dismiss) options._dismiss();
      });
      body.appendChild(btn);
      hasDesc = true;
    }
    if (options.buttons && options.buttons.length) {
      var actions = document.createElement('div');
      actions.className = options.actionsClass || 'aa-form-actions';
      options.buttons.forEach(function (btnOpt) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'aa-form-btn';
        b.textContent = btnOpt.text || btnOpt.label || btnOpt.title || 'OK';
        b.addEventListener('click', function () {
          h.callFn(btnOpt.onClick, b);
          if (btnOpt.handler) btnOpt.handler();
          if (options._dismiss) options._dismiss();
        });
        actions.appendChild(b);
      });
      body.appendChild(actions);
      hasDesc = true;
    }
    return hasDesc;
  }

  function buildTabRow(h, options, state) {
    var tab = document.createElement('div');
    tab.className = 'aa-form-tab aa-pill-tab';

    var badge = document.createElement('span');
    badge.className = 'aa-form-badge';
    badge.innerHTML = iconHtml(state, options.icon);
    tab.appendChild(badge);

    var titleText = options.title || options.message || '';
    if (titleText) {
      var titleEl = document.createElement('span');
      titleEl.className = 'aa-form-tab-title';
      titleEl.textContent = titleText;
      h.applyClasses(titleEl, options, ['titleClass']);
      tab.appendChild(titleEl);
    }

    var filL = document.createElement('span');
    filL.className = 'aa-pill-fillet aa-pill-fillet-l';
    filL.setAttribute('aria-hidden', 'true');
    var filR = document.createElement('span');
    filR.className = 'aa-pill-fillet aa-pill-fillet-r';
    filR.setAttribute('aria-hidden', 'true');
    tab.appendChild(filL);
    tab.appendChild(filR);

    return tab;
  }

  function buildMorphPill(h, options, state, anchor) {
    var morph = document.createElement('div');
    morph.className = 'aa-pill-morph';
    morph.setAttribute('data-anchor', anchor);

    var tab = buildTabRow(h, options, state);
    var panel = document.createElement('div');
    panel.className = 'aa-pill-panel';
    var inner = document.createElement('div');
    inner.className = 'aa-pill-panel-inner';
    var hasDesc = appendFormContent(inner, h, options);
    panel.appendChild(inner);

    morph.appendChild(tab);
    morph.appendChild(panel);
    morph._hasBody = hasDesc;

    if (options.fill) morph.style.setProperty('--aa-pill-fill', options.fill);
    if (options.roundness != null) morph.style.setProperty('--aa-pill-round', options.roundness + 'px');
    return morph;
  }

  function buildStack(h, options, state) {
    var surface = document.createElement('div');
    surface.className = 'aa-form-surface';

    var tab = buildTabRow(h, options, state);
    surface.appendChild(tab);

    var body = document.createElement('div');
    body.className = 'aa-form-body';
    var hasDesc = appendFormContent(body, h, options);

    surface.appendChild(body);
    surface._hasBody = hasDesc;
    if (options.fill) surface.style.setProperty('--aa-pill-fill', options.fill);
    if (options.roundness != null) surface.style.setProperty('--aa-pill-round', options.roundness + 'px');
    return surface;
  }

  function updateStackEl(el, h, opts) {
    var state = normalizeState(opts.type || opts.state || el.getAttribute('data-state'));
    el.setAttribute('data-type', state === 'loading' ? 'info' : state);
    el.setAttribute('data-state', state);

    var badge = el.querySelector('.aa-form-badge');
    if (badge) badge.innerHTML = iconHtml(state, opts.icon);

    var titleEl = el.querySelector('.aa-form-tab-title');
    if (titleEl && opts.title !== undefined) titleEl.textContent = opts.title || '';
    else if (titleEl && opts.message !== undefined) titleEl.textContent = opts.message || '';

    var descEl = el.querySelector('.aa-form-desc');
    if (descEl) {
      var desc = opts.description !== undefined ? opts.description : opts.message;
      if (desc !== undefined) {
        descEl.textContent = typeof desc === 'string' ? desc : '';
        el.classList.toggle('aa-pill-has-body', !!desc);
      }
    }

    var htmlEl = el.querySelector('.aa-form-html');
    if (htmlEl && opts.html) htmlEl.innerHTML = opts.html;

    if (opts.fill) {
      var surf = el.querySelector('.aa-pill-morph, .aa-form-surface');
      if (surf) surf.style.setProperty('--aa-pill-fill', opts.fill);
    }
  }

  function installForms(Auralert, h) {
    if (!Auralert || Auralert._formsInstalled) return;

    function dismissToast(id, ms) {
      var rec = toastRegistry[id];
      if (!rec) return;
      if (rec.timer) clearTimeout(rec.timer);
      var el = rec.element;
      el.classList.remove('aa-pill-expanded', 'aa-pill-enter');
      el.classList.add('aa-pill-exit');
      h.callFn(rec.options.onClose, el);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        delete toastRegistry[id];
      }, ms || 320);
    }

    function showPillToast(options) {
      options = options || {};
      h.init();

      var state = normalizeState(options.type || options.state || 'info');
      var position = normalizePos(options.position);
      var duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;
      var expandMode = options.expand;
      if (expandMode === undefined) {
        expandMode = options.autopilot === true ? 'auto' : (options.description ? 'hover' : 'none');
      }
      var id = 'aa-pill-' + (++toastSeq);

      var container = h.getContainer('aa-toast-container', { position: position });

      var el = document.createElement('div');
      el.className = 'aa-toast aa-toast--pill aa-pill-enter ' + mapPositionToEnter(position);
      el.setAttribute('data-type', state === 'loading' ? 'info' : state);
      el.setAttribute('data-state', state);
      el.setAttribute('data-aa-form-id', id);
      h.applyClasses(el, options, ['className', 'toastClass', 'customClass']);
      h.applyStyles(el, options.style);

      var surfaceOpts = mergeOpts(options, { _dismiss: function () { dismissToast(id, options.animationDuration || 320); } });
      var morph = buildMorphPill(h, surfaceOpts, state, position);
      el.setAttribute('data-pill-anchor', position);
      el.appendChild(morph);

      if (morph._hasBody) el.classList.add('aa-pill-has-body');
      if (expandMode === 'auto' || expandMode === true) {
        setTimeout(function () {
          if (el.isConnected) el.classList.add('aa-pill-expanded');
        }, options.expandDelay != null ? options.expandDelay : 120);
      } else if (expandMode === 'always') {
        el.classList.add('aa-pill-expanded');
      }

      container.appendChild(el);
      h.callFn(options.onShow, el);

      function dismiss() {
        dismissToast(id, options.animationDuration || 320);
      }

      toastRegistry[id] = { element: el, options: options, dismiss: dismiss, timer: null };

      if (duration > 0) {
        toastRegistry[id].timer = setTimeout(dismiss, duration);
      }

      return {
        id: id,
        dismiss: dismiss,
        element: el,
        update: function (o) {
          updateStackEl(el, h, o);
          return toastRegistry[id];
        }
      };
    }

    function toastPromise(p, opts) {
      opts = opts || {};
      var loading = opts.loading || { title: 'Cargando…', type: 'loading' };
      var result = showPillToast(mergeOpts({ type: 'loading', duration: null, expand: 'always' }, loading));
      var id = result.id;

      return Promise.resolve(p).then(
        function (data) {
          var successOpts = typeof opts.success === 'function' ? opts.success(data) : opts.success || { title: 'Listo', type: 'success' };
          if (opts.action) {
            var actionOpts = typeof opts.action === 'function' ? opts.action(data) : opts.action;
            updateStackEl(toastRegistry[id].element, h, mergeOpts({ type: 'success', duration: DEFAULT_DURATION }, actionOpts));
          } else {
            updateStackEl(toastRegistry[id].element, h, mergeOpts({ type: 'success', duration: DEFAULT_DURATION }, successOpts));
          }
          toastRegistry[id].element.classList.add('aa-pill-expanded');
          if (toastRegistry[id].timer) clearTimeout(toastRegistry[id].timer);
          var d = successOpts.duration !== undefined ? successOpts.duration : DEFAULT_DURATION;
          if (d > 0) toastRegistry[id].timer = setTimeout(toastRegistry[id].dismiss, d);
          return data;
        },
        function (err) {
          var errorOpts = typeof opts.error === 'function' ? opts.error(err) : opts.error || {
            title: 'Error',
            description: err && err.message ? err.message : String(err),
            type: 'error'
          };
          updateStackEl(toastRegistry[id].element, h, mergeOpts({ type: 'error', duration: DEFAULT_DURATION }, errorOpts));
          toastRegistry[id].element.classList.add('aa-pill-expanded', 'aa-pill-has-body');
          if (toastRegistry[id].timer) clearTimeout(toastRegistry[id].timer);
          var d2 = errorOpts.duration !== undefined ? errorOpts.duration : DEFAULT_DURATION;
          if (d2 > 0) toastRegistry[id].timer = setTimeout(toastRegistry[id].dismiss, d2);
          throw err;
        }
      );
    }

    function showRibbonBanner(options) {
      options = options || {};
      h.init();

      var state = normalizeState(options.type || 'info');
      var position = options.position || 'top';
      var duration = options.duration !== undefined ? options.duration : 0;
      var closeable = options.closeable !== false;
      var id = 'aa-ribbon-' + (++bannerSeq);

      var container = h.getContainer('aa-banner-container', { position: position });

      var el = document.createElement('div');
      el.className = 'aa-banner aa-banner--ribbon aa-enter-' + position;
      el.setAttribute('data-type', state);
      el.setAttribute('role', 'alert');
      el.setAttribute('data-aa-form-id', id);
      h.applyClasses(el, options, ['className', 'bannerClass', 'customClass']);
      h.applyStyles(el, options.style);

      var surface = buildStack(h, mergeOpts(options, {
        _dismiss: function () { dismissRibbon(id, options.animationDuration || 300); }
      }), state);
      surface.style.position = 'relative';
      el.appendChild(surface);

      function dismissRibbon(bid, ms) {
        var rec = bannerRegistry[bid];
        if (!rec) return;
        if (rec.timer) clearTimeout(rec.timer);
        var banner = rec.element;
        h.callFn(rec.options.onClose, banner);
        banner.classList.remove('aa-enter-top', 'aa-enter-bottom');
        banner.classList.add('aa-exit-' + position);
        setTimeout(function () {
          if (banner.parentNode) banner.parentNode.removeChild(banner);
          delete bannerRegistry[bid];
        }, ms || 300);
      }

      function dismiss() {
        dismissRibbon(id, options.animationDuration || 300);
      }

      if (closeable) {
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'aa-banner-close';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.textContent = options.closeText || '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '8px';
        closeBtn.style.right = '8px';
        closeBtn.addEventListener('click', dismiss);
        surface.appendChild(closeBtn);
      }

      container.appendChild(el);
      h.callFn(options.onShow, el);

      bannerRegistry[id] = { element: el, options: options, dismiss: dismiss, timer: null };

      if (duration > 0) {
        bannerRegistry[id].timer = setTimeout(dismiss, duration);
      }

      return { id: id, dismiss: dismiss, element: el };
    }

    function mountSheetOverlay(options, state) {
      h.init();
      h.ensureRoot();

      var overlay = h.themedShell('aa-modal-overlay aa-modal-overlay--sheet');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      h.applyClasses(overlay, options, ['overlayClass', 'customClass']);
      h.applyStyles(overlay, options.overlayStyle);
      if (options.backdrop === false) overlay.style.background = 'transparent';

      var box = document.createElement('div');
      box.className = 'aa-modal aa-modal--sheet';
      if (state === 'loading') box.classList.add('aa-sheet-loading');
      box.setAttribute('data-type', state === 'loading' ? 'info' : state);
      box.setAttribute('data-state', state);
      h.applyClasses(box, options, ['className', 'modalClass', 'customClass']);
      h.applyStyles(box, options.style);

      var surface = buildStack(h, options, state);
      box.appendChild(surface);
      overlay.appendChild(box);
      h.ensureRoot().appendChild(overlay);

      return { overlay: overlay, box: box, surface: surface };
    }

    function morphSheet(box, h, nextOpts, state) {
      updateStackEl(box, h, mergeOpts({ type: state }, nextOpts));
      box.classList.remove('aa-sheet-loading');
      box.classList.add('aa-pill-has-body');

      var body = box.querySelector('.aa-form-body');
      if (body && nextOpts.html) {
        var existing = body.querySelector('.aa-form-html');
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'aa-form-html';
          body.insertBefore(existing, body.firstChild);
        }
        existing.innerHTML = nextOpts.html;
      }
    }

    function closeSheetOverlay(overlay, options, value) {
      h.callFn(options.onClose, value);
      overlay.classList.add('aa-closing');
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(value);
        }, options.animationDuration || 280);
      });
    }

    function showSheetModal(options) {
      options = options || {};
      var type = normalizeState(options.type || 'info');
      var closeOnBackdrop = options.closeOnBackdrop !== false;
      var closeOnEscape = options.closeOnEscape !== false;

      return new Promise(function (resolve) {
        var settled = false;
        var mounted = mountSheetOverlay(options, type);
        var overlay = mounted.overlay;
        var box = mounted.box;
        var surface = mounted.surface;

        function finish(value) {
          if (settled) return;
          settled = true;
          closeSheetOverlay(overlay, options, value).then(resolve);
        }

        if (options.confirmText || options.showConfirm || options.buttons) {
          var body = surface.querySelector('.aa-form-body');
          if (body) {
            var actions = document.createElement('div');
            actions.className = 'aa-sheet-actions';
            if (options.buttons && options.buttons.length) {
              options.buttons.forEach(function (btnOpt) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'aa-form-btn';
                b.textContent = btnOpt.text || btnOpt.label || btnOpt.title || 'OK';
                b.addEventListener('click', function () {
                  h.callFn(btnOpt.onClick, b);
                  if (btnOpt.handler) btnOpt.handler();
                  finish(btnOpt.value !== undefined ? btnOpt.value : true);
                });
                actions.appendChild(b);
              });
            } else {
              var confirm = document.createElement('button');
              confirm.type = 'button';
              confirm.className = 'aa-form-btn';
              confirm.textContent = options.confirmText || 'Aceptar';
              confirm.addEventListener('click', function () {
                h.callFn(options.onConfirm);
                finish(true);
              });
              actions.appendChild(confirm);
              if (options.showCancel || options.cancelText) {
                var cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'aa-form-btn';
                cancel.textContent = options.cancelText || 'Cancelar';
                cancel.addEventListener('click', function () {
                  h.callFn(options.onCancel);
                  finish(false);
                });
                actions.appendChild(cancel);
              }
            }
            body.appendChild(actions);
          }
        }

        if (closeOnBackdrop) {
          overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
              h.callFn(options.onCancel);
              finish(false);
            }
          });
        }

        if (closeOnEscape) {
          document.addEventListener('keydown', function onKey(e) {
            if (e.key === 'Escape') {
              document.removeEventListener('keydown', onKey);
              h.callFn(options.onCancel);
              finish(false);
            }
          });
        }

        h.callFn(options.onOpen, overlay);
      });
    }

    function modalPromise(p, opts) {
      opts = opts || {};
      var loading = opts.loading || { title: 'Cargando…' };
      var mounted = mountSheetOverlay(mergeOpts({
        closeOnBackdrop: false,
        closeOnEscape: false
      }, loading), 'loading');
      var overlay = mounted.overlay;
      var box = mounted.box;

      return Promise.resolve(p).then(
        function (data) {
          var successOpts = typeof opts.success === 'function' ? opts.success(data) : opts.success || { title: 'Listo' };
          morphSheet(box, h, successOpts, 'success');
          if (opts.autoClose !== false) {
            return new Promise(function (res) {
              setTimeout(function () {
                closeSheetOverlay(overlay, opts, true).then(function () { res(data); });
              }, opts.closeDelay != null ? opts.closeDelay : 2200);
            });
          }
          return data;
        },
        function (err) {
          var errorOpts = typeof opts.error === 'function' ? opts.error(err) : opts.error || {
            title: 'Error',
            description: err && err.message ? err.message : String(err)
          };
          morphSheet(box, h, errorOpts, 'error');
          throw err;
        }
      );
    }

    function clearToasts(position) {
      Object.keys(toastRegistry).forEach(function (id) {
        var rec = toastRegistry[id];
        if (!position || rec.element.closest('[data-position="' + position + '"]')) {
          rec.dismiss();
        }
      });
    }

    Auralert._forms = {
      toast: showPillToast,
      toastPromise: toastPromise,
      banner: showRibbonBanner,
      modal: showSheetModal,
      modalPromise: modalPromise,
      dismissToast: dismissToast,
      clearToasts: clearToasts,
      positions: POSITIONS.slice()
    };

    Auralert._formsInstalled = true;
  }

  global.__auralertInstallForms = installForms;
})(typeof window !== 'undefined' ? window : global);

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

/* ── Modal (themed shell carries CSS variables) ── */
.aa-modal-overlay.auralert-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

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

/* ── Formas alternativas: una sola superficie unificada ── */

.aa-toast-container[data-position="top-center"],
.aa-toast-container[data-position="bottom-center"] {
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.aa-toast-container[data-position="top-center"] { top: 0; align-items: center; }
.aa-toast-container[data-position="bottom-center"] {
  bottom: 0;
  flex-direction: column-reverse;
  align-items: center;
}

.aa-toast-container { overflow: visible; }

.aa-toast--pill,
.aa-banner--ribbon,
.aa-modal--sheet {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
  pointer-events: auto;
}

/* ── Superficie única (tab + cuerpo = un solo bloque) ── */
.aa-form-surface {
  --aa-pill-fill: var(--aa-bg-elevated);
  --aa-pill-accent: var(--aa-info);
  --aa-pill-title: var(--aa-text);
  --aa-pill-desc: rgba(100, 116, 139, 0.92);
  --aa-pill-round: 22px;
  position: relative;
  background: var(--aa-pill-fill);
  border: 1px solid var(--aa-border);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  color: var(--aa-pill-title);
  overflow: hidden;
}

.aa-toast--pill[data-type="success"],
.aa-banner--ribbon[data-type="success"],
.aa-modal--sheet[data-type="success"] { --aa-pill-accent: var(--aa-success); }
.aa-toast--pill[data-type="error"],
.aa-banner--ribbon[data-type="error"],
.aa-modal--sheet[data-type="error"] { --aa-pill-accent: var(--aa-error); }
.aa-toast--pill[data-type="warning"],
.aa-banner--ribbon[data-type="warning"],
.aa-modal--sheet[data-type="warning"] { --aa-pill-accent: var(--aa-warning); }
.aa-toast--pill[data-type="info"],
.aa-banner--ribbon[data-type="info"],
.aa-modal--sheet[data-type="info"] { --aa-pill-accent: var(--aa-info); }
.aa-toast--pill[data-state="loading"],
.aa-modal--sheet[data-state="loading"] { --aa-pill-accent: var(--aa-info); }

.aa-form-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 4px 14px 4px 4px;
  color: var(--aa-pill-accent);
  font-size: 14px;
  font-weight: 600;
  max-width: 100%;
}

.aa-form-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--aa-pill-accent) 16%, transparent);
  flex-shrink: 0;
}
.aa-form-badge svg { width: 16px; height: 16px; }

.aa-form-tab-title {
  color: var(--aa-pill-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.aa-form-body {
  overflow: hidden;
  transition:
    max-height 0.45s cubic-bezier(0.34, 1.35, 0.64, 1),
    opacity 0.3s ease,
    padding 0.35s ease,
    border-color 0.25s ease;
}

.aa-form-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--aa-pill-desc);
  font-weight: 400;
}

.aa-form-btn {
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  background: color-mix(in srgb, var(--aa-pill-accent) 14%, var(--aa-pill-fill));
  color: var(--aa-pill-accent);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
}
.aa-form-btn:hover { filter: brightness(1.06); }

.aa-form-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
  flex-wrap: wrap;
}
.aa-form-actions .aa-form-btn { width: auto; min-width: 120px; }

.aa-form-html {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--aa-pill-desc);
}

.aa-form-spin { animation: aa-form-spin 0.75s linear infinite; }
@keyframes aa-form-spin { to { transform: rotate(360deg); } }

/* ── Toast pill morph (tab + panel + fillets por posición) ── */
.aa-toast--pill .aa-pill-morph {
  --aa-pill-fill: var(--aa-bg-elevated);
  --aa-pill-border: var(--aa-border);
  --aa-pill-accent: var(--aa-info);
  --aa-pill-title: var(--aa-text);
  --aa-pill-desc: rgba(100, 116, 139, 0.92);
  --aa-pill-round: 20px;
  --aa-pill-fillet: 10px;
  position: relative;
  width: min(380px, calc(100vw - 32px));
  filter: drop-shadow(0 14px 32px rgba(0, 0, 0, 0.2));
}

.aa-pill-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 5px 14px 5px 5px;
  background: var(--aa-pill-fill);
  border: 1px solid var(--aa-pill-border);
  border-radius: 999px;
  color: var(--aa-pill-accent);
  font-size: 14px;
  font-weight: 600;
  position: relative;
  z-index: 3;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.aa-pill-panel {
  background: var(--aa-pill-fill);
  border: 1px solid var(--aa-pill-border);
  border-radius: var(--aa-pill-round);
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transform: scale(0.98);
  transition:
    max-height 0.48s cubic-bezier(0.34, 1.35, 0.64, 1),
    opacity 0.32s ease,
    transform 0.42s cubic-bezier(0.34, 1.35, 0.64, 1),
    margin 0.38s ease;
  z-index: 1;
}

.aa-pill-panel-inner {
  padding: 0 16px;
}

.aa-pill-fillet {
  display: none;
  position: absolute;
  width: var(--aa-pill-fillet);
  height: var(--aa-pill-fillet);
  pointer-events: none;
  z-index: 2;
}

/* Colapsado: solo la píldora del tab */
.aa-toast--pill:not(.aa-pill-expanded):not(:hover) .aa-pill-panel,
.aa-toast--pill:not(.aa-pill-has-body) .aa-pill-panel {
  display: none;
  margin: 0 !important;
}

.aa-toast--pill:not(.aa-pill-expanded):not(:hover) .aa-pill-tab,
.aa-toast--pill:not(.aa-pill-has-body) .aa-pill-tab {
  position: static;
  transform: none !important;
}

/* Expandido */
.aa-toast--pill.aa-pill-has-body:hover .aa-pill-panel,
.aa-toast--pill.aa-pill-has-body.aa-pill-expanded .aa-pill-panel,
.aa-toast--pill.aa-pill-has-body:focus-within .aa-pill-panel {
  max-height: 220px;
  opacity: 1;
  transform: scale(1);
}

.aa-toast--pill.aa-pill-has-body:hover .aa-pill-panel-inner,
.aa-toast--pill.aa-pill-has-body.aa-pill-expanded .aa-pill-panel-inner,
.aa-toast--pill.aa-pill-has-body:focus-within .aa-pill-panel-inner {
  padding: 14px 16px 16px;
}

.aa-toast--pill.aa-pill-has-body:hover .aa-pill-fillet,
.aa-toast--pill.aa-pill-has-body.aa-pill-expanded .aa-pill-fillet,
.aa-toast--pill.aa-pill-has-body:focus-within .aa-pill-fillet {
  display: block;
}

/* ── Anclas superiores: tab arriba del panel ── */
.aa-pill-morph[data-anchor^="top"] .aa-pill-tab {
  position: absolute;
  transform: translateY(-50%);
}

.aa-pill-morph[data-anchor="top-left"] .aa-pill-tab { top: 0; left: 14px; }
.aa-pill-morph[data-anchor="top-center"] .aa-pill-tab { top: 0; left: 50%; transform: translate(-50%, -50%); }
.aa-pill-morph[data-anchor="top-right"] .aa-pill-tab { top: 0; right: 14px; }

.aa-pill-morph[data-anchor^="top"] .aa-pill-panel {
  margin-top: 20px;
}

.aa-pill-morph[data-anchor^="top"] .aa-pill-fillet-l {
  bottom: 0;
  left: calc(-1 * var(--aa-pill-fillet));
  border-bottom-right-radius: var(--aa-pill-fillet);
  box-shadow: calc(var(--aa-pill-fillet) / 2) 0 0 0 var(--aa-pill-fill);
}

.aa-pill-morph[data-anchor^="top"] .aa-pill-fillet-r {
  bottom: 0;
  right: calc(-1 * var(--aa-pill-fillet));
  border-bottom-left-radius: var(--aa-pill-fillet);
  box-shadow: calc(var(--aa-pill-fillet) / -2) 0 0 0 var(--aa-pill-fill);
}

/* ── Anclas inferiores: tab abajo del panel ── */
.aa-pill-morph[data-anchor^="bottom"] .aa-pill-tab {
  position: absolute;
  transform: translateY(50%);
}

.aa-pill-morph[data-anchor="bottom-left"] .aa-pill-tab { bottom: 0; left: 14px; }
.aa-pill-morph[data-anchor="bottom-center"] .aa-pill-tab { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
.aa-pill-morph[data-anchor="bottom-right"] .aa-pill-tab { bottom: 0; right: 14px; }

.aa-pill-morph[data-anchor^="bottom"] .aa-pill-panel {
  margin-bottom: 20px;
}

.aa-pill-morph[data-anchor^="bottom"] .aa-pill-fillet-l {
  top: 0;
  left: calc(-1 * var(--aa-pill-fillet));
  border-top-right-radius: var(--aa-pill-fillet);
  box-shadow: calc(var(--aa-pill-fillet) / 2) 0 0 0 var(--aa-pill-fill);
}

.aa-pill-morph[data-anchor^="bottom"] .aa-pill-fillet-r {
  top: 0;
  right: calc(-1 * var(--aa-pill-fillet));
  border-top-left-radius: var(--aa-pill-fillet);
  box-shadow: calc(var(--aa-pill-fillet) / -2) 0 0 0 var(--aa-pill-fill);
}

.aa-form-surface .aa-pill-fillet { display: none !important; }

.aa-toast--pill.aa-pill-enter {
  animation: aa-pill-in 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) forwards;
}
.aa-toast--pill.aa-pill-exit {
  animation: aa-pill-out 0.32s ease forwards;
}

@keyframes aa-pill-in {
  0% { opacity: 0; transform: scale(0.78) translateY(-10px); }
  70% { transform: scale(1.02) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes aa-pill-out {
  to { opacity: 0; transform: scale(0.92) translateY(-8px); }
}

/* ── Banner ribbon (centrado, tab integrado arriba) ── */
.aa-banner--ribbon {
  width: 100% !important;
  max-width: none !important;
  display: flex !important;
  justify-content: center;
  pointer-events: none;
}

.aa-banner--ribbon .aa-form-surface {
  pointer-events: auto;
  width: min(480px, calc(100% - 32px));
  margin: 14px auto;
  border-radius: var(--aa-pill-round);
  padding: 10px 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.aa-banner--ribbon .aa-form-tab.aa-pill-tab {
  position: static;
  transform: none !important;
  box-shadow: none;
  border: none;
  background: transparent;
  padding: 0;
}

.aa-banner--ribbon .aa-form-body {
  max-height: none;
  opacity: 1;
  width: 100%;
  padding-top: 6px;
  border-top: 1px solid color-mix(in srgb, var(--aa-border) 65%, transparent);
  margin-top: 8px;
}

.aa-banner--ribbon.aa-enter-top,
.aa-banner--ribbon.aa-enter-bottom {
  animation: aa-pill-in 0.5s cubic-bezier(0.34, 1.35, 0.64, 1) forwards;
}

/* ── Modal sheet ── */
.aa-modal-overlay.aa-modal-overlay--sheet {
  align-items: flex-start;
  padding-top: 28px;
  background: rgba(0, 0, 0, 0.48);
}

.aa-modal--sheet {
  max-width: min(440px, calc(100vw - 32px)) !important;
  width: 100%;
}

.aa-modal--sheet .aa-form-surface {
  border-radius: var(--aa-pill-round);
  padding: 10px 14px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.aa-modal--sheet .aa-form-tab {
  margin-bottom: 2px;
}

.aa-modal--sheet .aa-form-body {
  max-height: none;
  opacity: 1;
  width: 100%;
  text-align: center;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--aa-border) 65%, transparent);
}

.aa-modal--sheet.aa-sheet-loading .aa-form-body {
  display: none;
}

.aa-modal--sheet.aa-sheet-loading .aa-form-tab-title {
  color: var(--aa-pill-title);
}

.aa-modal-overlay--sheet .aa-modal--sheet {
  animation: aa-pill-in 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) forwards;
}

.aa-modal-overlay--sheet.aa-closing .aa-modal--sheet {
  animation: aa-pill-out 0.28s ease forwards;
}

.aa-sheet-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
  flex-wrap: wrap;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .aa-toast--pill.aa-pill-enter,
  .aa-toast--pill.aa-pill-exit,
  .aa-banner--ribbon.aa-enter-top,
  .aa-modal-overlay--sheet .aa-modal--sheet { animation: none !important; }
  .aa-form-body { transition: none !important; }
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
