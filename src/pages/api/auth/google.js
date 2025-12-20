export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    try {
        // Decode the Google JWT credential to extract user info
        // The credential is a JWT with 3 parts separated by dots
        const parts = credential.split('.');
        if (parts.length === 3) {
            // Decode the payload (middle part)
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

            const token = 'mock-google-jwt-token-' + Date.now();
            const user = {
                id: Math.floor(Math.random() * 1000),
                name: payload.name || payload.given_name || 'Google User',
                email: payload.email || 'google-user@gmail.com',
                role: 'student',
                phone: '',
                avatar: payload.picture || ''
            };

            return res.status(200).json({ success: true, token, user });
        }
    } catch (error) {
        console.error('Error decoding Google credential:', error);
    }

    // Fallback if decoding fails
    const token = 'mock-google-jwt-token-' + Date.now();
    const user = {
        id: Math.floor(Math.random() * 1000),
        name: 'Google User',
        email: 'google-user@gmail.com',
        role: 'student',
        phone: '',
        avatar: ''
    };

    res.status(200).json({ success: true, token, user });
}
