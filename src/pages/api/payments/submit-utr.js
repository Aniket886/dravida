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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { courseIds, utrNumber, transactionId, amount, couponCode, discountPercent } = req.body;

    if (!courseIds || !utrNumber || !transactionId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const paymentsCollection = await getCollection('payments');

        // Check for duplicate UTR
        const existingPayment = await paymentsCollection.findOne({ utrNumber });
        if (existingPayment) {
            return res.status(400).json({ error: 'This UTR number has already been submitted' });
        }

        // Get course titles
        const { courses } = await import('../../../data/mockCourses');
        const courseTitles = courseIds.map(id => {
            const course = courses.find(c => c.id === parseInt(id) || c.id === id);
            return course?.title || 'Unknown Course';
        }).join(', ');

        // Create payment record
        const payment = {
            userId: user.userId,
            userEmail: user.email,
            userName: user.name || 'User',
            courseIds,
            courseTitles,
            amount: parseFloat(amount),
            originalAmount: discountPercent > 0 ? amount / (1 - discountPercent / 100) : amount,
            utrNumber,
            transactionId,
            couponCode: couponCode || null,
            discountPercent: discountPercent || 0,
            status: 'pending_verification',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await paymentsCollection.insertOne(payment);

        // Increment coupon usage if used
        if (couponCode) {
            const couponsCollection = await getCollection('coupons');
            await couponsCollection.updateOne(
                { code: couponCode.toUpperCase() },
                { $inc: { usageCount: 1 } }
            );
        }

        return res.status(200).json({
            success: true,
            paymentId: result.insertedId.toString(),
            message: 'Payment submitted for verification'
        });
    } catch (error) {
        console.error('Submit payment error:', error);
        return res.status(500).json({ error: 'Failed to submit payment' });
    }
}
