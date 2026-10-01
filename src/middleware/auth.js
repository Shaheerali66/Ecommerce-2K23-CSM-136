const jwt = require('jsonwebtoken');

// Rejects unauthenticated requests (CAT06).
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing or malformed Authorization header.' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' } });
  }
}

// Rejects unauthorized requests (CAT06) — must run after requireAuth.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' } });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
