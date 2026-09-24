const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // password is already SHA-256 hashed by the client

    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    // Find user
    const { rows: users } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Nume de utilizator sau parolă incorectă' });
    }

    const user = users[0];

    // Verify password (client sends SHA-256 hash, server stores bcrypt of that hash)
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Nume de utilizator sau parolă incorectă' });
    }

    // Check if blocked
    const { rows: profiles } = await pool.query(
      'SELECT is_blocked FROM profiles WHERE user_id = $1',
      [user.id]
    );
    if (profiles[0]?.is_blocked) {
      return res.status(403).json({ error: 'Contul tău este blocat' });
    }

    // Get role
    const { rows: roles } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    const role = roles[0]?.role || 'student';

    // Get profile
    const { rows: profileRows } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );

    const token = generateToken({ id: user.id, email: user.email, role });

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profileRows[0] || null,
      role,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  // Public sign-up is disabled: accounts are created by staff (create-user) or with an invitation code.
  return res.status(403).json({ error: 'Inregistrarea publica este dezactivata' });
  try {
    const { email, password, username, fullName, role = 'student', studyYear, studyClass } = req.body;
    // password is already SHA-256 hashed by the client

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
    }

    // Check if email exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email-ul este deja folosit' });
    }

    // Check if username exists
    const { rows: existingProfile } = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );
    if (existingProfile.length > 0) {
      return res.status(400).json({ error: 'Numele de utilizator este deja folosit' });
    }

    // Hash the SHA-256 password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { rows: newUsers } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    const userId = newUsers[0].id;

    // Create profile
    await pool.query(
      `INSERT INTO profiles (user_id, username, full_name, study_year, study_class)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, fullName || username, studyYear || null, studyClass || null]
    );

    // Assign role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [userId, role]
    );

    const token = generateToken({ id: userId, email, role });

    res.json({
      access_token: token,
      user: { id: userId, email },
      role,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  // JWT is stateless — client just discards the token
  res.json({ success: true });
});

// ─── GET /api/auth/me ──────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: profiles } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    const { rows: roles } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    res.json({
      user: { id: req.user.id, email: req.user.email },
      profile: profiles[0] || null,
      role: roles[0]?.role || 'student',
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/auth/password ────────────────────────────────
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    // newPassword is already SHA-256 hashed by the client

    if (!newPassword) {
      return res.status(400).json({ error: 'Noua parolă este obligatorie' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
