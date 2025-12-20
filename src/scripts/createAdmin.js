// Run this script once to create an admin user
// Usage: node src/scripts/createAdmin.js

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://anikettegginamath_db_user:uBGnqh11sgfP7DFm@cluster0.zdtxuoa.mongodb.net/?appName=Cluster0';
const MONGODB_DB = 'cyberdravida';

async function createAdmin() {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    const users = db.collection('users');

    const adminEmail = 'admin@cyberdravida.com';

    // Check if admin exists
    const existingAdmin = await users.findOne({ email: adminEmail });
    if (existingAdmin) {
        console.log('Admin user already exists!');
        await client.close();
        return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        phone: '',
        role: 'admin',
        avatar: '',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await users.insertOne(admin);
    console.log('Admin user created successfully!');
    console.log('Email: admin@cyberdravida.com');
    console.log('Password: Admin@123');

    await client.close();
}

createAdmin().catch(console.error);
