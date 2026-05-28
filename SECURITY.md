# Seguridad — qué SÍ y qué NO subir a GitHub

## Nunca commitear

| Archivo | Motivo |
|---------|--------|
| `license.secret` | Secret para firmar licencias |
| `dist/auralert-pro.js` / `.min.js` | Producto de pago |
| `PERSONAL_NOTES.md` | Notas internas |
| `.env` | API keys |
| `data/licenses-db.json` | Licencias de clientes |
| `demo/pro-preview.html` | Preview local |

Todo esto está en `.gitignore`.

## Seguro para commitear

- `src/` (código fuente Pro incluido — la protección es la licencia + no publicar el bundle)
- `dist/auralert.js` / `auralert.min.js` (versión gratis)
- `scripts/generate-license.js`, `verify-license.js`, `read-secret.js`
- `license.secret.example` (sin secret real)
- `pro/demo.html`, `pro/index.html` (UI pública)
- `demo/`, `README.md`, `build.js`, `build-pro.js`

## Antes de cada push

```bash
git status
git check-ignore -v license.secret dist/auralert-pro.min.js
```

Si algún archivo sensible aparece como "to be committed", **no hagas push**.

## Compradores

Cada cliente recibe por email (vía Pidgeon u otro):

1. `auralert-pro.min.js` (archivo privado)
2. Licencia `AURAL-...`
3. Plantilla `auralert-license.example.js`
