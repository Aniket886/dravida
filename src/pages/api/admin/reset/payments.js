export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        return res.status(200).json({ success: true, message: 'All payments have been reset (demo mode)' });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
