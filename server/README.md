# Auralert API — venta automática Pro

Backend para **no hacer nada manual** después de cada venta:

1. El comprador verifica su email (código por Pidgeon)
2. Paga con **Mercado Pago** (ideal en Argentina)
3. El webhook genera la licencia, la guarda en `data/store.json` y manda el email
4. El cliente descarga `auralert-pro.min.js` con su licencia y entra al portal Pro

## Requisitos

- Node 18+
- `license.secret` o `AURALERT_LICENSE_SECRET` (mismo que `build-pro.js`)
- `node build.js && node build-pro.js` (el servidor sirve `dist/auralert-pro.min.js`)
- Cuenta [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
- [Pidgeon](https://github.com/ovejero92/pidgeon) desplegado para emails

## Instalación local

```bash
cd server
cp .env.example .env
# Editá .env — para probar sin MP: MOCK_CHECKOUT=true
npm install
npm start
```

Abrí `pro/index.html` con Live Server y configurá `pro/api-config.js`:

```js
window.AURALERT_API = 'http://localhost:3922';
```

Flujo de prueba: email → código (en consola del server si no hay Pidgeon) → checkout mock → email simulado en consola.

## Desplegar (Render / Railway)

1. Nuevo servicio Node, root: `server/`, comando: `npm start`
2. Variables de entorno de `.env.example`
3. `PUBLIC_URL` = URL del servicio (para webhook MP)
4. `SITE_URL` = GitHub Pages (`https://ovejero92.github.io/Auralert`)
5. En Mercado Pago → Webhooks → `https://TU-API/api/webhooks/mercadopago`
6. En `pro/api-config.js` (local, no subir secretos) poné la URL pública en GitHub Pages vía `api-config.example.js` editado al publicar

**Persistencia:** en Render el disco es efímero. Para producción usá un volumen o migrá `data/store.json` a SQLite/Postgres (mismo formato).

## Alternativas a Mercado Pago

| Opción | Argentina | Automatización |
|--------|-----------|----------------|
| **Mercado Pago** | Sí | Webhook nativo |
| **Gumroad** | Sí (PayPal) | Webhook + email del comprador |
| **Lemon Squeezy** | Limitado | Webhook |
| **Transferencia manual** | Sí | `node scripts/fulfill-order.js` |

Gumroad es buen plan B si MP te complica la cuenta vendedor.

## Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/verify/request` | Envía código al email |
| POST | `/api/verify/confirm` | Devuelve `checkoutToken` |
| POST | `/api/checkout` | Crea preferencia MP o mock |
| POST | `/api/webhooks/mercadopago` | Pago aprobado → licencia + email |
| POST | `/api/license/validate` | Portal / anti-fraude |
| GET | `/api/download/auralert-pro.min.js?license=` | Bundle Pro |
