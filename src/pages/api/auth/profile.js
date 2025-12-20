export default function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, phone } = req.body;

    // In a real app, you would update the user in the database
    // For mock purposes, we just return the updated user
    const user = {
        id: 1,
        name: name || 'Demo User',
        email: 'user@example.com', // Email cannot be changed
        role: 'student',
        phone: phone || ''
    };

    res.status(200).json({ success: true, user, message: 'Profile updated successfully' });
}
