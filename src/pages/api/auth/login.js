export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    // Mock login logic
    if (email === 'fail@example.com') {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return mock user and token
    const token = 'mock-jwt-token-123456789';
    const user = {
        id: 1,
        name: email.includes('admin') ? 'Admin User' : 'Demo User',
        email: email,
        role: email === 'admin@cyberdravida.com' ? 'admin' : 'student',
        phone: '1234567890'
    };

    res.status(200).json({ success: true, token, user });
}
