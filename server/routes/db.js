const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireProfesor } = require('../middleware/auth');

const router = express.Router();

// Allowed tables for CRUD operations
const ALLOWED_TABLES = ['materials', 'profiles', 'user_roles', 'tvc_submissions', 'lesson_views', 'invitation_codes'];

const validateTable = (req, res, next) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: `Table '${table}' is not allowed` });
  }
  next();
};

// ─── GET /api/db/:table — SELECT ───────────────────────────
router.get('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const { select = '*', order, ascending, limit, offset, ...filters } = req.query;

    // Build WHERE clause from query filters
    const conditions = [];
    const values = [];
    let idx = 1;

    // Apply role-based filtering
    if (req.user.role === 'elev') {
      if (['tvc_submissions', 'lesson_views'].includes(table)) {
        conditions.push(`user_id = $${idx++}`);
        values.push(req.user.id);
      } else if (table === 'profiles') {
        conditions.push(`user_id = $${idx++}`);
        values.push(req.user.id);
      } else if (table === 'user_roles') {
        conditions.push(`user_id = $${idx++}`);
        values.push(req.user.id);
      } else if (table === 'materials') {
        // Students can only see published materials
        conditions.push(`(publish_at IS NULL OR publish_at <= NOW())`);
      } else {
        return res.status(403).json({ error: 'Acces interzis' });
      }
    }

    // Process additional filters (eq filters from query params)
    for (const [key, value] of Object.entries(filters)) {
      if (key.startsWith('eq.')) {
        const col = key.replace('eq.', '');
        conditions.push(`${col} = $${idx++}`);
        values.push(value);
      } else if (key.startsWith('in.')) {
        const col = key.replace('in.', '');
        const items = (value as string).split(',');
        const placeholders = items.map((_, i) => `$${idx + i}`);
        conditions.push(`${col} IN (${placeholders.join(',')})`);
        values.push(...items);
        idx += items.length;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = order ? `ORDER BY ${order} ${ascending === 'true' ? 'ASC' : 'DESC'}` : '';
    const limitClause = limit ? `LIMIT ${parseInt(limit as string)}` : 'LIMIT 1000';
    const offsetClause = offset ? `OFFSET ${parseInt(offset as string)}` : '';

    // For students requesting materials, strip answer_key
    let selectCols = select;
    if (table === 'materials' && req.user.role === 'elev') {
      selectCols = 'id, title, description, file_name, file_type, file_url, file_size, subject, category, lesson_number, author, genre, year, oficiu, timer_minutes, created_at, updated_at, publish_at, subject_config';
    }

    const query = `SELECT ${selectCols} FROM ${table} ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;
    const { rows } = await pool.query(query, values);

    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('DB select error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/db/:table — INSERT ─────────────────────────
router.post('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const records = Array.isArray(req.body) ? req.body : [req.body];

    // Permission checks
    if (['materials'].includes(table) && req.user.role === 'elev') {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    if (['tvc_submissions', 'lesson_views'].includes(table)) {
      // Students can only insert their own records
      for (const record of records) {
        if (record.user_id && record.user_id !== req.user.id && req.user.role === 'elev') {
          return res.status(403).json({ error: 'Nu poți insera date pentru alt utilizator' });
        }
        record.user_id = record.user_id || req.user.id;
      }
    }

    const results = [];
    for (const record of records) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = columns.map((_, i) => `$${i + 1}`);

      const { rows } = await pool.query(
        `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        values
      );
      results.push(rows[0]);
    }

    res.json({ data: results.length === 1 ? results[0] : results });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── PUT /api/db/:table — UPDATE ──────────────────────────
router.put('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const { _filters, ...updateData } = req.body;

    if (!_filters || Object.keys(_filters).length === 0) {
      return res.status(400).json({ error: 'Filters required for update' });
    }

    // Permission checks
    if (req.user.role === 'elev') {
      if (['materials', 'user_roles', 'invitation_codes'].includes(table)) {
        return res.status(403).json({ error: 'Acces interzis' });
      }
      // Students can only update their own records
      if (['profiles', 'lesson_views'].includes(table)) {
        _filters.user_id = req.user.id;
      }
    }

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }

    const conditions = [];
    for (const [key, value] of Object.entries(_filters)) {
      conditions.push(`${key} = $${idx++}`);
      values.push(value);
    }

    const { rows } = await pool.query(
      `UPDATE ${table} SET ${setClauses.join(',')} WHERE ${conditions.join(' AND ')} RETURNING *`,
      values
    );

    res.json({ data: rows });
  } catch (err) {
    console.error('DB update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/db/:table — DELETE ───────────────────────
router.delete('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const filters = req.body;

    // Only professors and admins can delete materials
    if (['materials', 'invitation_codes'].includes(table) && req.user.role === 'elev') {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    if (!filters || Object.keys(filters).length === 0) {
      return res.status(400).json({ error: 'Filters required for delete' });
    }

    const conditions = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`${key} = $${idx++}`);
      values.push(value);
    }

    const { rowCount } = await pool.query(
      `DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`,
      values
    );

    res.json({ success: true, deleted: rowCount });
  } catch (err) {
    console.error('DB delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
