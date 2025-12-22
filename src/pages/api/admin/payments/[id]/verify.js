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

        const result = await paymentsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: 'completed',
                    verifiedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // TODO: Create enrollment records for the user's purchased courses

        res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
}
