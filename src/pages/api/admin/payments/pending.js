export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock pending payments count
    res.status(200).json({ count: 3 });
}
