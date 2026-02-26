const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminMiddleware(db) {
  return async (req, res, next) => {
    try {
      const userRow = await db.findUserById(req.userId);
      if (!userRow || (userRow.role || 'user') !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Internal error' });
    }
  };
}

module.exports = { generateToken, authMiddleware, adminMiddleware };
