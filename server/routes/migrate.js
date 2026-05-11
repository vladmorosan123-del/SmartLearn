// ============================================================
// Migration UI — runs SQL files against the local Postgres
// ============================================================
// Protected by MIGRATE_TOKEN env var (set in server/.env).
// Endpoints:
//   GET  /api/migrate/status      → check DB connectivity & row counts
//   POST /api/migrate/upload      → upload schema_vanilla.sql / data_public.sql
//   POST /api/migrate/run         → runs schema → users → data, streams progress (SSE)
// ============================================================

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const pool = require('../db/pool');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'migrate-files');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, file.fieldname + '.sql'),
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// ─── Token gate ────────────────────────────────────────────
function requireMigrateToken(req, res, next) {
  const token = req.query.token || req.headers['x-migrate-token'] || req.body?.token;
  if (!process.env.MIGRATE_TOKEN) {
    return res.status(503).json({ error: 'MIGRATE_TOKEN not configured in server/.env' });
  }
  if (token !== process.env.MIGRATE_TOKEN) {
    return res.status(401).json({ error: 'Invalid migrate token' });
  }
  next();
}

// ─── Status ────────────────────────────────────────────────
router.get('/status', requireMigrateToken, async (req, res) => {
  try {
    const tables = ['users', 'profiles', 'user_roles', 'chapters', 'materials',
                    'tvc_submissions', 'lesson_views', 'invitation_codes', 'activity_logs'];
    const counts = {};
    for (const t of tables) {
      try {
        const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
        counts[t] = r.rows[0].c;
      } catch {
        counts[t] = null; // table missing
      }
    }
    const files = {
      schema: fs.existsSync(path.join(UPLOAD_DIR, 'schema.sql')),
      data: fs.existsSync(path.join(UPLOAD_DIR, 'data.sql')),
      users: fs.existsSync(path.join(UPLOAD_DIR, 'users.sql')),
    };
    res.json({ ok: true, counts, files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Upload SQL files ─────────────────────────────────────
router.post(
  '/upload',
  requireMigrateToken,
  upload.fields([
    { name: 'schema', maxCount: 1 },
    { name: 'data', maxCount: 1 },
    { name: 'users', maxCount: 1 },
  ]),
  (req, res) => {
    const uploaded = Object.keys(req.files || {});
    res.json({ ok: true, uploaded });
  }
);

// ─── Run migration (SSE) ──────────────────────────────────
router.get('/run', requireMigrateToken, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (type, msg) => {
    res.write(`data: ${JSON.stringify({ type, msg, t: Date.now() })}\n\n`);
  };

  const steps = (req.query.steps || 'schema,users,data').split(',');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'smartlearning',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    send('info', 'Connecting to local Postgres...');
    await client.connect();
    send('ok', 'Connected.');

    for (const step of steps) {
      const file = path.join(UPLOAD_DIR, `${step}.sql`);
      if (!fs.existsSync(file)) {
        send('warn', `Skipping ${step}: file not uploaded`);
        continue;
      }
      const sql = fs.readFileSync(file, 'utf8');
      send('info', `▶ Running ${step}.sql (${(sql.length / 1024).toFixed(1)} KB)...`);

      if (step === 'data') {
        // Wrap with replica mode to bypass FK ordering issues
        try {
          await client.query("SET session_replication_role = 'replica'");
          await client.query(sql);
          await client.query("SET session_replication_role = 'origin'");
          send('ok', `✓ ${step}.sql applied.`);
        } catch (e) {
          send('error', `${step}.sql failed: ${e.message}`);
        }
      } else {
        try {
          await client.query(sql);
          send('ok', `✓ ${step}.sql applied.`);
        } catch (e) {
          send('error', `${step}.sql failed: ${e.message}`);
        }
      }
    }

    // Final counts
    send('info', 'Computing final row counts...');
    const tables = ['users', 'profiles', 'user_roles', 'chapters', 'materials',
                    'tvc_submissions', 'lesson_views', 'invitation_codes'];
    for (const t of tables) {
      try {
        const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
        send('count', `${t}: ${r.rows[0].c}`);
      } catch (e) {
        send('warn', `${t}: ${e.message}`);
      }
    }

    send('done', 'Migration complete.');
  } catch (e) {
    send('error', `Fatal: ${e.message}`);
  } finally {
    try { await client.end(); } catch {}
    res.end();
  }
});

module.exports = router;
