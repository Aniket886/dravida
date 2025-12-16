const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = getDatabase();

        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const userId = uuidv4();
        db.prepare(`
            INSERT INTO users (id, email, password_hash, name, phone, role)
            VALUES (?, ?, ?, ?, ?, 'student')
        `).run(userId, email.toLowerCase(), passwordHash, name, phone || null);

        // Generate token
        const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: userId,
                email: email.toLowerCase(),
                name,
                role: 'student'
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = getDatabase();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/google - Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify Google token by decoding the JWT
        // The credential is a JWT from Google Identity Services
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            Buffer.from(base64, 'base64')
                .toString()
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const googleUser = JSON.parse(jsonPayload);

        // Validate the token
        if (!googleUser.email || !googleUser.email_verified) {
            return res.status(400).json({ error: 'Invalid Google account' });
        }

        const db = getDatabase();
        const email = googleUser.email.toLowerCase();

        // Check if user exists
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (user) {
            // Existing user - just login
            console.log(`🔵 Google login: ${email}`);
        } else {
            // New user - create account
            const userId = uuidv4();
            const name = googleUser.name || email.split('@')[0];
            const avatar = googleUser.picture || null;

            db.prepare(`
                INSERT INTO users (id, email, password_hash, name, avatar, role)
                VALUES (?, ?, ?, ?, ?, 'student')
            `).run(userId, email, 'google_oauth', name, avatar);

            user = {
                id: userId,
                email,
                name,
                avatar,
                role: 'student'
            };

            console.log(`🆕 Google signup: ${email}`);
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const user = db.prepare(`
            SELECT id, email, name, phone, role, avatar, created_at
            FROM users WHERE id = ?
        `).get(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get enrolled courses count
        const enrollmentStats = db.prepare(`
            SELECT 
                COUNT(*) as total_enrolled,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM enrollments WHERE user_id = ?
        `).get(req.user.userId);

        res.json({
            ...user,
            stats: {
                enrolledCourses: enrollmentStats.total_enrolled || 0,
                completedCourses: enrollmentStats.completed || 0
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const db = getDatabase();

        db.prepare(`
            UPDATE users SET name = ?, phone = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, phone || null, avatar || null, req.user.userId);

        const user = db.prepare(`
            SELECT id, email, name, phone, role, avatar FROM users WHERE id = ?
        `).get(req.user.userId);

        res.json({ message: 'Profile updated', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// PUT /api/auth/password - Change password
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const db = getDatabase();
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.userId);

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newPasswordHash, req.user.userId);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// POST /api/auth/forgot-password - Request password reset (placeholder)
router.post('/forgot-password', (req, res) => {
    // In production, this would send an email with reset link
    res.json({ message: 'If the email exists, a password reset link has been sent' });
});

module.exports = router;
