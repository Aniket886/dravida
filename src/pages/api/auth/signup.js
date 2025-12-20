import { createUser } from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        // Create user in MongoDB
        const user = await createUser({
            name,
            email,
            password,
            phone,
            role: 'student',
            authProvider: 'email'
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ success: true, token, user });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.message === 'User already exists') {
            return res.status(400).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: 'Failed to create account' });
    }
}
