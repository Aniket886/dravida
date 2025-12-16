const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist - Get user's wishlist
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const wishlist = db.prepare(`
            SELECT w.*, c.title, c.slug, c.price, c.original_price, c.thumbnail, 
                   c.level, c.duration, c.rating_avg, u.name as instructor_name
            FROM wishlist w
            JOIN courses c ON w.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE w.user_id = ?
            ORDER BY w.added_at DESC
        `).all(req.user.userId);

        res.json(wishlist);
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// POST /api/wishlist - Add to wishlist
router.post('/', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.body;
        const db = getDatabase();

        // Check if course exists
        const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if already in wishlist
        const existing = db.prepare(`
            SELECT id FROM wishlist WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (existing) {
            return res.status(400).json({ error: 'Already in wishlist' });
        }

        db.prepare(`
            INSERT INTO wishlist (id, user_id, course_id)
            VALUES (?, ?, ?)
        `).run(uuidv4(), req.user.userId, courseId);

        res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// DELETE /api/wishlist/:courseId - Remove from wishlist
router.delete('/:courseId', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.params;
        const db = getDatabase();

        db.prepare(`
            DELETE FROM wishlist WHERE user_id = ? AND course_id = ?
        `).run(req.user.userId, courseId);

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

module.exports = router;
