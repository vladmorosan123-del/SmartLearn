const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = () => process.env.JWT_SECRET;

/**
 * Middleware: requires a valid JWT in the Authorization header.
 * Attaches req.user = { id, email, role }
 */
const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET());

    // Check if user is blocked
    const { rows } = await pool.query(
      'SELECT is_blocked FROM profiles WHERE user_id = $1',
      [decoded.id]
    );
    if (rows[0]?.is_blocked) {
      return res.status(403).json({ error: 'Contul tău este blocat' });
    }

    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: requires admin role.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Middleware: requires profesor or admin role.
 */
const requireProfesor = (req, res, next) => {
  if (req.user?.role !== 'profesor' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acces interzis' });
  }
  next();
};

/**
 * Generate JWT for a user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = { requireAuth, requireAdmin, requireProfesor, generateToken };
