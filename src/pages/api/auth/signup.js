export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, password, phone } = req.body;

    // Simulate existing user check
    if (email === 'exists@example.com') {
        return res.status(400).json({ error: 'User already exists' });
    }

    const token = 'mock-jwt-token-created-from-signup';
    const user = {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        phone,
        role: 'student'
    };

    res.status(201).json({ success: true, token, user });
}
