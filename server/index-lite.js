const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const enrollmentsRoutes = require('./routes/enrollments');
const paymentsRoutes = require('./routes/payments');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const certificatesRoutes = require('./routes/certificates');
const adminRoutes = require('./routes/admin');

// Database initialization
const { initializeDatabase } = require('./database/init');
const { closeDb } = require('./database/db');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        const app = express();

        // Middleware
        app.use(cors({
            origin: process.env.FRONTEND_URL || '*',
            credentials: true
        }));

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Serve uploaded files
        app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/courses', coursesRoutes);
        app.use('/api/enrollments', enrollmentsRoutes);
        app.use('/api/payments', paymentsRoutes);
        app.use('/api/cart', cartRoutes);
        app.use('/api/wishlist', wishlistRoutes);
        app.use('/api/certificates', certificatesRoutes);
        app.use('/api/admin', adminRoutes);

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Root endpoint
        app.get('/', (req, res) => {
            res.json({
                message: 'Cyber Dravida LMS API Server',
                version: '1.0.0',
                endpoints: {
                    health: '/api/health',
                    auth: '/api/auth',
                    courses: '/api/courses',
                    enrollments: '/api/enrollments',
                    payments: '/api/payments',
                    cart: '/api/cart',
                    wishlist: '/api/wishlist',
                    certificates: '/api/certificates',
                    admin: '/api/admin'
                }
            });
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        console.log('\n🌐 Starting Cyber Dravida LMS API Server (Lite)...\n');

        // Initialize database
        await initializeDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n✅ API Server running on port ${PORT}`);
            console.log(`📚 API available at /api`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    closeDb();
    process.exit(0);
});

process.on('SIGTERM', () => {
    closeDb();
    process.exit(0);
});

startServer();
