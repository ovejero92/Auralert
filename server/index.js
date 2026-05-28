const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./lib/config');
const api = require('./routes/api');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use('/api', api);

app.get('/', (_req, res) => {
  res.type('text').send('Auralert API — /api/health');
});

if (process.env.SERVE_PRO_STATIC === 'true') {
  app.use('/pro', express.static(path.join(__dirname, '..', 'pro')));
}

app.listen(config.port, () => {
  console.log('Auralert API en http://localhost:' + config.port);
  console.log('  MP:', config.mpToken ? 'ok' : 'falta token');
  console.log('  Pidgeon:', config.pidgeonUrl || 'mock console');
  console.log('  MOCK_CHECKOUT:', config.mockCheckout);
});
