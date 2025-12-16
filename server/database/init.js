const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb, closeDb } = require('./db');

async function initializeDatabase() {
    console.log('Initializing database...');

    try {
        const db = await getDb();
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split and execute each statement
        const statements = schema.split(';').filter(s => s.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    db.run(statement);
                } catch (err) {
                    // Ignore errors for IF NOT EXISTS statements
                    if (!err.message.includes('already exists')) {
                        console.warn('Schema warning:', err.message);
                    }
                }
            }
        }

        saveDb();
        console.log('Database schema created successfully');

        // Add new columns to payments table if they don't exist
        const alterStatements = [
            'ALTER TABLE payments ADD COLUMN coupon_code TEXT',
            'ALTER TABLE payments ADD COLUMN discount_percent INTEGER DEFAULT 0',
            'ALTER TABLE payments ADD COLUMN original_amount REAL'
        ];

        for (const statement of alterStatements) {
            try {
                db.run(statement);
            } catch (err) {
                // Column already exists, ignore
            }
        }
        saveDb();

        // Create default admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberdravida.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin exists
        const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
        stmt.bind([adminEmail]);
        const existingAdmin = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const adminId = uuidv4();
            db.run(
                'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
                [adminId, adminEmail, hashedPassword, 'Admin', 'admin']
            );
            saveDb();
            console.log(`Admin user created: ${adminEmail}`);
        } else {
            console.log('Admin user already exists');
        }

        console.log('Database initialization completed');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };

// Run if called directly
if (require.main === module) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
    initializeDatabase()
        .then(() => {
            console.log('Done!');
            closeDb();
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
