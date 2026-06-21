# Changelog

## 1.4.0 — 2026-05-29

### Gratis (bundle público)

- **Formas alternativas** en toast, banner y modal vía `shape`:
  - `shape: 'pill'` — toast con píldora unificada; expande al hover si hay `description`
  - `shape: 'ribbon'` — banner centrado con tab integrado y botón de acción
  - `shape: 'sheet'` — modal superior con carga/promise
- Seis posiciones para toast pill: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`
- Superficie única (`.aa-form-surface`) — ya no se ven dos cajas pegadas
- Soporte `promise` en toast pill y modal sheet

### Pro (no incluido en el repo público)

- Skins Pro aplicados a las formas alternativas (`form-skins.css`)
- **Configurador** en `pro/demo.html` con código listo para copiar según tus elecciones
- Eliminado el módulo/nombre externo; API unificada en `Auralert.toast/banner/modal({ shape: ... })`

---

## 1.3.0

- Aura Pro, skins mármol/oro/glass/neon, animaciones spring/glow/warp/electric/float

## 1.2.0

- Versión estable anterior en CDN jsDelivr
