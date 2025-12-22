import { getCollection } from '../../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status = 'all' } = req.query;

    try {
        const paymentsCollection = await getCollection('payments');

        // Build query
        let query = {};
        if (status !== 'all') {
            query.status = status;
        }

        // Fetch payments from MongoDB
        const payments = await paymentsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Format for frontend
        const formattedPayments = payments.map((payment, index) => {
            // Generate readable order ID: YYYYMM + sequential number
            const date = new Date(payment.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const orderNum = String(index + 1).padStart(2, '0');
            const orderId = `${year}${month}${orderNum}`;

            return {
                id: payment._id.toString(),
                order_id: orderId,
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
            };
        });

        res.status(200).json({ payments: formattedPayments });
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
}

