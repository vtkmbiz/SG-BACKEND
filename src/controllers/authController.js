const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.login = async (req, res) => {
  try {

    console.log('Login attempt1:', req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const QUERY_TIMEOUT_MS = parseInt(process.env.DB_QUERY_TIMEOUT_MS) || 5000;

    // Run DB query but fail fast if it takes too long (helps serverless avoid long timeouts)
    const queryPromise = pool.query('SELECT * FROM users WHERE username=?', [username]);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB query timeout')), QUERY_TIMEOUT_MS));
    const [rows] = await Promise.race([queryPromise, timeoutPromise]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials1' });
    const user = rows[0];

    // bcrypt.compare is CPU-bound in JS; log timing to detect slowdowns
    const bcryptStart = Date.now();
    const valid = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare duration:', Date.now() - bcryptStart, 'ms');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials2' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.me = (req, res) => res.json(req.user);
