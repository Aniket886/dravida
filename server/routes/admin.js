const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Get admin dashboard stats
router.get('/dashboard', (req, res) => {
    try {
        const db = getDatabase();

        // Total students
        const totalStudents = db.prepare(`
            SELECT COUNT(*) as count FROM users WHERE role = 'student'
        `).get();

        // Total courses
        const totalCourses = db.prepare(`
            SELECT COUNT(*) as count FROM courses
        `).get();

        // Total enrollments
        const totalEnrollments = db.prepare(`
            SELECT COUNT(*) as count FROM enrollments
        `).get();

        // Total revenue
        const totalRevenue = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'
        `).get();

        // Recent enrollments (last 7 days)
        const recentEnrollments = db.prepare(`
            SELECT COUNT(*) as count FROM enrollments 
            WHERE enrolled_at > datetime('now', '-7 days')
        `).get();

        // Revenue this month
        const monthlyRevenue = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total FROM payments 
            WHERE status = 'completed' 
            AND created_at > datetime('now', 'start of month')
        `).get();

        // Top courses by enrollment
        const topCourses = db.prepare(`
            SELECT c.id, c.title, c.enrollment_count, c.rating_avg, c.price
            FROM courses c
            ORDER BY c.enrollment_count DESC
            LIMIT 5
        `).all();

        // Recent activities
        const recentActivities = db.prepare(`
            SELECT 'enrollment' as type, e.enrolled_at as date, 
                   u.name as user_name, c.title as course_title
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            ORDER BY e.enrolled_at DESC
            LIMIT 10
        `).all();

        // Monthly enrollment trend
        const enrollmentTrend = db.prepare(`
            SELECT date(enrolled_at) as date, COUNT(*) as count
            FROM enrollments
            WHERE enrolled_at > datetime('now', '-30 days')
            GROUP BY date(enrolled_at)
            ORDER BY date
        `).all();

        res.json({
            stats: {
                totalStudents: totalStudents.count,
                totalCourses: totalCourses.count,
                totalEnrollments: totalEnrollments.count,
                totalRevenue: totalRevenue.total,
                recentEnrollments: recentEnrollments.count,
                monthlyRevenue: monthlyRevenue.total
            },
            topCourses,
            recentActivities,
            enrollmentTrend
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// GET /api/admin/students - Get all students
router.get('/students', (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const db = getDatabase();

        let query = `
            SELECT u.id, u.email, u.name, u.phone, u.created_at,
                   COUNT(DISTINCT e.id) as enrolled_courses,
                   SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed_courses
            FROM users u
            LEFT JOIN enrollments e ON u.id = e.user_id
            WHERE u.role = 'student'
        `;
        const params = [];

        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY u.id ORDER BY u.created_at DESC';

        // Get total count
        const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT u.id) as total FROM').split('GROUP BY')[0];
        const totalResult = db.prepare(countQuery).get(...params);
        const total = totalResult?.total || 0;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const students = db.prepare(query).all(...params);

        res.json({
            students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// GET /api/admin/students/:id - Get student details
router.get('/students/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const student = db.prepare(`
            SELECT id, email, name, phone, created_at FROM users WHERE id = ? AND role = 'student'
        `).get(id);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const enrollments = db.prepare(`
            SELECT e.*, c.title as course_title, c.thumbnail
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        `).all(id);

        const payments = db.prepare(`
            SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC
        `).all(id);

        res.json({
            ...student,
            enrollments,
            payments
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// GET /api/admin/courses - Get all courses (including unpublished)
router.get('/courses', (req, res) => {
    try {
        const db = getDatabase();
        const courses = db.prepare(`
            SELECT c.*, u.name as instructor_name,
                   (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
                   (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            ORDER BY c.created_at DESC
        `).all();

        res.json(courses);
    } catch (error) {
        console.error('Get admin courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// PUT /api/admin/courses/:id/publish - Toggle course publish status
router.put('/courses/:id/publish', (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;
        const db = getDatabase();

        db.prepare(`
            UPDATE courses SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(published ? 1 : 0, id);

        res.json({ message: published ? 'Course published' : 'Course unpublished' });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// GET /api/admin/payments - Get all payments
router.get('/payments', (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const db = getDatabase();

        let query = `
            SELECT p.*, u.name as user_name, u.email as user_email
            FROM payments p
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC';

        // Get total
        const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM').split('ORDER BY')[0];
        const totalResult = db.prepare(countQuery).get(...params);

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const payments = db.prepare(query).all(...params);

        res.json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult?.total || 0,
                totalPages: Math.ceil((totalResult?.total || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// GET /api/admin/payments/pending - Get payments pending verification
router.get('/payments/pending', (req, res) => {
    try {
        const db = getDatabase();
        const payments = db.prepare(`
            SELECT p.*, u.name as user_name, u.email as user_email,
                   GROUP_CONCAT(c.title, ', ') as course_titles
            FROM payments p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN payment_items pi ON p.id = pi.payment_id
            LEFT JOIN courses c ON pi.course_id = c.id
            WHERE p.status = 'pending_verification'
            GROUP BY p.id
            ORDER BY p.created_at ASC
        `).all();

        res.json({ payments, count: payments.length });
    } catch (error) {
        console.error('Get pending payments error:', error);
        res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
});

// POST /api/admin/payments/:id/verify - Verify a payment and create enrollments
router.post('/payments/:id/verify', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const payment = db.prepare(`
            SELECT * FROM payments WHERE id = ?
        `).get(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'pending_verification') {
            return res.status(400).json({ error: 'Payment is not pending verification' });
        }

        // Update payment status
        db.prepare(`
            UPDATE payments 
            SET status = 'completed', verified_by = ?, verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(req.user.userId, id);

        // Get payment items and create enrollments
        const items = db.prepare(`
            SELECT course_id FROM payment_items WHERE payment_id = ?
        `).all(id);

        for (const item of items) {
            // Check if already enrolled
            const existing = db.prepare(`
                SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
            `).get(payment.user_id, item.course_id);

            if (!existing) {
                const enrollmentId = uuidv4();
                db.prepare(`
                    INSERT INTO enrollments (id, user_id, course_id, progress, status)
                    VALUES (?, ?, ?, 0, 'active')
                `).run(enrollmentId, payment.user_id, item.course_id);

                db.prepare(`
                    UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?
                `).run(item.course_id);
            }
        }

        // Clear user's cart
        db.prepare(`DELETE FROM cart_items WHERE user_id = ?`).run(payment.user_id);

        console.log(`✅ Payment ${id} verified by admin ${req.user.userId}`);

        res.json({
            message: 'Payment verified and enrollments created',
            paymentId: id,
            coursesEnrolled: items.length
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// POST /api/admin/payments/:id/reject - Reject a payment
router.post('/payments/:id/reject', (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const db = getDatabase();

        const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'pending_verification') {
            return res.status(400).json({ error: 'Payment is not pending verification' });
        }

        db.prepare(`
            UPDATE payments 
            SET status = 'rejected', verified_by = ?, verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(req.user.userId, id);

        console.log(`❌ Payment ${id} rejected by admin ${req.user.userId}. Reason: ${reason || 'Not specified'}`);

        res.json({
            message: 'Payment rejected',
            paymentId: id,
            reason: reason || 'Payment verification failed'
        });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({ error: 'Failed to reject payment' });
    }
});

// POST /api/admin/coupons - Create coupon
router.post('/coupons', (req, res) => {
    try {
        const { code, discountPercent, expiryDate, usageLimit } = req.body;
        const db = getDatabase();

        if (!code || !discountPercent) {
            return res.status(400).json({ error: 'Code and discount percentage required' });
        }

        const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code.toUpperCase());
        if (existing) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const couponId = uuidv4();
        db.prepare(`
            INSERT INTO coupons (id, code, discount_percent, expiry_date, usage_limit, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `).run(couponId, code.toUpperCase(), discountPercent, expiryDate || null, usageLimit || null);

        const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId);
        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// GET /api/admin/coupons - Get all coupons
router.get('/coupons', (req, res) => {
    try {
        const db = getDatabase();
        const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
        res.json(coupons);
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/coupons/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        // Check if coupon exists first
        const existing = db.prepare('SELECT id FROM coupons WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
        console.log(`🗑️ Deleted coupon ${id}, changes: ${result.changes}`);

        res.json({ message: 'Coupon deleted', changes: result.changes });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// POST /api/admin/modules/:moduleId/lessons - Add lesson to module
router.post('/modules/:moduleId/lessons', (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, content, videoUrl, duration, resources, isPreview } = req.body;
        const db = getDatabase();

        const module = db.prepare('SELECT id FROM modules WHERE id = ?').get(moduleId);
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const maxOrder = db.prepare('SELECT MAX(order_num) as max FROM lessons WHERE module_id = ?').get(moduleId);
        const lessonId = uuidv4();

        db.prepare(`
            INSERT INTO lessons (id, module_id, title, content, video_url, duration, resources, order_num, is_preview)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(lessonId, moduleId, title, content, videoUrl, duration || 0, resources, (maxOrder?.max || 0) + 1, isPreview ? 1 : 0);

        const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
        res.status(201).json(lesson);
    } catch (error) {
        console.error('Add lesson error:', error);
        res.status(500).json({ error: 'Failed to add lesson' });
    }
});

// PUT /api/admin/lessons/:id - Update lesson
router.put('/lessons/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, videoUrl, duration, resources, isPreview } = req.body;
        const db = getDatabase();

        db.prepare(`
            UPDATE lessons SET title = ?, content = ?, video_url = ?, duration = ?, resources = ?, is_preview = ?
            WHERE id = ?
        `).run(title, content, videoUrl, duration, resources, isPreview ? 1 : 0, id);

        const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
        res.json(lesson);
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// DELETE /api/admin/lessons/:id - Delete lesson
router.delete('/lessons/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        db.prepare('DELETE FROM lessons WHERE id = ?').run(id);
        res.json({ message: 'Lesson deleted' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

module.exports = router;
