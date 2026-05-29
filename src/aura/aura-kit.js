/**
 * Aura Kit — gusanos de energía (título + cards/componentes)
 */
const AuraKit = (() => {
  let tpl = null;

  const WORM_HTML =
    '<div class="aura-worm">' +
    '<span class="seg"></span><span class="seg"></span><span class="seg"></span>' +
    '<span class="seg"></span><span class="seg"></span><span class="seg"></span>' +
    '<span class="seg"></span><span class="seg"></span><span class="seg"></span>' +
    '<span class="seg"></span><span class="seg"></span><span class="seg"></span>' +
    '<span class="ember"></span><span class="ember"></span><span class="ember"></span>' +
    '</div>';

  const DEFAULTS = {
    spawnUp: 18,
    wormsPerUnit: 7,
    len: [0.55, 0.85],
    scale: [0.85, 1.15],
    cardSpawnUp: 8,
    cardWormsPer100px: 1.15,
  };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function ensureTpl() {
    if (tpl) return tpl;
    tpl = document.getElementById('worm-tpl');
    if (tpl) return tpl;
    tpl = document.createElement('template');
    tpl.id = 'worm-tpl';
    tpl.innerHTML = WORM_HTML;
    document.body.appendChild(tpl);
    return tpl;
  }

  function addWorm(container, opts, cfg, finite) {
    const worm = ensureTpl().content.firstElementChild.cloneNode(true);
    worm.style.setProperty('--x', opts.x);
    worm.style.setProperty('--y', opts.y);
    worm.style.setProperty('--rot', (opts.rot ?? 0) + 'deg');
    worm.style.setProperty('--len', String(opts.len ?? rand(...cfg.len)));
    worm.style.setProperty('--s', String(opts.s ?? rand(...cfg.scale)));
    worm.style.setProperty('--delay', (opts.delay ?? -rand(0, 4)) + 's');
    if (finite) worm.classList.add('aura-worm--finite');
    container.appendChild(worm);
  }

  function pct(value, total) {
    if (!total || total < 1) return 0;
    return (value / total) * 100;
  }

  function wormOpts(cfg) {
    return {
      len: rand(...cfg.len),
      s: rand(...cfg.scale),
      delay: -rand(0, 4),
    };
  }

  function fillLetters(field, letters, cfg) {
    field.innerHTML = '';
    const f = field.getBoundingClientRect();
    if (f.width < 8) return;

    letters.forEach(function (letter) {
      const r = letter.getBoundingClientRect();
      const x0 = pct(r.left - f.left, f.width);
      const x1 = pct(r.right - f.left, f.width);
      const w = x1 - x0;
      const baseY = pct(f.bottom - r.bottom, f.height);
      const spawnY = baseY + pct(r.height, f.height) * (cfg.spawnUp / 100);
      const n = cfg.wormsPerUnit;

      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        addWorm(
          field,
          {
            x: (x0 + w * (0.06 + t * 0.88)).toFixed(2) + '%',
            y: spawnY.toFixed(2) + '%',
            rot: 0,
            ...wormOpts(cfg),
          },
          cfg,
          false
        );
      }
    });
  }

  function fillRect(field, target, cfg, finite) {
    const f = field.getBoundingClientRect();
    const c = target.getBoundingClientRect();
    if (f.width < 8 || f.height < 8 || c.width < 4 || c.height < 4) return false;

    field.innerHTML = '';

    const left = pct(c.left - f.left, f.width);
    const right = pct(c.right - f.left, f.width);
    const top = pct(c.top - f.top, f.height);
    const bottom = pct(c.bottom - f.top, f.height);
    const w = right - left;
    const h = bottom - top;
    const up = cfg.cardSpawnUp / 100;

    const nBottom = Math.min(6, Math.max(4, Math.round(w * cfg.cardWormsPer100px)));
    const nTop = Math.min(5, Math.max(3, Math.round(w * cfg.cardWormsPer100px * 0.8)));
    const nSide = Math.min(4, Math.max(2, Math.round(h * cfg.cardWormsPer100px * 0.55)));

    const yBottom = pct(f.bottom - c.bottom, f.height) + pct(c.height, f.height) * up;
    const yTop = pct(f.bottom - c.top, f.height) - pct(c.height, f.height) * up;
    const xLeft = pct(c.left - f.left, f.width) + pct(c.width, f.width) * up;
    const xRight = pct(c.right - f.left, f.width) - pct(c.width, f.width) * up;

    function row(n, posFn, rot) {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const p = posFn(t);
        addWorm(field, { ...p, rot, ...wormOpts(cfg) }, cfg, finite);
      }
    }

    row(nBottom, function (t) {
      return { x: (left + w * (0.04 + t * 0.92)).toFixed(2) + '%', y: yBottom.toFixed(2) + '%' };
    }, 0);
    row(nTop, function (t) {
      return { x: (left + w * (0.04 + t * 0.92)).toFixed(2) + '%', y: yTop.toFixed(2) + '%' };
    }, 180);
    row(nSide, function (t) {
      return { x: xLeft.toFixed(2) + '%', y: (top + h * (0.06 + t * 0.88)).toFixed(2) + '%' };
    }, 90);
    row(nSide, function (t) {
      return { x: xRight.toFixed(2) + '%', y: (top + h * (0.06 + t * 0.88)).toFixed(2) + '%' };
    }, -90);

    return true;
  }

  /** Campo de partículas dentro del elemento (no altera layout del padre) */
  function attachInset(target, options) {
    if (!target || target.classList.contains('aa-aura-host')) {
      return { refresh: function () {}, destroy: function () {} };
    }
    ensureTpl();
    const cfg = { ...DEFAULTS, ...options };
    const finite = options.finite === true;

    target.classList.add('aa-aura-host', 'aa-aura-surface');
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }

    const field = document.createElement('div');
    field.className = 'aura-field aura-field--alert';
    field.setAttribute('aria-hidden', 'true');
    target.insertBefore(field, target.firstChild);

    var destroyed = false;
    var retries = 0;
    var ro = null;

    function layout() {
      if (destroyed) return;
      var ok = fillRect(field, target, cfg, finite);
      if (!ok && retries < 16) {
        retries++;
        requestAnimationFrame(layout);
      }
    }

    layout();

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function () {
        retries = 0;
        layout();
      });
      ro.observe(target);
    }

    return {
      refresh: layout,
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (ro) ro.disconnect();
        if (field.parentNode) field.parentNode.removeChild(field);
        target.classList.remove('aa-aura-host', 'aa-aura-surface');
      },
    };
  }

  /** Legacy: envuelve en .aura-wrap (solo landings/cards si hace falta) */
  function attachWrap(target, options) {
    if (!target || target.closest('.aa-aura-component')) {
      return { refresh: function () {}, destroy: function () {} };
    }
    ensureTpl();
    const cfg = { ...DEFAULTS, ...options };
    const finite = options.finite !== false;

    const wrap = document.createElement('div');
    wrap.className = 'aura-wrap aa-aura-component';
    const parent = target.parentNode;
    if (!parent) return { refresh: function () {}, destroy: function () {} };

    parent.insertBefore(wrap, target);
    wrap.appendChild(target);
    target.classList.add('aa-aura-surface');

    const field = document.createElement('div');
    field.className = 'aura-field aura-field--alert';
    wrap.insertBefore(field, target);

    var destroyed = false;
    var retries = 0;
    var ro = null;

    function layout() {
      if (destroyed) return;
      var ok = fillRect(field, target, cfg, finite);
      if (!ok && retries < 12) {
        retries++;
        requestAnimationFrame(layout);
      }
    }

    layout();

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function () {
        retries = 0;
        layout();
      });
      ro.observe(wrap);
      ro.observe(target);
    }

    return {
      refresh: layout,
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (ro) ro.disconnect();
        field.innerHTML = '';
        target.classList.remove('aa-aura-surface');
        if (wrap.parentNode) {
          wrap.parentNode.insertBefore(target, wrap);
          wrap.parentNode.removeChild(wrap);
        }
      },
    };
  }

  /** Alertas Pro: partículas alrededor sin romper flex/width */
  function attach(target, options) {
    options = options || {};
    if (options.wrap) return attachWrap(target, options);
    return attachInset(target, options);
  }

  function init(options) {
    const cfg = { ...DEFAULTS, ...options.config };
    const wrap =
      typeof options.wrap === 'string' ? document.querySelector(options.wrap) : options.wrap;
    if (!wrap) return;

    const field = wrap.querySelector('.aura-field');
    if (!field) return;

    function layout() {
      if (options.letters) {
        const letters = wrap.querySelectorAll(options.letterSelector || '.letter');
        fillLetters(field, letters, cfg);
      } else {
        const target = wrap.querySelector(
          options.target || ':scope > *:not(.aura-field)'
        );
        if (target) fillRect(field, target, cfg, false);
      }
    }

    layout();
    window.addEventListener('resize', layout);
    return { refresh: layout };
  }

  function buildLetters(container, text) {
    if (!container) return;
    container.textContent = '';
    for (const ch of text) {
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = ch === ' ' ? '\u00a0' : ch;
      container.appendChild(letter);
    }
  }

  return {
    init,
    attach,
    fillLetters,
    fillRect,
    buildLetters,
    ensureTpl,
    DEFAULTS,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.AuraKit = AuraKit;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuraKit;
}
