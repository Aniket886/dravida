export default function handler(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // In a real app we would verify the token. 
    // Here we just return the mock user if any token is present.

    res.status(200).json({
        id: 1,
        name: 'Demo User',
        email: 'user@example.com',
        role: 'student',
        phone: '1234567890'
    });
}
