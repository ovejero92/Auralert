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
