const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth, requireAdmin, requireProfesor } = require('../middleware/auth');

const router = express.Router();

const SUBJECT_WEIGHTS = {
  matematica: 0.5,
  informatica: 0.3,
  fizica: 0.2,
};

// ─── POST /api/functions/admin-management ──────────────────
router.post('/admin-management', async (req, res) => {
  try {
    const { action } = req.body;

    // === Actions that don't require auth ===

    if (action === 'verify-code') {
      const { code } = req.body;
      const { rows } = await pool.query(
        'SELECT is_used, expires_at FROM invitation_codes WHERE UPPER(code) = UPPER($1)',
        [code]
      );

      if (rows.length === 0 || rows[0].is_used) {
        return res.json({ valid: false, error: 'Cod invalid sau deja folosit' });
      }
      if (new Date(rows[0].expires_at) < new Date()) {
        return res.json({ valid: false, error: 'Codul a expirat' });
      }
      return res.json({ valid: true });
    }

    if (action === 'register-professor') {
      const { code, username, password, fullName } = req.body;

      // Verify code
      const { rows: codeRows } = await pool.query(
        'SELECT * FROM invitation_codes WHERE UPPER(code) = UPPER($1) AND is_used = false',
        [code]
      );
      if (codeRows.length === 0) {
        return res.status(400).json({ error: 'Cod invalid sau deja folosit' });
      }
      if (new Date(codeRows[0].expires_at) < new Date()) {
        return res.status(400).json({ error: 'Codul a expirat' });
      }

      // Check username
      const { rows: existingProfile } = await pool.query(
        'SELECT id FROM profiles WHERE username = $1',
        [username]
      );
      if (existingProfile.length > 0) {
        return res.status(400).json({ error: 'Numele de utilizator este deja folosit' });
      }

      const email = `${username}@lm.local`;
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { rows: newUsers } = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash]
      );
      const userId = newUsers[0].id;

      // Create profile
      await pool.query(
        'INSERT INTO profiles (user_id, username, full_name) VALUES ($1, $2, $3)',
        [userId, username, fullName || username]
      );

      // Assign role
      await pool.query(
        "INSERT INTO user_roles (user_id, role) VALUES ($1, 'profesor')",
        [userId]
      );

      // Mark code as used
      await pool.query(
        'UPDATE invitation_codes SET is_used = true, used_at = NOW(), used_by_user_id = $1 WHERE id = $2',
        [userId, codeRows[0].id]
      );

      return res.json({ success: true, message: 'Cont de profesor creat cu succes' });
    }

    // === All other actions require admin auth ===
    // Extract token manually for this route
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin
    const { rows: adminCheck } = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin') AS is_admin",
      [decoded.id]
    );
    if (!adminCheck[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (action) {
      case 'generate-code': {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
          'INSERT INTO invitation_codes (code, expires_at, created_by_user_id) VALUES ($1, $2, $3)',
          [code, expiresAt.toISOString(), decoded.id]
        );

        return res.json({ code, expiresAt: expiresAt.toISOString() });
      }

      case 'get-all-users': {
        const { rows: profiles } = await pool.query(
          'SELECT * FROM profiles ORDER BY created_at DESC'
        );
        const { rows: roles } = await pool.query('SELECT * FROM user_roles');

        const users = profiles.map(profile => ({
          ...profile,
          role: roles.find(r => r.user_id === profile.user_id)?.role || 'student',
        }));

        return res.json({ users });
      }

      case 'update-password': {
        const { targetUserId, newPassword } = req.body;
        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, targetUserId]);
        return res.json({ success: true });
      }

      case 'update-username': {
        const { targetUserId, newUsername } = req.body;

        const { rows: existing } = await pool.query(
          'SELECT id FROM profiles WHERE username = $1 AND user_id != $2',
          [newUsername, targetUserId]
        );
        if (existing.length > 0) {
          return res.status(400).json({ error: 'Numele de utilizator este deja folosit' });
        }

        await pool.query('UPDATE profiles SET username = $1 WHERE user_id = $2', [newUsername, targetUserId]);
        const newEmail = `${newUsername}@lm.local`;
        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, targetUserId]);

        return res.json({ success: true });
      }

      case 'update-profile': {
        const { targetUserId, fullName, studyYear, studyClass } = req.body;
        const updates = [];
        const values = [];
        let idx = 1;

        if (fullName !== undefined) { updates.push(`full_name = $${idx++}`); values.push(fullName); }
        if (studyYear !== undefined) { updates.push(`study_year = $${idx++}`); values.push(studyYear); }
        if (studyClass !== undefined) { updates.push(`study_class = $${idx++}`); values.push(studyClass); }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'Niciun câmp de actualizat' });
        }

        values.push(targetUserId);
        await pool.query(
          `UPDATE profiles SET ${updates.join(',')} WHERE user_id = $${idx}`,
          values
        );

        return res.json({ success: true });
      }

      case 'delete-user': {
        const { targetUserId } = req.body;
        if (targetUserId === decoded.id) {
          return res.status(400).json({ error: 'Nu poți șterge propriul cont' });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [targetUserId]);
        return res.json({ success: true });
      }

      case 'block-user': {
        const { targetUserId, block } = req.body;
        if (targetUserId === decoded.id) {
          return res.status(400).json({ error: 'Nu poți bloca propriul cont' });
        }
        await pool.query('UPDATE profiles SET is_blocked = $1 WHERE user_id = $2', [block, targetUserId]);
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('Admin management error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/functions/create-user ──────────────────────
router.post('/create-user', requireAuth, requireProfesor, async (req, res) => {
  try {
    const { username, password, fullName, role, studyYear, studyClass } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (role !== 'student') {
      return res.status(403).json({ error: 'Doar conturile de elev pot fi create prin acest endpoint' });
    }

    if (studyYear && ![11, 12].includes(studyYear)) {
      return res.status(400).json({ error: 'Anul trebuie să fie 11 sau 12' });
    }

    const email = `${username}@lm.local`;
    const passwordHash = await bcrypt.hash(password, 10);

    // Check existing
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Utilizatorul există deja' });
    }

    const { rows: newUsers } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );
    const userId = newUsers[0].id;

    await pool.query(
      'INSERT INTO profiles (user_id, username, full_name, study_year, study_class) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, fullName || username, studyYear || null, studyClass?.toUpperCase() || null]
    );

    await pool.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'student')",
      [userId]
    );

    res.json({
      success: true,
      user: { id: userId, email, username },
      message: `User ${username} created successfully`,
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/functions/update-password ──────────────────
router.post('/update-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT user_id FROM profiles WHERE username = $1',
      [username]
    );
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, profiles[0].user_id]);

    res.json({ success: true, message: `Password updated for ${username}` });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/functions/verify-quiz-answers ──────────────
router.post('/verify-quiz-answers', requireAuth, async (req, res) => {
  try {
    const { materialId, answers, timeSpentSeconds, isMultiSubject, multiSubjectAnswers } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Date invalide' });
    }

    // Get material
    const { rows: materials } = await pool.query(
      'SELECT answer_key, title, oficiu, subject_config, item_points FROM materials WHERE id = $1',
      [materialId]
    );
    if (materials.length === 0) {
      return res.status(404).json({ error: 'Materialul nu a fost găsit' });
    }
    const material = materials[0];

    // === MULTI-SUBJECT MODE ===
    if (isMultiSubject && multiSubjectAnswers && material.subject_config) {
      const subjectConfig = material.subject_config;
      const subjectResults = [];
      let totalScore = 0;
      let totalQuestions = 0;

      for (const [subject, config] of Object.entries(subjectConfig)) {
        const userAnswersForSubject = multiSubjectAnswers[subject] || [];
        const answerKey = config.answerKey || [];

        const results = answerKey.map((correct, index) => ({
          questionIndex: index,
          userAnswer: userAnswersForSubject[index] || '',
          correctAnswer: correct,
          isCorrect: (userAnswersForSubject[index] || '') === correct,
        }));

        const score = results.filter(r => r.isCorrect).length;
        const oficiu = config.oficiu || 0;

        subjectResults.push({
          subject,
          score,
          totalQuestions: answerKey.length,
          oficiu,
          baseGrade: score,
          finalGrade: score + oficiu,
          results,
        });

        totalScore += score;
        totalQuestions += answerKey.length;
      }

      let weightedAverage = 0;
      for (const result of subjectResults) {
        const weight = SUBJECT_WEIGHTS[result.subject] || 0;
        weightedAverage += result.finalGrade * weight;
      }

      // Save submission
      await pool.query(
        `INSERT INTO tvc_submissions (user_id, material_id, answers, score, total_questions, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, materialId, JSON.stringify(multiSubjectAnswers), totalScore, totalQuestions, timeSpentSeconds]
      );

      return res.json({
        success: true,
        isMultiSubject: true,
        subjectResults,
        weightedAverage,
        totalScore,
        totalQuestions,
        timeSpentSeconds,
      });
    }

    // === SINGLE-SUBJECT MODE ===
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Date invalide' });
    }

    const answerKey = material.answer_key;
    if (!answerKey || !Array.isArray(answerKey)) {
      return res.status(400).json({ error: 'Acest material nu are cheie de răspunsuri' });
    }

    if (answers.length !== answerKey.length) {
      return res.status(400).json({ error: 'Număr incorect de răspunsuri' });
    }

    const results = answers.map((answer, index) => ({
      questionIndex: index,
      userAnswer: answer,
      correctAnswer: answerKey[index],
      isCorrect: answer === answerKey[index],
    }));

    const totalQuestions = answerKey.length;
    const oficiu = material.oficiu || 0;

    const itemPoints = material.item_points;
    let baseGrade;
    const pointsPerItem = [];

    if (itemPoints && Array.isArray(itemPoints) && itemPoints.length === totalQuestions) {
      baseGrade = 0;
      for (let i = 0; i < totalQuestions; i++) {
        const pts = Number(itemPoints[i]) || 0;
        pointsPerItem.push(pts);
        if (results[i].isCorrect) baseGrade += pts;
      }
      baseGrade = parseFloat(baseGrade.toFixed(2));
    } else {
      for (let i = 0; i < totalQuestions; i++) pointsPerItem.push(1);
      baseGrade = results.filter(r => r.isCorrect).length;
    }

    const correctCount = results.filter(r => r.isCorrect).length;
    const finalGrade = parseFloat((baseGrade + oficiu).toFixed(2));

    await pool.query(
      `INSERT INTO tvc_submissions (user_id, material_id, answers, score, total_questions, time_spent_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, materialId, JSON.stringify(answers), correctCount, totalQuestions, timeSpentSeconds]
    );

    res.json({
      success: true,
      score: correctCount,
      totalQuestions,
      results,
      timeSpentSeconds,
      oficiu,
      pointsPerItem,
      baseGrade,
      finalGrade,
    });
  } catch (err) {
    console.error('Verify quiz error:', err);
    res.status(500).json({ error: 'Eroare internă a serverului' });
  }
});

module.exports = router;
