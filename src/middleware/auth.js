const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id,name,username,role FROM users WHERE id=?', [decoded.id]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner access required' });
  next();
};

const ownerOrCo = (req, res, next) => {
  if (!['owner','co-owner'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { auth, ownerOnly, ownerOrCo };
