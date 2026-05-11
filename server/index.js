require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const dbRoutes = require('./routes/db');
const rpcRoutes = require('./routes/rpc');
const functionsRoutes = require('./routes/functions');
const storageRoutes = require('./routes/storage');
const migrateRoutes = require('./routes/migrate');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ──────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({ origin: origins, credentials: true }));

// ─── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─── Ensure storage directory ──────────────────────────────
const storagePath = process.env.STORAGE_PATH || path.join(__dirname, 'uploads');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// ─── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/rpc', rpcRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/migrate', migrateRoutes);

// ─── Serve uploaded files statically ───────────────────────
app.use('/files', express.static(storagePath));

// ─── Migration UI ─────────────────────────────────────────
app.use('/migrate', express.static(path.join(__dirname, 'public')));
app.get('/migrate', (req, res) => res.sendFile(path.join(__dirname, 'public', 'migrate.html')));

// ─── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SmartLearning server running on port ${PORT}`);
  console.log(`   Storage path: ${storagePath}`);
  console.log(`   CORS origins: ${origins.join(', ')}`);
});
