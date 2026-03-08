const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireProfesor } = require('../middleware/auth');

const router = express.Router();

const getStoragePath = () => process.env.STORAGE_PATH || path.join(__dirname, '..', 'uploads');
const getPublicUrl = () => process.env.SERVER_PUBLIC_URL || 'http://localhost:3001';

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.body.bucket || 'materials';
    const uploadPath = req.body.path || '';
    const dir = path.join(getStoragePath(), bucket, path.dirname(uploadPath));

    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uploadPath = req.body.path || '';
    cb(null, path.basename(uploadPath) || `${uuidv4()}_${file.originalname}`);
  },
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
    const filePath = req.body.path || req.file.filename;
    const url = `${getPublicUrl()}/files/${bucket}/${filePath}`;

    res.json({ url, path: filePath });
  } catch (err) {
    console.error('Upload error:', err);
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

    // For local storage, files are served directly — no signing needed
    // Just validate the file exists and return the URL
    // In production, you could implement time-limited tokens here
    const signedUrl = url.toString();

    // If the URL points to the old Supabase storage, rewrite to local
    if (signedUrl.includes('supabase.co/storage')) {
      const marker = '/materials/';
      const idx = signedUrl.indexOf(marker);
      if (idx !== -1) {
        const filePath = signedUrl.substring(idx + marker.length);
        return res.json({ signedUrl: `${getPublicUrl()}/files/materials/${filePath}` });
      }
    }

    res.json({ signedUrl });
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

    const fullPath = path.join(getStoragePath(), bucket, filePath);

    // Security: prevent path traversal
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(path.resolve(getStoragePath()))) {
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
