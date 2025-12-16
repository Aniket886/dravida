const express = require('express');
const cors = require('cors');
const path = require('path');
const next = require('next');
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
const { seedDatabase } = require('./database/seed');
const { closeDb } = require('./database/db');

const PORT = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

async function startServer() {
    try {
        // Initialize Next.js first
        await nextApp.prepare();
        console.log('\n🌐 Next.js App Prepared');

        const app = express();

        // Middleware
        app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

        // Next.js Request Handler (User Interface)
        // This handles all non-API routes by passing them to Next.js
        app.all('*', (req, res) => {
            return handle(req, res);
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        console.log('\n🌐 Starting Cyber Dravida LMS Server...\n');

        // Initialize database
        await initializeDatabase();

        // Seed with sample data (optional, maybe check if needed in prod)
        // await seedDatabase();

        // Start server
        app.listen(PORT, (err) => {
            if (err) throw err;
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
            console.log(`💻 Website available at http://localhost:${PORT}`);
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
