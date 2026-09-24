const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Allowed tables for CRUD operations
const ALLOWED_TABLES = ['materials', 'chapters', 'profiles', 'user_roles', 'tvc_submissions', 'lesson_views', 'invitation_codes', 'activity_logs'];

// jsonb columns — node-pg would serialize JS arrays as Postgres array literals, so stringify them
const JSONB_COLUMNS = {
  materials: ['answer_key', 'item_points', 'subject_config'],
  tvc_submissions: ['answers'],
  activity_logs: ['details'],
};

// Columns a student may see in materials (no answer keys / barem)
const STUDENT_MATERIAL_COLUMNS = [
  'id', 'title', 'description', 'file_name', 'file_type', 'file_url', 'file_size', 'subject', 'category',
  'lesson_number', 'author', 'genre', 'year', 'oficiu', 'timer_minutes', 'created_at', 'updated_at',
  'publish_at', 'subject_config', 'chapter_id', 'ai_allowed', 'allow_close', 'study_classes',
];

// Tables that belong to a user (students only ever touch their own rows)
const OWNED_TABLES = ['tvc_submissions', 'lesson_views', 'profiles', 'user_roles', 'activity_logs'];

// Columns a student may never write
const STUDENT_PROTECTED_COLUMNS = ['id', 'user_id', 'is_blocked', 'created_at'];

const isStaff = (user) => user.role === 'profesor' || user.role === 'admin';
const isAdmin = (user) => user.role === 'admin';

// Who may write to which table
const canWrite = (user, table, op) => {
  switch (table) {
    case 'materials':
    case 'chapters':
      return isStaff(user);
    case 'tvc_submissions':
    case 'lesson_views':
      return true; // students restricted to their own rows below
    case 'activity_logs':
      return op === 'insert';
    case 'profiles':
      return op === 'update' || isAdmin(user);
    default: // user_roles, invitation_codes
      return isAdmin(user);
  }
};

// ─── Schema metadata (column + foreign key whitelist) ─────
let schemaCache = null;
let schemaLoadedAt = 0;

const loadSchema = async () => {
  if (schemaCache && Date.now() - schemaLoadedAt < 60_000) return schemaCache;

  const { rows: cols } = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [ALLOWED_TABLES]
  );
  const { rows: fks } = await pool.query(
    `SELECT c.conrelid::regclass::text AS tbl, a.attname AS col,
            c.confrelid::regclass::text AS ref_tbl, af.attname AS ref_col
     FROM pg_constraint c
     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
     JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = c.confkey[1]
     WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace`
  );

  const columns = {};
  for (const { table_name, column_name } of cols) {
    (columns[table_name] ||= new Set()).add(column_name);
  }

  schemaCache = { columns, fks };
  schemaLoadedAt = Date.now();
  return schemaCache;
};

class BadRequest extends Error {}

const assertColumn = (schema, table, column) => {
  if (typeof column !== 'string' || !schema.columns[table]?.has(column)) {
    throw new BadRequest(`Unknown column '${column}' on '${table}'`);
  }
  return `"${column}"`;
};

const toDbValue = (table, column, value) =>
  value !== null && typeof value === 'object' && (JSONB_COLUMNS[table] || []).includes(column)
    ? JSON.stringify(value)
    : value;

// Split "a, b(c, d), e" on top-level commas
const splitTopLevel = (str) => {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
};

// Resolve an embed like "materials:material_id" or "materials" to a FK relation
const resolveEmbed = (schema, table, alias, ref) => {
  const fk =
    schema.fks.find((f) => f.tbl === table && f.col === ref) ||
    schema.fks.find((f) => f.tbl === table && f.ref_tbl === ref);
  if (!fk || !ALLOWED_TABLES.includes(fk.ref_tbl)) {
    throw new BadRequest(`Unknown relation '${alias}'`);
  }
  return fk;
};

