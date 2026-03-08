const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/rpc/get_user_role ───────────────────────────
router.post('/get_user_role', requireAuth, async (req, res) => {
  try {
    const { _user_id } = req.body;
    const userId = _user_id || req.user.id;

    const { rows } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    res.json({ data: rows[0]?.role || null });
  } catch (err) {
    console.error('RPC get_user_role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/has_role ────────────────────────────────
router.post('/has_role', requireAuth, async (req, res) => {
  try {
    const { _user_id, _role } = req.body;

    const { rows } = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2) AS has_role',
      [_user_id, _role]
    );

    res.json({ data: rows[0]?.has_role || false });
  } catch (err) {
    console.error('RPC has_role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/is_admin ───────────────────────────────
router.post('/is_admin', requireAuth, async (req, res) => {
  try {
    const { _user_id } = req.body;

    const { rows } = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin') AS is_admin",
      [_user_id]
    );

    res.json({ data: rows[0]?.is_admin || false });
  } catch (err) {
    console.error('RPC is_admin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/is_user_blocked ────────────────────────
router.post('/is_user_blocked', requireAuth, async (req, res) => {
  try {
    const { _user_id } = req.body;

    const { rows } = await pool.query(
      'SELECT COALESCE(is_blocked, false) AS is_blocked FROM profiles WHERE user_id = $1',
      [_user_id]
    );

    res.json({ data: rows[0]?.is_blocked || false });
  } catch (err) {
    console.error('RPC is_user_blocked error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/verify_invitation_code ─────────────────
router.post('/verify_invitation_code', async (req, res) => {
  try {
    const { _code } = req.body;

    const { rows } = await pool.query(
      'SELECT is_used, expires_at FROM invitation_codes WHERE UPPER(code) = UPPER($1)',
      [_code]
    );

    if (rows.length === 0) {
      return res.json({ data: [{ is_valid: false, error_message: 'Cod invalid sau deja folosit' }] });
    }

    if (rows[0].is_used) {
      return res.json({ data: [{ is_valid: false, error_message: 'Cod invalid sau deja folosit' }] });
    }

    if (new Date(rows[0].expires_at) < new Date()) {
      return res.json({ data: [{ is_valid: false, error_message: 'Codul a expirat' }] });
    }

    res.json({ data: [{ is_valid: true, error_message: null }] });
  } catch (err) {
    console.error('RPC verify_invitation_code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/get_materials_for_students ─────────────
router.post('/get_materials_for_students', requireAuth, async (req, res) => {
  try {
    // Return materials without answer_key, for published materials only
    const { rows } = await pool.query(`
      SELECT 
        id, title, description, file_name, file_type, file_url, file_size,
        subject, category, lesson_number, author, genre, year, oficiu,
        timer_minutes, created_at, updated_at, publish_at,
        CASE 
          WHEN subject_config IS NOT NULL THEN (
            SELECT jsonb_object_agg(
              key,
              (value - 'answerKey') || jsonb_build_object(
                'questionCount', COALESCE((value->>'questionCount')::int, 0),
                'oficiu', COALESCE((value->>'oficiu')::int, 0)
              )
            )
            FROM jsonb_each(subject_config)
          )
          ELSE NULL
        END AS subject_config
      FROM materials
      WHERE publish_at IS NULL OR publish_at <= NOW()
    `);

    res.json({ data: rows });
  } catch (err) {
    console.error('RPC get_materials_for_students error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/get_material_question_count ────────────
router.post('/get_material_question_count', requireAuth, async (req, res) => {
  try {
    const { _material_id } = req.body;

    // Check subject_config first
    const { rows: configRows } = await pool.query(`
      SELECT COALESCE(
        (SELECT SUM((value->>'questionCount')::int) FROM jsonb_each(subject_config)), 0
      )::int AS config_count
      FROM materials
      WHERE id = $1 AND subject_config IS NOT NULL
    `, [_material_id]);

    if (configRows[0]?.config_count > 0) {
      return res.json({ data: configRows[0].config_count });
    }

    // Fall back to answer_key length
    const { rows } = await pool.query(
      'SELECT COALESCE(jsonb_array_length(answer_key), 0) AS count FROM materials WHERE id = $1',
      [_material_id]
    );

    res.json({ data: rows[0]?.count || 0 });
  } catch (err) {
    console.error('RPC get_material_question_count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/rpc/get_material_answer_key ────────────────
router.post('/get_material_answer_key', requireAuth, async (req, res) => {
  try {
    // Only professors and admins
    if (req.user.role !== 'profesor' && req.user.role !== 'admin') {
      return res.json({ data: null });
    }

    const { _material_id } = req.body;
    const { rows } = await pool.query(
      'SELECT answer_key FROM materials WHERE id = $1',
      [_material_id]
    );

    res.json({ data: rows[0]?.answer_key || null });
  } catch (err) {
    console.error('RPC get_material_answer_key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
