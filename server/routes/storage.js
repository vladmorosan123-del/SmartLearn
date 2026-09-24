const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireProfesor } = require('../middleware/auth');

const router = express.Router();

const getStoragePath = () => process.env.STORAGE_PATH || path.join(__dirname, '..', 'uploads');
const getPublicUrl = () => process.env.SERVER_PUBLIC_URL || 'http://localhost:3001';

const BUCKET_RE = /^[a-z0-9_-]+$/i;

// Resolve bucket/filePath inside the storage root, or null if it would escape it
const resolveInStorage = (bucket, filePath) => {
  if (!BUCKET_RE.test(bucket) || !filePath || path.isAbsolute(filePath)) return null;
  const bucketRoot = path.resolve(getStoragePath(), bucket);
  const resolved = path.resolve(bucketRoot, filePath);
  return resolved.startsWith(bucketRoot + path.sep) ? resolved : null;
};

// ─── Signed file links ─────────────────────────────────────
// /files/* is only served with ?token=<exp>.<hmac>, handed out by /signed-url to logged-in users.
const MAX_LINK_SECONDS = 24 * 3600;

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const signPath = (relPath, exp) =>
  crypto.createHmac('sha256', `${process.env.JWT_SECRET}:files`).update(`${relPath}\n${exp}`).digest('base64url');

// Stored file URL -> path under the storage root ("materials/lesson/x.pdf"), or null for external links
const toStoragePath = (fileUrl) => {
  const clean = fileUrl.split(/[?#]/)[0];
  // Old Supabase URLs: files were copied locally under the same path
  const marker = clean.includes('supabase.co/storage') ? '/materials/' : '/files/';
  const idx = clean.indexOf(marker);
  if (idx === -1) return null;
  const rel = marker === '/files/' ? clean.substring(idx + marker.length) : clean.substring(idx + 1);
  return safeDecode(rel);
};

const verifyFileToken = (req, res, next) => {
  const [exp, sig] = String(req.query.token || '').split('.');
  const rel = safeDecode(req.path).replace(/^\/+/, '');
  const expected = exp ? signPath(rel, exp) : '';

  const valid =
    sig &&
    Number(exp) > Date.now() / 1000 &&
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));

  if (!valid) {
    return res.status(403).json({ error: 'Link expirat sau invalid' });
  }
  next();
};

// Multer config — multipart fields after the file (bucket, path) are not parsed yet when
// multer picks a destination, so save to a temp dir and move once the whole body is read.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(getStoragePath(), '.tmp');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, uuidv4()),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// ─── POST /api/storage/upload ──────────────────────────────
router.post('/upload', requireAuth, requireProfesor, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const bucket = req.body.bucket || 'materials';
    const safeName = path.basename(req.file.originalname).replace(/[^\w.\-]+/g, '_');
    const filePath = req.body.path || `${uuidv4()}_${safeName}`;
    const target = resolveInStorage(bucket, filePath);

    if (!target) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid path' });
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(req.file.path, target);

    const url = `${getPublicUrl()}/files/${bucket}/${filePath}`;
    res.json({ url, path: filePath });
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── GET /api/storage/signed-url ───────────────────────────
router.get('/signed-url', requireAuth, (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const rel = toStoragePath(url.toString());
    if (!rel) {
      // External link (e.g. YouTube) — nothing to sign
      return res.json({ signedUrl: url.toString() });
    }

    const seconds = Math.min(Math.max(parseInt(req.query.expires, 10) || 3600, 60), MAX_LINK_SECONDS);
    const exp = Math.floor(Date.now() / 1000) + seconds;
    const encoded = rel.split('/').map(encodeURIComponent).join('/');

    res.json({ signedUrl: `${getPublicUrl()}/files/${encoded}?token=${exp}.${signPath(rel, exp)}` });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/storage/delete ────────────────────────────
router.delete('/delete', requireAuth, requireProfesor, (req, res) => {
  try {
    const { bucket, path: filePath } = req.body;

    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Bucket and path required' });
    }

    // Security: prevent path traversal
    const fullPath = resolveInStorage(bucket, filePath);
    if (!fullPath) {
      return res.status(403).json({ error: 'Invalid path' });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
module.exports.verifyFileToken = verifyFileToken;