// Build a safe SELECT list from a PostgREST-style select string
const buildSelect = (schema, table, select, user) => {
  const restrictMaterials = (tbl) => tbl === 'materials' && !isStaff(user);
  const colsFor = (tbl, requested, prefix) => {
    const out = [];
    for (const col of requested) {
      if (col === '*') {
        if (restrictMaterials(tbl)) {
          out.push(...STUDENT_MATERIAL_COLUMNS.filter((c) => schema.columns[tbl].has(c)).map((c) => `${prefix}"${c}"`));
        } else {
          out.push(`${prefix}*`);
        }
        continue;
      }
      if (restrictMaterials(tbl) && !STUDENT_MATERIAL_COLUMNS.includes(col)) {
        throw new BadRequest(`Column '${col}' is not available`);
      }
      out.push(`${prefix}${assertColumn(schema, tbl, col)}`);
    }
    return out;
  };

  const selectList = [];
  const plain = [];

  for (const token of splitTopLevel(String(select || '*'))) {
    const embed = token.match(/^(?:([a-z_][a-z0-9_]*)\s*:\s*)?([a-z_][a-z0-9_]*)\s*\((.*)\)$/is);
    if (embed) {
      const [, aliasRaw, ref, inner] = embed;
      const alias = aliasRaw || ref;
      if (!/^[a-z_][a-z0-9_]*$/.test(alias)) throw new BadRequest(`Invalid alias '${alias}'`);
      const fk = resolveEmbed(schema, table, alias, ref);
      const innerCols = splitTopLevel(inner);
      if (innerCols.some((c) => c.includes('('))) throw new BadRequest('Nested embeds are not supported');
      const refCols = colsFor(fk.ref_tbl, innerCols, 'e.');
      selectList.push(
        `(SELECT row_to_json(r) FROM (SELECT ${refCols.join(', ')} FROM "${fk.ref_tbl}" e ` +
          `WHERE e."${fk.ref_col}" = t."${fk.col}") r) AS "${alias}"`
      );
    } else {
      plain.push(token);
    }
  }

  selectList.unshift(...colsFor(table, plain.length ? plain : selectList.length ? [] : ['*'], 't.'));
  return selectList.join(', ');
};

const validateTable = (req, res, next) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: `Table '${table}' is not allowed` });
  }
  next();
};

const handleError = (res, label, err) => {
  if (err instanceof BadRequest) {
    return res.status(400).json({ error: err.message });
  }
  console.error(label, err);
  res.status(500).json({ error: 'Internal server error' });
};

