/** Genera path SVG unificado para pill morph (tab + panel) */
(function (global) {
  'use strict';

  function roundRectPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return [
      'M', x + r, y,
      'H', x + w - r,
      'A', r, r, 0, 0, 1, x + w, y + r,
      'V', y + h - r,
      'A', r, r, 0, 0, 1, x + w - r, y + h,
      'H', x + r,
      'A', r, r, 0, 0, 1, x, y + h - r,
      'V', y + r,
      'A', r, r, 0, 0, 1, x + r, y,
      'Z'
    ].join(' ');
  }

  function pillPath(x, y, w, h) {
    return roundRectPath(x, y, w, h, h / 2);
  }

  function pathTop(tabX, tabW, tabH, panelW, panelH, pr, fillet) {
    var seam = tabH / 2;
    var tr = tabH / 2;
    var tx = tabX;
    var tw = tabW;
    var f = fillet;
    var d = [];

    d.push('M', pr, seam);
    if (tx > pr + 1) {
      d.push('H', tx - f);
      d.push('Q', tx, seam, tx, seam - f);
    } else {
      d.push('Q', tx, seam, tx, seam - f);
    }
    d.push('V', tr);
    d.push('A', tr, tr, 0, 0, 1, tx + tr, 0);
    d.push('H', tx + tw - tr);
    d.push('A', tr, tr, 0, 0, 1, tx + tw, tr);
    d.push('V', seam - f);
    d.push('Q', tx + tw, seam, tx + tw + f, seam);
    d.push('H', panelW - pr);
    d.push('A', pr, pr, 0, 0, 1, panelW, seam + pr);
    d.push('V', seam + panelH - pr);
    d.push('A', pr, pr, 0, 0, 1, panelW - pr, seam + panelH);
    d.push('H', pr);
    d.push('A', pr, pr, 0, 0, 1, 0, seam + panelH - pr);
    d.push('V', seam + pr);
    d.push('A', pr, pr, 0, 0, 1, pr, seam);
    d.push('Z');
    return d.join(' ');
  }

  function pathBottom(tabX, tabW, tabH, panelW, panelH, pr, fillet) {
    var tr = tabH / 2;
    var tx = tabX;
    var tw = tabW;
    var f = fillet;
    var d = [];

    d.push('M', pr, 0);
    d.push('H', panelW - pr);
    d.push('A', pr, pr, 0, 0, 1, panelW, pr);
    d.push('V', panelH - pr);
    d.push('A', pr, pr, 0, 0, 1, panelW - pr, panelH);
    d.push('H', tx + tw + f);
    d.push('Q', tx + tw, panelH, tx + tw, panelH + f);
    d.push('V', panelH + tr);
    d.push('A', tr, tr, 0, 0, 1, tx + tw - tr, panelH + tabH);
    d.push('H', tx + tr);
    d.push('A', tr, tr, 0, 0, 1, tx, panelH + tr);
    d.push('V', panelH + f);
    d.push('Q', tx, panelH, tx - f, panelH);
    if (tx - f > pr) d.push('H', pr);
    d.push('A', pr, pr, 0, 0, 1, 0, panelH - pr);
    d.push('V', pr);
    d.push('A', pr, pr, 0, 0, 1, pr, 0);
    d.push('Z');
    return d.join(' ');
  }

  function tabXForAnchor(anchor, panelW, tabW) {
    var pad = 14;
    if (anchor.indexOf('left') >= 0) return pad;
    if (anchor.indexOf('right') >= 0) return Math.max(pad, panelW - tabW - pad);
    return Math.max(pad, (panelW - tabW) / 2);
  }

  function isExpanded(morph) {
    var toast = morph.closest('.aa-toast--pill');
    if (!toast || !morph._hasBody) return false;
    return toast.classList.contains('aa-pill-expanded') ||
      toast.matches(':hover') ||
      toast.matches(':focus-within');
  }

  function measureTab(tab) {
    tab.style.position = 'static';
    tab.style.visibility = 'visible';
    tab.style.left = '';
    tab.style.top = '';
    tab.style.transform = 'none';
    return {
      w: Math.max(tab.offsetWidth, 80),
      h: Math.max(tab.offsetHeight, 38)
    };
  }

  function defaultPanelWidth(tabW) {
    return Math.max(300, Math.min(380, tabW + 160));
  }

  function layoutMorphPill(morph) {
    if (!morph || !morph.isConnected) return;

    var anchor = morph.getAttribute('data-anchor') || 'top-right';
    var tab = morph.querySelector('.aa-pill-tab');
    var panel = morph.querySelector('.aa-pill-panel');
    var svg = morph.querySelector('.aa-pill-svg');
    var bg = morph.querySelector('.aa-pill-svg-bg');
    if (!tab || !svg || !bg) return;

    var pr = 20;
    var fillet = 10;
    var expanded = isExpanded(morph);
    var tabSize = measureTab(tab);
    var tabW = tabSize.w;
    var tabH = tabSize.h;
    var panelW = defaultPanelWidth(tabW);
    var panelH = 72;
    var d;
    var totalW;
    var totalH;

    if (expanded && panel) {
      panel.style.visibility = 'visible';
      panel.style.position = 'static';
      panel.style.width = panelW + 'px';
      panel.style.maxHeight = 'none';
      panel.style.opacity = '1';
      panel.style.pointerEvents = 'auto';
      panelH = Math.max(panel.scrollHeight, 56);
    } else if (panel) {
      panel.style.visibility = 'hidden';
      panel.style.position = 'absolute';
      panel.style.left = '-9999px';
      panel.style.width = panelW + 'px';
      panel.style.opacity = '0';
      panel.style.pointerEvents = 'none';
    }

    if (!expanded) {
      d = pillPath(0, 0, tabW, tabH);
      totalW = tabW;
      totalH = tabH;
      tab.style.position = 'absolute';
      tab.style.left = '0';
      tab.style.top = '0';
      tab.style.transform = 'none';
    } else {
      var tx = tabXForAnchor(anchor, panelW, tabW);
      if (anchor.indexOf('top') === 0) {
        d = pathTop(tx, tabW, tabH, panelW, panelH, pr, fillet);
        totalW = panelW;
        totalH = tabH / 2 + panelH;
        tab.style.position = 'absolute';
        tab.style.left = tx + 'px';
        tab.style.top = '0';
        tab.style.transform = 'none';
        panel.style.position = 'absolute';
        panel.style.left = '0';
        panel.style.top = tabH / 2 + 'px';
        panel.style.width = panelW + 'px';
        panel.style.visibility = 'visible';
        panel.style.opacity = '1';
      } else {
        d = pathBottom(tx, tabW, tabH, panelW, panelH, pr, fillet);
        totalW = panelW;
        totalH = panelH + tabH / 2;
        tab.style.position = 'absolute';
        tab.style.left = tx + 'px';
        tab.style.top = panelH + 'px';
        tab.style.transform = 'none';
        panel.style.position = 'absolute';
        panel.style.left = '0';
        panel.style.top = '0';
        panel.style.width = panelW + 'px';
        panel.style.visibility = 'visible';
        panel.style.opacity = '1';
      }
    }

    morph.style.width = totalW + 'px';
    morph.style.height = totalH + 'px';

    svg.setAttribute('width', totalW);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
    bg.setAttribute('d', d);

    try {
      morph.style.setProperty('--aa-pill-clip', 'path("' + d + '")');
    } catch (e) { /* clip-path path() unsupported */ }
  }

  function bindMorphLayout(morph) {
    if (!morph || morph._layoutBound) return;
    morph._layoutBound = true;

    var toast = morph.closest('.aa-toast--pill');

    function relayout() {
      requestAnimationFrame(function () {
        layoutMorphPill(morph);
      });
    }

    relayout();

    morph.addEventListener('mouseenter', relayout);
    morph.addEventListener('mouseleave', relayout);

    if (toast) {
      toast.addEventListener('mouseenter', relayout);
      toast.addEventListener('mouseleave', relayout);
      toast.addEventListener('focusin', relayout);
      toast.addEventListener('focusout', relayout);

      if (typeof MutationObserver !== 'undefined') {
        var mo = new MutationObserver(relayout);
        mo.observe(toast, { attributes: true, attributeFilter: ['class'] });
        morph._classObs = mo;
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(relayout);
      ro.observe(morph);
      var inner = morph.querySelector('.aa-pill-panel-inner');
      if (inner) ro.observe(inner);
      morph._resizeObs = ro;
    }
  }

  global.AA_PillPath = {
    layoutMorphPill: layoutMorphPill,
    bindMorphLayout: bindMorphLayout,
    pillPath: pillPath
  };
})(typeof window !== 'undefined' ? window : global);
