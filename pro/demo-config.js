(function () {
  'use strict';

  var SHAPES = {
    toast: [
      { id: 'classic', label: 'Clásico', hint: 'Toast estándar con icono y mensaje.' },
      { id: 'pill', label: 'Pill moderno', hint: 'Píldora unificada. Con descripción, expande al pasar el mouse.' }
    ],
    banner: [
      { id: 'classic', label: 'Barra completa', hint: 'Banner de ancho total (el clásico).' },
      { id: 'ribbon', label: 'Ribbon centrado', hint: 'Tarjeta centrada con tab integrado y botón de acción.' }
    ],
    modal: [
      { id: 'classic', label: 'Clásico', hint: 'Modal centrado con botones Aceptar/Cancelar.' },
      { id: 'sheet', label: 'Sheet moderno', hint: 'Sheet superior con forma unificada. Soporta promise/loading.' }
    ],
    notify: [
      { id: 'classic', label: 'Clásico', hint: 'Notify apilable en esquina inferior.' }
    ]
  };

  var POSITIONS = {
    toast_classic: [{ id: 'top-right', label: 'top-right' }],
    toast_pill: [
      { id: 'top-left', label: 'top-left' },
      { id: 'top-center', label: 'top-center' },
      { id: 'top-right', label: 'top-right' },
      { id: 'bottom-left', label: 'bottom-left' },
      { id: 'bottom-center', label: 'bottom-center' },
      { id: 'bottom-right', label: 'bottom-right' }
    ],
    banner: [
      { id: 'top', label: 'Arriba' },
      { id: 'bottom', label: 'Abajo' }
    ]
  };

  var state = {
    component: 'toast',
    shape: 'classic',
    type: 'success',
    position: 'top-right',
    skin: 'gold',
    anim: 'spring'
  };

  var statusEl = document.getElementById('license-status');
  var input = document.getElementById('license-input');

  function setStatus(kind, text) {
    statusEl.className = 'status ' + kind;
    statusEl.textContent = text;
  }

  function requireActive() {
    if (!window.Auralert || !Auralert.isPro || !Auralert.isPro()) {
      setStatus('warn', 'Activá Pro para skins y animaciones premium.');
      return false;
    }
    return true;
  }

  function posKey() {
    if (state.component === 'toast') return state.shape === 'pill' ? 'toast_pill' : 'toast_classic';
    if (state.component === 'banner') return 'banner';
    return null;
  }

  function renderShapeChips() {
    var row = document.getElementById('chips-shape');
    var shapes = SHAPES[state.component] || SHAPES.toast;
    row.innerHTML = '';
    shapes.forEach(function (s, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (i === 0 ? ' active' : '');
      btn.dataset.shape = s.id;
      btn.textContent = s.label;
      btn.onclick = function () {
        setChipActive(row, btn);
        state.shape = s.id;
        updateShapeHint();
        renderPositionChips();
        renderCode();
      };
      row.appendChild(btn);
    });
    state.shape = shapes[0].id;
    updateShapeHint();
  }

  function updateShapeHint() {
    var shapes = SHAPES[state.component] || [];
    var found = shapes.find(function (s) { return s.id === state.shape; });
    document.getElementById('shape-hint').textContent = found ? found.hint : '';
  }

  function renderPositionChips() {
    var row = document.getElementById('chips-position');
    var label = document.getElementById('pos-label');
    var key = posKey();
    row.innerHTML = '';
    if (!key) {
      label.style.display = 'none';
      row.style.display = 'none';
      return;
    }
    label.style.display = '';
    row.style.display = '';
    var positions = POSITIONS[key];
    positions.forEach(function (p, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (i === 0 ? ' active' : '');
      btn.dataset.position = p.id;
      btn.textContent = p.label;
      btn.onclick = function () {
        setChipActive(row, btn);
        state.position = p.id;
        renderCode();
      };
      row.appendChild(btn);
    });
    state.position = positions[0].id;
  }

  function setChipActive(row, activeBtn) {
    row.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
    activeBtn.classList.add('active');
  }

  function indent(obj, spaces) {
    var lines = JSON.stringify(obj, null, 2).split('\n');
    if (lines.length <= 2) return JSON.stringify(obj);
    return lines.map(function (l, i) { return i === 0 ? l : spaces + l; }).join('\n');
  }

  function buildCallOpts() {
    var opts = { type: state.type };
    var isModern = state.shape !== 'classic';

    if (isModern) {
      if (state.component === 'toast') {
        opts.shape = 'pill';
        opts.title = state.type === 'success' ? 'Cambios guardados' : state.type === 'error' ? 'Algo salió mal' : 'Aviso';
        opts.description = 'Detalle adicional. Pasá el mouse para expandir.';
        opts.position = state.position;
        opts.expand = 'hover';
        opts.duration = 8000;
      } else if (state.component === 'banner') {
        opts.shape = 'ribbon';
        opts.title = 'Archivo subido';
        opts.description = '¿Compartirlo con tu equipo?';
        opts.position = state.position;
        opts.button = { title: 'Compartir', onClick: 'function () {}' };
        opts.duration = 0;
      } else if (state.component === 'modal') {
        opts.shape = 'sheet';
        opts.title = 'Reserva confirmada';
        opts.description = 'DEL → SFO · PNR EC2QW4';
        opts.confirmText = 'Ver detalles';
        opts.showCancel = true;
      }
    } else {
      if (state.component === 'toast') {
        opts.message = 'Tu mensaje aquí';
        opts.duration = 4000;
      } else if (state.component === 'banner') {
        opts.message = 'Mensaje del banner';
        opts.position = state.position;
      } else if (state.component === 'modal') {
        opts.title = 'Título del modal';
        opts.message = 'Mensaje del modal';
        opts.showCancel = true;
      } else if (state.component === 'notify') {
        opts.title = 'Título';
        opts.message = 'Mensaje del notify';
      }
    }

    if (state.skin && state.skin !== 'none') opts.skin = state.skin;
    if (state.anim && state.anim !== 'none') opts.animation = state.anim;

    return opts;
  }

  function optsToCode(opts) {
    var lines = ['{'];
    Object.keys(opts).forEach(function (k) {
      var v = opts[k];
      if (k === 'button' && typeof v === 'object') {
        lines.push("  button: { title: '" + v.title + "', onClick: " + v.onClick + ' },');
      } else if (typeof v === 'string') {
        lines.push("  " + k + ": '" + v.replace(/'/g, "\\'") + "',");
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        lines.push('  ' + k + ': ' + v + ',');
      }
    });
    lines.push('}');
    return lines.join('\n');
  }

  function callLabel() {
    var names = { toast: 'Toast', banner: 'Banner', modal: 'Modal', notify: 'Notify' };
    var shapeNames = { classic: 'clásico', pill: 'pill', ribbon: 'ribbon', sheet: 'sheet' };
    return names[state.component] + ' · ' + shapeNames[state.shape];
  }

  function renderCode() {
    var opts = buildCallOpts();
    var method = state.component;
    var callCode = 'Auralert.' + method + '(\n' + optsToCode(opts) + '\n);';

    document.getElementById('code-setup').textContent =
      '<!-- En tu HTML -->\n' +
      '<script src="auralert-license.js"><\/script>\n' +
      '<script src="auralert-pro.min.js"><\/script>\n' +
      '<script>\n' +
      '  Auralert.activate(window.AURALERT_LICENSE).then(function (ok) {\n' +
      '    if (ok) {\n' +
      (state.skin !== 'none' ? "      Auralert.setSkin('" + state.skin + "');\n" : '') +
      (state.anim !== 'none' ? "      Auralert.setAnimation('" + state.anim + "');\n" : '') +
      '    }\n' +
      '  });\n' +
      '<\/script>';

    document.getElementById('code-call').textContent = callCode;
    document.getElementById('code-label').textContent = callLabel();

    var configLines = ['Auralert.configure({'];
    if (state.skin !== 'none') configLines.push("  // Aplicar skin globalmente en cada alerta:");
    configLines.push('  toast: { skin: \'' + state.skin + '\', animation: \'' + state.anim + '\' },');
    configLines.push('  banner: { skin: \'' + state.skin + '\', animation: \'' + state.anim + '\' },');
    configLines.push('  modal: { skin: \'' + state.skin + '\', animation: \'' + state.anim + '\' },');
    configLines.push('  notify: { skin: \'' + state.skin + '\', animation: \'' + state.anim + '\' }');
    configLines.push('});');
    document.getElementById('code-config').textContent = configLines.join('\n');
  }

  function previewOpts() {
    var opts = buildCallOpts();
    if (opts.button && typeof opts.button === 'object') {
      opts.button = { title: opts.button.title, onClick: function () {} };
    }
    return opts;
  }

  function firePreview() {
    var needsPro = state.skin !== 'none' || state.anim !== 'none';
    if (needsPro && !requireActive()) return;

    if (state.skin !== 'none' && Auralert.setSkin) Auralert.setSkin(state.skin);
    if (state.anim !== 'none' && Auralert.setAnimation) Auralert.setAnimation(state.anim);

    var opts = previewOpts();
    var method = state.component;

    if (method === 'modal') {
      Auralert.modal(opts);
    } else {
      Auralert[method](opts);
    }
  }

  /* ── License ── */
  if (!window.Auralert) {
    setStatus('bad', 'No se cargó auralert-pro.js. Ejecutá: node build-pro.js');
  } else {
    var saved = localStorage.getItem('auralert_pro_license');
    if (saved) input.value = saved;
  }

  document.getElementById('btn-activate').onclick = async function () {
    var key = input.value.trim();
    if (!key) return setStatus('warn', 'Pegá tu licencia.');
    setStatus('warn', 'Activando…');
    try {
      var ok = await Auralert.activate(key);
      if (ok) {
        setStatus('ok', 'Pro activo.');
        if (state.skin !== 'none') Auralert.setSkin(state.skin);
        if (state.anim !== 'none') Auralert.setAnimation(state.anim);
      } else {
        setStatus('bad', 'Licencia inválida.');
      }
    } catch (e) {
      setStatus('bad', e.message || String(e));
    }
  };

  document.getElementById('btn-verify').onclick = async function () {
    if (!Auralert.checkLicense) return setStatus('bad', 'Bundle no cargado.');
    var r = await Auralert.checkLicense(input.value.trim());
    setStatus(r.valid ? 'ok' : 'bad', r.valid ? 'Licencia válida.' : 'Inválida: ' + (r.reason || ''));
  };

  document.getElementById('btn-clear').onclick = function () {
    Auralert.deactivate && Auralert.deactivate();
    input.value = '';
    setStatus('warn', 'Licencia borrada.');
  };

  /* ── Chips ── */
  document.getElementById('chips-component').querySelectorAll('.chip').forEach(function (btn) {
    btn.onclick = function () {
      setChipActive(document.getElementById('chips-component'), btn);
      state.component = btn.dataset.component;
      renderShapeChips();
      renderPositionChips();
      renderCode();
    };
  });

  document.getElementById('chips-type').querySelectorAll('.chip').forEach(function (btn) {
    btn.onclick = function () {
      setChipActive(document.getElementById('chips-type'), btn);
      state.type = btn.dataset.type;
      renderCode();
    };
  });

  document.getElementById('chips-skin').querySelectorAll('.chip').forEach(function (btn) {
    btn.onclick = function () {
      setChipActive(document.getElementById('chips-skin'), btn);
      state.skin = btn.dataset.skin;
      renderCode();
    };
  });

  document.getElementById('chips-anim').querySelectorAll('.chip').forEach(function (btn) {
    btn.onclick = function () {
      setChipActive(document.getElementById('chips-anim'), btn);
      state.anim = btn.dataset.anim;
      renderCode();
    };
  });

  document.getElementById('btn-preview').onclick = firePreview;

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.onclick = function () {
      var id = btn.dataset.copy === 'setup' ? 'code-setup'
        : btn.dataset.copy === 'config' ? 'code-config' : 'code-call';
      var text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text).then(function () {
        var msg = document.getElementById('copied-msg');
        msg.classList.add('show');
        setTimeout(function () { msg.classList.remove('show'); }, 1800);
      });
    };
  });

  renderShapeChips();
  renderPositionChips();
  renderCode();
})();
