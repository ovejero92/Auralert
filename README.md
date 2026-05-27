# Auralert

Librería JavaScript vanilla (sin frameworks) como alternativa ligera a SweetAlert2. Un solo archivo JS con estilos incluidos — funciona en Django, React, HTML estático o cualquier stack.

## Instalación

```html
<script src="https://TU_USUARIO.github.io/auralert/dist/auralert.min.js"></script>
```

Reemplazá `TU_USUARIO` por tu usuario de GitHub una vez publicado en GitHub Pages.

## Uso rápido

```javascript
// Toast
Auralert.toast({ message: 'Turno confirmado', type: 'success' });

// Modal (Promise)
const ok = await Auralert.modal({
  title: '¿Cancelar turno?',
  message: 'Esta acción no se puede deshacer',
  type: 'warning',
  confirmText: 'Sí, cancelar',
  cancelText: 'Volver',
  showCancel: true
});

// Banner
Auralert.banner({
  message: 'Nueva versión disponible',
  type: 'info',
  position: 'top',
  closeable: true
});

// Notificación in-app
Auralert.notify({
  title: 'Nuevo turno',
  message: 'Juan Pérez reservó para las 15:00',
  type: 'success',
  duration: 5000
});

// Tema
Auralert.setTheme('dark'); // 'light' | 'dark' | 'auto'
```

## API

### `Auralert.toast(options)`

| Opción     | Tipo     | Default      | Descripción                                      |
|-----------|----------|--------------|--------------------------------------------------|
| `message` | string   | `''`         | Texto del toast                                  |
| `type`    | string   | `'info'`     | `success`, `error`, `warning`, `info`            |
| `duration`| number   | `3000`       | ms hasta auto-cerrar (`0` = no auto-cierra)      |
| `position`| string   | `'top-right'`| `top-right`, `top-left`, `bottom-right`, `bottom-left` |

Retorna `{ dismiss(), element }`.

### `Auralert.modal(options)`

| Opción        | Tipo     | Default    | Descripción                    |
|--------------|----------|------------|--------------------------------|
| `title`      | string   | `''`       | Título                         |
| `message`    | string   | `''`       | Cuerpo                         |
| `type`       | string   | `'info'`   | Tipo visual                    |
| `confirmText`| string   | `'Aceptar'`| Botón principal                |
| `cancelText` | string   | `'Cancelar'` | Botón secundario             |
| `showCancel` | boolean  | auto       | `true` si hay `cancelText`/`onCancel` |
| `onConfirm`  | function | —          | Callback al confirmar          |
| `onCancel`   | function | —          | Callback al cancelar           |

Retorna `Promise<boolean>` — `true` si confirmó, `false` si canceló o cerró con Escape/overlay.

### `Auralert.banner(options)`

| Opción      | Tipo    | Default | Descripción              |
|------------|---------|---------|--------------------------|
| `message`  | string  | `''`    | Texto                    |
| `type`     | string  | `'info'`| Tipo visual              |
| `position` | string  | `'top'` | `top` o `bottom`         |
| `duration` | number  | `0`     | Auto-cierre en ms        |
| `closeable`| boolean | `true`  | Botón cerrar             |

### `Auralert.notify(options)`

| Opción     | Tipo   | Default | Descripción        |
|-----------|--------|---------|--------------------|
| `title`   | string | `''`    | Título             |
| `message` | string | `''`    | Descripción        |
| `type`    | string | `'info'`| Tipo visual        |
| `duration`| number | `5000`  | Auto-cierre en ms  |

### `Auralert.setTheme(theme)`

`'light'`, `'dark'` o `'auto'` (respeta `prefers-color-scheme`).

## Django

```html
<!-- base.html -->
<script src="https://TU_USUARIO.github.io/auralert/dist/auralert.min.js"></script>
```

```django
{% if messages %}
<script>
document.addEventListener('DOMContentLoaded', function () {
  {% for message in messages %}
  Auralert.toast({
    message: "{{ message|escapejs }}",
    type: "{% if 'error' in message.tags %}error{% elif 'success' in message.tags %}success{% elif 'warning' in message.tags %}warning{% else %}info{% endif %}"
  });
  {% endfor %}
});
</script>
{% endif %}
```

## Desarrollo

```bash
node build.js
```

Genera `dist/auralert.js` y `dist/auralert.min.js`.

Abrí `demo/index.html` en el navegador para probar todos los componentes.

## Licencia

MIT
