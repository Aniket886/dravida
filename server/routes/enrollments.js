const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments - Get user's enrolled courses
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const enrollments = db.prepare(`
            SELECT e.*, c.title, c.slug, c.thumbnail, c.duration, c.level, c.category,
                   u.name as instructor_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        `).all(req.user.userId);

        // Get lesson counts and completion for each enrollment
        const enrollmentsWithProgress = enrollments.map(enrollment => {
            const totalLessons = db.prepare(`
                SELECT COUNT(*) as count FROM lessons l
                JOIN modules m ON l.module_id = m.id
                WHERE m.course_id = ?
            `).get(enrollment.course_id);

            const completedLessons = db.prepare(`
                SELECT COUNT(*) as count FROM lesson_progress lp
                JOIN lessons l ON lp.lesson_id = l.id
                JOIN modules m ON l.module_id = m.id
                WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1
            `).get(enrollment.course_id, req.user.userId);

            return {
                ...enrollment,
                totalLessons: totalLessons?.count || 0,
                completedLessons: completedLessons?.count || 0
            };
        });

        res.json(enrollmentsWithProgress);
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
});

// GET /api/enrollments/:courseId - Get specific enrollment with full course content
router.get('/:courseId', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.params;
        const db = getDatabase();

        const enrollment = db.prepare(`
            SELECT e.*, c.title, c.description, c.thumbnail, c.duration
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ? AND (e.course_id = ? OR c.slug = ?)
        `).get(req.user.userId, courseId, courseId);

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        // Get modules with lessons and progress
        const modules = db.prepare(`
            SELECT * FROM modules WHERE course_id = ? ORDER BY order_num
        `).all(enrollment.course_id);

        const modulesWithLessons = modules.map(module => {
            const lessons = db.prepare(`
                SELECT l.*, 
                       COALESCE(lp.completed, 0) as completed,
                       COALESCE(lp.time_spent, 0) as time_spent,
                       COALESCE(lp.last_position, 0) as last_position
                FROM lessons l
                LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
                WHERE l.module_id = ?
                ORDER BY l.order_num
            `).all(req.user.userId, module.id);

            return {
                ...module,
                lessons
            };
        });

        res.json({
            ...enrollment,
            modules: modulesWithLessons
        });
    } catch (error) {
        console.error('Get enrollment error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollment' });
    }
});

