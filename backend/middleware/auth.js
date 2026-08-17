/**
 * Simple Authentication Middleware for Admin routes
 * Supports Bearer token and Basic auth checking against ADMIN_SECRET
 */
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const secret = process.env.ADMIN_SECRET || 'admin_secret_key';

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized: Missing Authorization header'
    });
  }

  // 1. Bearer Token Auth (Authorization: Bearer <token>)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === secret) {
      return next();
    }
  }

  // 2. Basic Auth (Authorization: Basic <base64(user:password)> or Basic <base64(secret)>)
  if (authHeader.startsWith('Basic ')) {
    const encoded = authHeader.substring(6).trim();
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      // If user:pass, split by colon
      const parts = decoded.split(':');
      const pass = parts.length > 1 ? parts[1] : parts[0];
      if (pass === secret || decoded === secret) {
        return next();
      }
    } catch (err) {
      // Fallthrough to 401
    }
  }

  return res.status(401).json({
    error: 'Unauthorized: Invalid credentials'
  });
};
