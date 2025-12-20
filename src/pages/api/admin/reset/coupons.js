import { getCollection } from '../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        try {
            const couponsCollection = await getCollection('coupons');
            await couponsCollection.deleteMany({});
            return res.status(200).json({ success: true, message: 'All coupons have been deleted' });
        } catch (error) {
            console.error('Reset coupons error:', error);
            return res.status(500).json({ error: 'Failed to reset coupons' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
