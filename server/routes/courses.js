const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses - List all courses with filters
router.get('/', optionalAuth, (req, res) => {
    try {
        const {
            category,
            level,
            search,
            sort = 'newest',
            featured,
            minPrice,
            maxPrice,
            page = 1,
            limit = 12
        } = req.query;

        const db = getDatabase();
        let query = `
            SELECT c.*, u.name as instructor_name
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.is_published = 1
        `;
        const params = [];

        // Apply filters
        if (category) {
            query += ' AND c.category = ?';
            params.push(category);
        }

        if (level) {
            query += ' AND c.level = ?';
            params.push(level);
        }

        if (search) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (featured === 'true') {
            query += ' AND c.is_featured = 1';
        }

        if (minPrice) {
            query += ' AND c.price >= ?';
            params.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            query += ' AND c.price <= ?';
            params.push(parseFloat(maxPrice));
        }

        // Apply sorting
        switch (sort) {
            case 'price-low':
                query += ' ORDER BY c.price ASC';
                break;
            case 'price-high':
                query += ' ORDER BY c.price DESC';
                break;
            case 'popular':
                query += ' ORDER BY c.enrollment_count DESC';
                break;
            case 'rating':
                query += ' ORDER BY c.rating_avg DESC';
                break;
            case 'oldest':
                query += ' ORDER BY c.created_at ASC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY c.created_at DESC';
        }

        // Get total count for pagination
        const countQuery = query.replace('SELECT c.*, u.name as instructor_name', 'SELECT COUNT(*) as total');
        const totalResult = db.prepare(countQuery.split(' ORDER BY')[0]).get(...params);
        const total = totalResult?.total || 0;

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const courses = db.prepare(query).all(...params);

        // Get module counts for each course
        const coursesWithModules = courses.map(course => {
            const moduleCount = db.prepare(`
                SELECT COUNT(*) as count FROM modules WHERE course_id = ?
            `).get(course.id);

            const lessonCount = db.prepare(`
                SELECT COUNT(*) as count FROM lessons l
                JOIN modules m ON l.module_id = m.id
                WHERE m.course_id = ?
            `).get(course.id);

            return {
                ...course,
                moduleCount: moduleCount?.count || 0,
                lessonCount: lessonCount?.count || 0
            };
        });

        res.json({
            courses: coursesWithModules,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// GET /api/courses/categories - Get all course categories
router.get('/categories', (req, res) => {
    try {
        const db = getDatabase();
        const categories = db.prepare(`
            SELECT DISTINCT category, COUNT(*) as count
            FROM courses 
            WHERE is_published = 1 AND category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        `).all();

        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/courses/featured - Get featured courses
router.get('/featured', (req, res) => {
    try {
        const db = getDatabase();
        const courses = db.prepare(`
            SELECT c.*, u.name as instructor_name
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.is_published = 1 AND c.is_featured = 1
            ORDER BY c.created_at DESC
            LIMIT 4
        `).all();

        res.json(courses);
    } catch (error) {
        console.error('Get featured courses error:', error);
        res.status(500).json({ error: 'Failed to fetch featured courses' });
    }
});

// GET /api/courses/:id - Get course details
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        // Get course with instructor info
        const course = db.prepare(`
            SELECT c.*, u.name as instructor_name, u.avatar as instructor_avatar
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE (c.id = ? OR c.slug = ?) AND c.is_published = 1
        `).get(id, id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get modules with lessons
        const modules = db.prepare(`
            SELECT * FROM modules WHERE course_id = ? ORDER BY order_num
        `).all(course.id);

        const modulesWithLessons = modules.map(module => {
            const lessons = db.prepare(`
                SELECT id, title, duration, is_preview, order_num
                FROM lessons WHERE module_id = ? ORDER BY order_num
            `).all(module.id);

            return {
                ...module,
                lessons
            };
        });

        // Get reviews
        const reviews = db.prepare(`
            SELECT r.*, u.name as user_name, u.avatar as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.course_id = ?
            ORDER BY r.created_at DESC
            LIMIT 5
        `).all(course.id);

        // Check if user is enrolled
        let isEnrolled = false;
        let enrollment = null;
        if (req.user) {
            enrollment = db.prepare(`
                SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
            `).get(req.user.userId, course.id);
            isEnrolled = !!enrollment;
        }

        // Get related courses
        const relatedCourses = db.prepare(`
            SELECT id, title, slug, thumbnail, price, level, rating_avg
            FROM courses
            WHERE category = ? AND id != ? AND is_published = 1
            LIMIT 4
        `).all(course.category, course.id);

        res.json({
            ...course,
            modules: modulesWithLessons,
            reviews,
            isEnrolled,
            enrollment,
            relatedCourses
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// POST /api/courses - Create course (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const {
            title, description, short_description, price, original_price,
            level, duration, category, thumbnail, is_featured
        } = req.body;

        if (!title || price === undefined) {
            return res.status(400).json({ error: 'Title and price are required' });
        }

        const db = getDatabase();
        const courseId = uuidv4();
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        db.prepare(`
            INSERT INTO courses (id, title, slug, description, short_description, price, original_price, level, duration, category, thumbnail, instructor_id, is_featured, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(courseId, title, slug, description, short_description, price, original_price, level || 'beginner', duration || 0, category, thumbnail, req.user.userId, is_featured ? 1 : 0);

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        res.status(201).json(course);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// PUT /api/courses/:id - Update course (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = getDatabase();

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const allowedFields = ['title', 'description', 'short_description', 'price', 'original_price', 'level', 'duration', 'category', 'thumbnail', 'is_featured', 'is_published'];
        const setClauses = [];
        const params = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (setClauses.length > 0) {
            setClauses.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);
            db.prepare(`UPDATE courses SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
        }

        const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
        res.json(updatedCourse);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// DELETE /api/courses/:id - Delete course (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        db.prepare('DELETE FROM courses WHERE id = ?').run(id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// POST /api/courses/:id/modules - Add module to course
router.post('/:id/modules', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const db = getDatabase();

        const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const maxOrder = db.prepare('SELECT MAX(order_num) as max FROM modules WHERE course_id = ?').get(id);
        const moduleId = uuidv4();

        db.prepare(`
            INSERT INTO modules (id, course_id, title, description, order_num)
            VALUES (?, ?, ?, ?, ?)
        `).run(moduleId, id, title, description, (maxOrder?.max || 0) + 1);

        const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId);
        res.status(201).json(module);
    } catch (error) {
        console.error('Add module error:', error);
        res.status(500).json({ error: 'Failed to add module' });
    }
});

// POST /api/courses/:id/reviews - Add review
router.post('/:id/reviews', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const db = getDatabase();

        // Check if enrolled
        const enrollment = db.prepare(`
            SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, id);

        if (!enrollment) {
            return res.status(403).json({ error: 'You must be enrolled to review this course' });
        }

        // Check if already reviewed
        const existingReview = db.prepare(`
            SELECT id FROM reviews WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, id);

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this course' });
        }

        const reviewId = uuidv4();
        db.prepare(`
            INSERT INTO reviews (id, course_id, user_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `).run(reviewId, id, req.user.userId, rating, comment);

        // Update course rating
        const ratings = db.prepare(`
            SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE course_id = ?
        `).get(id);

        db.prepare(`
            UPDATE courses SET rating_avg = ?, rating_count = ? WHERE id = ?
        `).run(ratings.avg, ratings.count, id);

        const review = db.prepare(`
            SELECT r.*, u.name as user_name FROM reviews r
            JOIN users u ON r.user_id = u.id WHERE r.id = ?
        `).get(reviewId);

        res.status(201).json(review);
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

module.exports = router;
