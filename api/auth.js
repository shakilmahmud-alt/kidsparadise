import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kidsparadise_secret_jwt_key_2026';

export function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const path = req.path || (req.url ? req.url.split('?')[0] : '') || '';
  const action = req.query?.action || path.split('/').pop();

  // POST /api/auth/register
  if (req.method === 'POST' && action === 'register') {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [email, passwordHash, fullName || 'Customer', 'customer']
      );

      const user = {
        id: result.insertId,
        email,
        full_name: fullName || 'Customer',
        role: 'customer'
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ user, token });
    } catch (err) {
      console.error('Registration Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/login
  if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const users = await query('SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const userRow = users[0];
      const match = await bcrypt.compare(password, userRow.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = {
        id: userRow.id,
        email: userRow.email,
        full_name: userRow.full_name,
        role: userRow.role
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({ user, token });
    } catch (err) {
      console.error('Login Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/auth/me
  if (req.method === 'GET' && (action === 'me' || action === 'user')) {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized or invalid token' });
    }

    try {
      const users = await query('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json({ user: users[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: 'Auth endpoint not found' });
}
