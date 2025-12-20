export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock pending payments - empty for now
    const pendingPayments = [];

    res.status(200).json({ payments: pendingPayments, count: pendingPayments.length });
}
