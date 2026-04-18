require('dotenv').config();
const express = require('express');
const cors = require('cors');

const suppliersRouter  = require('./routes/suppliers');
const completionsRouter = require('./routes/completions');
const uploadsRouter    = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/suppliers',   suppliersRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/uploads',     uploadsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ESG Backend running on http://localhost:${PORT}`);
});
