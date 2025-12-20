import { findUserByEmail, createUser } from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    try {
        // Decode the Google JWT credential to extract user info
        let googleUser = { name: 'Google User', email: 'google-user@gmail.com', picture: '' };

        const parts = credential.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            googleUser = {
                name: payload.name || payload.given_name || 'Google User',
                email: payload.email,
                picture: payload.picture || ''
            };
        }

        // Check if user exists
        let user = await findUserByEmail(googleUser.email);

        if (!user) {
            // Create new user
            user = await createUser({
                name: googleUser.name,
                email: googleUser.email,
                avatar: googleUser.picture,
                role: 'student',
                authProvider: 'google'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id || user._id.toString(), email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userResponse = {
            id: user.id || user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            avatar: user.avatar || googleUser.picture
        };

        res.status(200).json({ success: true, token, user: userResponse });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google login failed' });
    }
}
