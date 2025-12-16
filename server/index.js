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
const { seedDatabase } = require('./database/seed');
const { closeDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('\n🌐 Starting Cyber Dravida LMS Server...\n');

        // Initialize database
        await initializeDatabase();

        // Seed with sample data
        await seedDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
            console.log('\n📋 Available Endpoints:');
            console.log('   POST /api/auth/signup - Register new user');
            console.log('   POST /api/auth/login - User login');
            console.log('   GET  /api/courses - List all courses');
            console.log('   GET  /api/courses/:id - Course details');
            console.log('   GET  /api/enrollments - User enrolled courses');
            console.log('   POST /api/cart - Add to cart');
            console.log('   GET  /api/admin/dashboard - Admin stats');
            console.log('\n🔐 Admin Login: admin@cyberdravida.com / Admin@123\n');
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
