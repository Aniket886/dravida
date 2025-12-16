const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-dravida-secret';

// Verify JWT token middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Optional authentication - doesn't fail if no token
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
}

// Admin only middleware
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.userId);

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

// Instructor or Admin middleware
function requireInstructor(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.userId);

    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
        return res.status(403).json({ error: 'Instructor access required' });
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requireInstructor,
    JWT_SECRET
};
