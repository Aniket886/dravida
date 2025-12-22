import { getCollection } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function getUserFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const paymentsCollection = await getCollection('payments');

        // Fetch payments for this user
        const payments = await paymentsCollection
            .find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .toArray();

        // Format for frontend
        const formattedPayments = payments.map(payment => ({
            id: payment._id.toString(),
            order_id: payment.orderId || payment._id.toString().slice(-8),
            course_titles: payment.courseTitles,
            amount: payment.amount,
            original_amount: payment.originalAmount,
            coupon_code: payment.couponCode,
            discount_percent: payment.discountPercent,
            utr_number: payment.utrNumber,
            transaction_id: payment.transactionId,
            status: payment.status,
            created_at: payment.createdAt
        }));

        res.status(200).json(formattedPayments);
    } catch (error) {
        console.error('Fetch payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
}
