export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    // Mock Google login - in production, you would verify the credential with Google
    // For demo purposes, we'll just return a mock user based on the credential
    const token = 'mock-google-jwt-token-' + Date.now();
    const user = {
        id: Math.floor(Math.random() * 1000),
        name: 'Google User',
        email: 'google-user@gmail.com',
        role: 'student',
        phone: '',
        avatar: 'https://lh3.googleusercontent.com/a/default-user'
    };

    res.status(200).json({ success: true, token, user });
}
