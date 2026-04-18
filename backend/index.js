require('dotenv').config();
const express = require('express');
const cors = require('cors');

const suppliersRouter  = require('./routes/suppliers');
const completionsRouter = require('./routes/completions');
const uploadsRouter    = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
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
