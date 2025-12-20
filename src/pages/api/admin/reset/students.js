export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        // Handle reset
        return res.status(200).json({ success: true, message: 'All students have been reset (demo mode - no actual data deleted)' });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
