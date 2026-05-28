# Auralert

Librería JavaScript **universal** para alertas — toasts, modales, banners y notificaciones in-app. Un solo `<script>`, sin dependencias: Django, React, Vue, Laravel, WordPress, HTML estático, etc.

## Instalación

```html
<script src="https://ovejero92.github.io/Auralert/dist/auralert.min.js"></script>
```

```javascript
Auralert.toast({ message: '¡Listo!', type: 'success' });
```

**Demo completa:** abrí [`demo/index.html`](demo/index.html) o visitá [ovejero92.github.io/Auralert/demo/](https://ovejero92.github.io/Auralert/demo/)

## Uso rápido

```javascript
// Toast
Auralert.toast({ message: 'Guardado', type: 'success', position: 'bottom-right' });

// Modal → Promise<boolean>
const ok = await Auralert.modal({
  title: '¿Eliminar?',
  message: 'No se puede deshacer.',
  type: 'warning',
  showCancel: true
});

// Personalización total
Auralert.toast({
  html: '<b>Pedido</b> enviado',
  icon: '📦',
  style: { background: '#1e1e2e', color: '#fff' },
  onShow: (el) => { /* tu lógica */ }
});

// Defaults globales del proyecto
Auralert.configure({
  toast: { position: 'top-right', duration: 4000 },
  modal: { confirmText: 'Aceptar', cancelText: 'Cancelar' },
  theme: 'auto'
});
```

## API

| Método | Descripción |
|--------|-------------|
| `Auralert.toast(options)` | Toast esquina |
| `Auralert.modal(options)` | Modal centrado → `Promise` |
| `Auralert.banner(options)` | Barra top/bottom |
| `Auralert.notify(options)` | Card apilable |
| `Auralert.setTheme('light'\|'dark'\|'auto')` | Tema |
| `Auralert.configure({ toast, modal, banner, notify, theme })` | Defaults globales |

### Opciones de personalización (todas las funciones)

| Opción | Descripción |
|--------|-------------|
| `type` | `success`, `error`, `warning`, `info` |
| `message` / `html` | Texto o HTML |
| `icon` | Carácter custom; `false` = sin icono |
| `className`, `customClass`, `*Class` | Clases CSS extra por parte |
| `style`, `overlayStyle`, `confirmStyle`… | Estilos inline |
| `onShow`, `onClose`, `onOpen`, `onConfirm`, `onCancel` | Callbacks |
| `animationDuration` | ms al cerrar |

**Modal adicional:** `buttons[]`, `width`, `maxWidth`, `backdrop`, `closeOnBackdrop`, `closeOnEscape`, `titleHtml`

Ver ejemplos por framework en la [demo](demo/index.html).

## Desarrollo

```bash
node build.js
```

## Licencia

MIT — versión gratuita con API abierta.