// POST /api/enrollments - Create enrollment (after payment or free course)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.body;
        const db = getDatabase();

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if already enrolled
        const existing = db.prepare(`
            SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        // For paid courses, require payment (handled by payments route)
        // For free courses, allow direct enrollment
        if (course.price > 0) {
            return res.status(402).json({ error: 'Payment required for this course' });
        }

        const enrollmentId = uuidv4();
        db.prepare(`
            INSERT INTO enrollments (id, user_id, course_id, progress, status)
            VALUES (?, ?, ?, 0, 'active')
        `).run(enrollmentId, req.user.userId, courseId);

        // Update course enrollment count
        db.prepare(`
            UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?
        `).run(courseId);

        const enrollment = db.prepare(`
            SELECT e.*, c.title, c.slug, c.thumbnail
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.id = ?
        `).get(enrollmentId);

        res.status(201).json(enrollment);
    } catch (error) {
        console.error('Create enrollment error:', error);
        res.status(500).json({ error: 'Failed to create enrollment' });
    }
});

// PUT /api/enrollments/:id/progress - Simple progress update (by enrollment ID)
router.put('/:id/progress', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const db = getDatabase();

        // Verify ownership
        const enrollment = db.prepare(`
            SELECT * FROM enrollments WHERE id = ? AND user_id = ?
        `).get(id, req.user.userId);

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const newProgress = Math.min(Math.max(progress || 0, 0), 100);
        const isCompleted = newProgress >= 100;

        db.prepare(`
            UPDATE enrollments 
            SET progress = ?, 
                status = ?,
                completed_at = CASE WHEN ? >= 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = ?
        `).run(newProgress, isCompleted ? 'completed' : 'active', newProgress, id);

        res.json({
            message: 'Progress updated',
            progress: newProgress,
            completed: isCompleted
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// PUT /api/enrollments/:courseId/progress - Update lesson progress
router.put('/:courseId/progress', authenticateToken, (req, res) => {
    try {
        const { courseId } = req.params;
        const { lessonId, completed, timeSpent, lastPosition } = req.body;
        const db = getDatabase();

        // Verify enrollment
        const enrollment = db.prepare(`
            SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (!enrollment) {
            return res.status(403).json({ error: 'Not enrolled in this course' });
        }

        // Update or create lesson progress
        const existing = db.prepare(`
            SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
        `).get(req.user.userId, lessonId);

        if (existing) {
            db.prepare(`
                UPDATE lesson_progress 
                SET completed = ?, time_spent = time_spent + ?, last_position = ?,
                    completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
                WHERE user_id = ? AND lesson_id = ?
            `).run(completed ? 1 : 0, timeSpent || 0, lastPosition || 0, completed ? 1 : 0, req.user.userId, lessonId);
        } else {
            db.prepare(`
                INSERT INTO lesson_progress (id, user_id, lesson_id, completed, time_spent, last_position, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuidv4(), req.user.userId, lessonId, completed ? 1 : 0, timeSpent || 0, lastPosition || 0, completed ? new Date().toISOString() : null);
        }

        // Calculate and update overall course progress
        const totalLessons = db.prepare(`
            SELECT COUNT(*) as count FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE m.course_id = ?
        `).get(courseId);

        const completedLessons = db.prepare(`
            SELECT COUNT(*) as count FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            JOIN modules m ON l.module_id = m.id
            WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1
        `).get(courseId, req.user.userId);

        const progress = totalLessons.count > 0
            ? (completedLessons.count / totalLessons.count) * 100
            : 0;

        const isCompleted = progress >= 100;

        db.prepare(`
            UPDATE enrollments 
            SET progress = ?, 
                status = ?,
                completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE user_id = ? AND course_id = ?
        `).run(progress, isCompleted ? 'completed' : 'active', isCompleted ? 1 : 0, req.user.userId, courseId);

        // Generate certificate if completed
        if (isCompleted) {
            const existingCert = db.prepare(`
                SELECT id FROM certificates WHERE user_id = ? AND course_id = ?
            `).get(req.user.userId, courseId);

            if (!existingCert) {
                const certNumber = `CD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                db.prepare(`
                    INSERT INTO certificates (id, user_id, course_id, certificate_number)
                    VALUES (?, ?, ?, ?)
                `).run(uuidv4(), req.user.userId, courseId, certNumber);
            }
        }

        res.json({
            progress,
            completed: isCompleted,
            totalLessons: totalLessons.count,
            completedLessons: completedLessons.count
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// GET /api/enrollments/:courseId/lesson/:lessonId - Get lesson content
router.get('/:courseId/lesson/:lessonId', authenticateToken, (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const db = getDatabase();

        // Verify enrollment
        const enrollment = db.prepare(`
            SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
        `).get(req.user.userId, courseId);

        if (!enrollment) {
            return res.status(403).json({ error: 'Not enrolled in this course' });
        }

        const lesson = db.prepare(`
            SELECT l.*, m.title as module_title,
                   COALESCE(lp.completed, 0) as completed,
                   COALESCE(lp.time_spent, 0) as time_spent,
                   COALESCE(lp.last_position, 0) as last_position
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
            WHERE l.id = ? AND m.course_id = ?
        `).get(req.user.userId, lessonId, courseId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Get previous and next lessons
        const allLessons = db.prepare(`
            SELECT l.id, l.title, l.order_num, m.order_num as module_order
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE m.course_id = ?
            ORDER BY m.order_num, l.order_num
        `).all(courseId);

        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

        res.json({
            ...lesson,
            prevLesson,
            nextLesson
        });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});

module.exports = router;
