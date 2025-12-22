import { getCollection } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    try {
        const paymentsCollection = await getCollection('payments');

        // Get payment details first
        const payment = await paymentsCollection.findOne({ _id: new ObjectId(id) });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Update payment status
        await paymentsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: 'completed',
                    verifiedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        // Create enrollment records for each course in the payment
        const enrollmentsCollection = await getCollection('enrollments');
        const courseIds = payment.courseIds || [];

        for (const courseId of courseIds) {
            // Check if already enrolled
            const existing = await enrollmentsCollection.findOne({
                userId: payment.userId,
                courseId: parseInt(courseId) || courseId
            });

            if (!existing) {
                await enrollmentsCollection.insertOne({
                    userId: payment.userId,
                    userEmail: payment.userEmail,
                    courseId: parseInt(courseId) || courseId,
                    paymentId: payment._id.toString(),
                    status: 'active',
                    progress: 0,
                    completedLessons: 0,
                    enrolledAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and courses unlocked!'
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
}
