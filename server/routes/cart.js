const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const cartItems = db.prepare(`
            SELECT ci.*, c.title, c.slug, c.price, c.original_price, c.thumbnail, 
                   c.level, c.duration, u.name as instructor_name
            FROM cart_items ci
            JOIN courses c ON ci.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `).all(req.user.userId);

        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        const originalTotal = cartItems.reduce((sum, item) => sum + (item.original_price || item.price), 0);

        res.json({
            items: cartItems,
            total,
            originalTotal,
            savings: originalTotal - total
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart - Add course to cart
router.post('/', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.body;
        const db = getDatabase();

        // Check if course exists
        const course = db.prepare('SELECT id, title, price FROM courses WHERE id = ? AND is_published = 1').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if already in cart
        const existing = db.prepare(`
            SELECT id FROM cart_items WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (existing) {
            return res.status(400).json({ error: 'Course already in cart' });
        }

        // Check if already enrolled
        const enrolled = db.prepare(`
            SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (enrolled) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        // Add to cart
        const cartItemId = uuidv4();
        db.prepare(`
            INSERT INTO cart_items (id, user_id, course_id)
            VALUES (?, ?, ?)
        `).run(cartItemId, req.user.userId, courseId);

        res.status(201).json({
            message: 'Added to cart',
            courseId,
            courseTitle: course.title
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// DELETE /api/cart/:courseId - Remove from cart
router.delete('/:courseId', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.params;
        const db = getDatabase();

        const result = db.prepare(`
            DELETE FROM cart_items WHERE user_id = ? AND course_id = ?
        `).run(req.user.userId, courseId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// DELETE /api/cart - Clear cart
router.delete('/', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.userId);
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

module.exports = router;
