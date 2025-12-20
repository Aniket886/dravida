export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status = 'all' } = req.query;

    // Mock payments data for now - can be replaced with MongoDB later
    const allPayments = [
        {
            id: 1,
            user_name: 'Demo Student',
            user_email: 'demo@example.com',
            course_titles: 'Introduction to Cybersecurity',
            amount: 2999,
            original_amount: 5999,
            coupon_code: 'CYBER50',
            discount_percent: 50,
            utr_number: 'UTR123456789',
            transaction_id: 'TXN987654321',
            status: 'pending_verification',
            created_at: new Date().toISOString()
        }
    ];

    let filtered = allPayments;
    if (status !== 'all') {
        filtered = allPayments.filter(p => p.status === status);
    }

    res.status(200).json({ payments: filtered });
}
