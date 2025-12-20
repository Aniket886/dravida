import { getCollection } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const couponsCollection = await getCollection('coupons');
            const result = await couponsCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            return res.status(200).json({ success: true, message: 'Coupon deleted' });
        } catch (error) {
            console.error('Delete coupon error:', error);
            return res.status(500).json({ error: 'Failed to delete coupon' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
