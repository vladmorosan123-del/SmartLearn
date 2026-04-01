const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { generateToken, requireAuth } = require('../middleware/auth');
 
const router = express.Router();
 
// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // password is already SHA-256 hashed by the client
 
 
    if (!username || !password) {
      return res.status(400).json({ error: 'Utilizatorul și parola sunt obligatorii' });
    }
 
    // Caută userul după username în tabela profiles
    const { rows: users } = await pool.query(
      `SELECT u.* FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE p.username = $1`,
      [username]
    );
 
    if (users.length === 0) {
      return res.status(401).json({ error: 'Nume de utilizator sau parolă incorectă' });
    }
 
    const user = users[0];
 
    // Verifică parola (clientul trimite SHA-256, serverul stochează bcrypt)
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Nume de utilizator sau parolă incorectă' });
    }
 
    // Verifică dacă e blocat
    const { rows: profiles } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );
    if (profiles[0]?.is_blocked) {
      return res.status(403).json({ error: 'Contul tău este blocat' });
    }
 
    // Obține rolul
    const { rows: roles } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    const role = roles[0]?.role || 'student';
 
    const token = generateToken({ id: user.id, username, role });
 
    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: `${username}@lm.local`,
      },
      profile: profiles[0] || null,
      role,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, username: bodyUsername, fullName, role = 'student', studyYear, studyClass } = req.body;
    // Acceptă username direct sau extras din "username@lm.local"
    const username = bodyUsername || (email && email.includes('@') ? email.split('@')[0] : email);
 
    if (!username || !password) {
      return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
    }
 
    // Verifică dacă username-ul există deja
    const { rows: existingProfile } = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );
    if (existingProfile.length > 0) {
      return res.status(400).json({ error: 'Numele de utilizator este deja folosit' });
    }
 
    // Hash parola
    const passwordHash = await bcrypt.hash(password, 10);
 
    // Creează userul cu email intern username@lm.local
    const internalEmail = `${username}@lm.local`;
    const { rows: newUsers } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [internalEmail, passwordHash]
    );
    const userId = newUsers[0].id;
 
    // Creează profilul
    await pool.query(
      `INSERT INTO profiles (user_id, username, full_name, study_year, study_class)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, fullName || username, studyYear || null, studyClass || null]
    );
 
    // Asignează rolul
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [userId, role]
    );
 
    const token = generateToken({ id: userId, username, role });
 
    res.json({
      access_token: token,
      user: { id: userId, email: internalEmail },
      role,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
