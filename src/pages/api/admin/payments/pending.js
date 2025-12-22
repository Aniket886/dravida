import { getCollection } from '../../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const paymentsCollection = await getCollection('payments');

        // Fetch pending payments from MongoDB
        const payments = await paymentsCollection
            .find({ status: 'pending_verification' })
            .sort({ createdAt: -1 })
            .toArray();

        // Format for frontend
        const formattedPayments = payments.map(payment => ({
            id: payment._id.toString(),
            user_name: payment.userName || 'User',
            user_email: payment.userEmail,
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

        res.status(200).json({
            payments: formattedPayments,
            count: formattedPayments.length
        });
    } catch (error) {
        console.error('Fetch pending payments error:', error);
        res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
}
