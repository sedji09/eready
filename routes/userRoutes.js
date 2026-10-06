const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { query } = require('../config/database');
const authModule = require('../middleware/auth');
isAuthenticated = typeof authModule === 'function'
  ? authModule
  : (authModule && (authModule.auth || authModule.isAuthenticated)) || ((req, res, next) => next());
const multer = require('multer');
const bcrypt = require('bcryptjs');

const os = require('os');

// Ensure avatar upload directory exists
const avatarsDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads/avatars') : path.join(__dirname, '../uploads/avatars');
try {
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
} catch (e) {
  // Ignored in read-only environment
}

// Multer setup for avatar images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = 'avatar-' + req.session.user.id + '-' + Date.now() + ext;
    cb(null, name);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error('Only image files are allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// GET current user profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const rows = await query('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const avatarUrl = user.avatar ? `/uploads/avatars/${path.basename(user.avatar)}` : null;
    res.json({ success: true, data: { id: user.id, username: user.username, email: user.email, avatar: avatarUrl } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// UPDATE username/email
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ success: false, message: 'Username and email are required' });

    // Ensure uniqueness on email/username excluding self
    const exists = await query('SELECT id FROM users WHERE (email = ? OR username = ?) AND id <> ?', [email, username, userId]);
    if (exists.length) return res.status(400).json({ success: false, message: 'Email or username already taken' });

    await query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);

    // Update session
    req.session.user.username = username;
    req.session.user.email = email;

    res.json({ success: true, message: 'Profile updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// UPLOAD avatar
router.put('/me/password', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    const rows = await query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/me/avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const userId = req.session.user.id;

    // Get previous avatar path to optionally delete
    const rows = await query('SELECT avatar FROM users WHERE id = ?', [userId]);
    const prev = rows[0] && rows[0].avatar ? rows[0].avatar : null;

    await query('UPDATE users SET avatar = ? WHERE id = ?', [req.file.path, userId]);

    // Cleanup old avatar if it exists and is inside avatarsDir
    if (prev && prev.includes('uploads')) {
      try { fs.unlinkSync(path.resolve(prev)); } catch (e) { /* ignore */ }
    }

    const avatarUrl = `/uploads/avatars/${path.basename(req.file.path)}`;
    res.json({ success: true, message: 'Avatar uploaded', avatar: avatarUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;