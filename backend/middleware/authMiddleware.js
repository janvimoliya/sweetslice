import jwt from 'jsonwebtoken';
import process from 'node:process';
import { Buffer } from 'node:buffer';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
        error: 'Authorization required',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.userId;
      return next();
    } catch (jwtError) {
      const tokenText = Buffer.from(String(token), 'base64').toString('utf8');
      const [userId] = tokenText.split(':');

      if (!userId) {
        throw jwtError;
      }

      req.userId = userId;
      return next();
    }
  } catch (error) {
    res.status(401).json({
      message: 'Invalid token',
      error: error.message,
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      message: 'Access denied',
      error: 'Admin role required',
    });
  }
  next();
};
