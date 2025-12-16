const express = require('express');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/certificates - Get user's certificates
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const certificates = db.prepare(`
            SELECT cert.*, c.title as course_title, c.slug as course_slug, 
                   c.thumbnail, u.name as instructor_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE cert.user_id = ?
            ORDER BY cert.issued_at DESC
        `).all(req.user.userId);

        res.json(certificates);
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

// GET /api/certificates/:id - Get certificate details for download/display
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const certificate = db.prepare(`
            SELECT cert.*, c.title as course_title, c.description as course_description,
                   c.duration, u.name as instructor_name, student.name as student_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            JOIN users student ON cert.user_id = student.id
            WHERE cert.id = ? OR cert.certificate_number = ?
        `).get(id, id);

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        // Only allow owner or public verification
        if (certificate.user_id !== req.user.userId) {
            // Return limited info for verification
            return res.json({
                certificate_number: certificate.certificate_number,
                course_title: certificate.course_title,
                student_name: certificate.student_name,
                issued_at: certificate.issued_at,
                valid: true
            });
        }

        res.json(certificate);
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({ error: 'Failed to fetch certificate' });
    }
});

// GET /api/certificates/verify/:number - Public verification endpoint
router.get('/verify/:number', (req, res) => {
    try {
        const { number } = req.params;
        const db = getDatabase();

        const certificate = db.prepare(`
            SELECT cert.certificate_number, cert.issued_at,
                   c.title as course_title, u.name as student_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            WHERE cert.certificate_number = ?
        `).get(number);

        if (!certificate) {
            return res.status(404).json({ valid: false, error: 'Certificate not found' });
        }

        res.json({
            valid: true,
            ...certificate
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
});

module.exports = router;