// ─── GET /api/db/:table — SELECT ───────────────────────────
router.get('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const { select = '*', order, ascending, limit, offset, ...filters } = req.query;
    const schema = await loadSchema();

    // Build WHERE clause from query filters
    const conditions = [];
    const values = [];
    let idx = 1;

    // Apply role-based filtering
    if (!isStaff(req.user)) {
      if (OWNED_TABLES.includes(table)) {
        conditions.push(`t."user_id" = $${idx++}`);
        values.push(req.user.id);
      } else if (table === 'materials') {
        // Students can only see published materials
        conditions.push(`(t."publish_at" IS NULL OR t."publish_at" <= NOW())`);
      } else if (table !== 'chapters') {
        return res.status(403).json({ error: 'Acces interzis' });
      }
    } else if (table === 'invitation_codes' && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    // Process additional filters (eq / neq / in)
    for (const [key, value] of Object.entries(filters)) {
      const [op, ...rest] = key.split('.');
      const col = rest.join('.');
      if (!['eq', 'neq', 'in'].includes(op)) continue;
      const qcol = `t.${assertColumn(schema, table, col)}`;

      if (op === 'in') {
        const items = String(value).split(',').filter((v) => v !== '');
        if (items.length === 0) {
          conditions.push('FALSE');
          continue;
        }
        const placeholders = items.map((_, i) => `$${idx + i}`);
        conditions.push(`${qcol} IN (${placeholders.join(',')})`);
        values.push(...items);
        idx += items.length;
      } else {
        conditions.push(`${qcol} ${op === 'eq' ? '=' : '<>'} $${idx++}`);
        values.push(value);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = order
      ? `ORDER BY t.${assertColumn(schema, table, order)} ${ascending === 'true' ? 'ASC' : 'DESC'}`
      : '';
    const limitClause = `LIMIT ${Math.min(Math.max(parseInt(limit, 10) || 1000, 1), 1000)}`;
    const offsetClause = offset ? `OFFSET ${Math.max(parseInt(offset, 10) || 0, 0)}` : '';

    const selectCols = buildSelect(schema, table, select, req.user);

    const query = `SELECT ${selectCols} FROM "${table}" t ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;
    const { rows } = await pool.query(query, values);

    res.json({ data: rows, count: rows.length });
  } catch (err) {
    handleError(res, 'DB select error:', err);
  }
});

// ─── POST /api/db/:table — INSERT ─────────────────────────
router.post('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const schema = await loadSchema();

    if (!canWrite(req.user, table, 'insert')) {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    // Students can only insert their own records
    if (!isStaff(req.user) && OWNED_TABLES.includes(table)) {
      for (const record of records) {
        if (record.user_id && record.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Nu poți insera date pentru alt utilizator' });
        }
        record.user_id = req.user.id;
      }
    }

    const results = [];
    for (const record of records) {
      const columns = Object.keys(record);
      if (columns.length === 0) throw new BadRequest('Empty record');
      const quoted = columns.map((col) => assertColumn(schema, table, col));
      const values = columns.map((col) => toDbValue(table, col, record[col]));
      const placeholders = columns.map((_, i) => `$${i + 1}`);

      const { rows } = await pool.query(
        `INSERT INTO "${table}" (${quoted.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        values
      );
      results.push(rows[0]);
    }

    res.json({ data: results.length === 1 ? results[0] : results });
  } catch (err) {
    handleError(res, 'DB insert error:', err);
  }
});

// ─── PUT /api/db/:table — UPDATE ──────────────────────────
router.put('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const { _filters, ...updateData } = req.body;
    const schema = await loadSchema();

    if (!_filters || Object.keys(_filters).length === 0) {
      return res.status(400).json({ error: 'Filters required for update' });
    }

    if (!canWrite(req.user, table, 'update')) {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    // Students can only update their own records, and never protected columns
    if (!isStaff(req.user)) {
      _filters.user_id = req.user.id;
      if (Object.keys(updateData).some((col) => STUDENT_PROTECTED_COLUMNS.includes(col))) {
        return res.status(403).json({ error: 'Acces interzis' });
      }
    }

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`${assertColumn(schema, table, key)} = $${idx++}`);
      values.push(toDbValue(table, key, value));
    }
    if (setClauses.length === 0) throw new BadRequest('Nothing to update');

    const conditions = [];
    for (const [key, value] of Object.entries(_filters)) {
      conditions.push(`${assertColumn(schema, table, key)} = $${idx++}`);
      values.push(value);
    }

    const { rows } = await pool.query(
      `UPDATE "${table}" SET ${setClauses.join(',')} WHERE ${conditions.join(' AND ')} RETURNING *`,
      values
    );

    res.json({ data: rows });
  } catch (err) {
    handleError(res, 'DB update error:', err);
  }
});

// ─── DELETE /api/db/:table — DELETE ───────────────────────
router.delete('/:table', requireAuth, validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const filters = req.body;
    const schema = await loadSchema();

    if (!filters || Object.keys(filters).length === 0) {
      return res.status(400).json({ error: 'Filters required for delete' });
    }

    if (!canWrite(req.user, table, 'delete')) {
      return res.status(403).json({ error: 'Acces interzis' });
    }

    // Students can only delete their own records
    if (!isStaff(req.user)) {
      filters.user_id = req.user.id;
    }

    const conditions = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`${assertColumn(schema, table, key)} = $${idx++}`);
      values.push(value);
    }

    const { rowCount } = await pool.query(
      `DELETE FROM "${table}" WHERE ${conditions.join(' AND ')}`,
      values
    );

    res.json({ success: true, deleted: rowCount });
  } catch (err) {
    handleError(res, 'DB delete error:', err);
  }
});

module.exports = router;
