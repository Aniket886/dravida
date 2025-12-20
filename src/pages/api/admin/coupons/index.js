import { getCollection } from '../../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const couponsCollection = await getCollection('coupons');

    if (req.method === 'GET') {
        try {
            const coupons = await couponsCollection.find({}).sort({ createdAt: -1 }).toArray();
            const formatted = coupons.map(c => ({
                id: c._id.toString(),
                code: c.code,
                discount_percent: c.discountPercent,
                usage_count: c.usageCount || 0,
                usage_limit: c.usageLimit || null,
                expiry_date: c.expiryDate,
                is_active: c.isActive !== false,
                createdAt: c.createdAt
            }));
            return res.status(200).json(formatted);
        } catch (error) {
            console.error('Fetch coupons error:', error);
            return res.status(500).json({ error: 'Failed to fetch coupons' });
        }
    }

    if (req.method === 'POST') {
        const { code, discountPercent, expiryDate, usageLimit } = req.body;

        if (!code || !discountPercent) {
            return res.status(400).json({ error: 'Code and discount percent are required' });
        }

        try {
            // Check if code already exists
            const existing = await couponsCollection.findOne({ code: code.toUpperCase() });
            if (existing) {
                return res.status(400).json({ error: 'Coupon code already exists' });
            }

            const newCoupon = {
                code: code.toUpperCase(),
                discountPercent: parseInt(discountPercent),
                expiryDate: expiryDate || null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                usageCount: 0,
                isActive: true,
                createdAt: new Date()
            };

            const result = await couponsCollection.insertOne(newCoupon);

            return res.status(201).json({
                id: result.insertedId.toString(),
                code: newCoupon.code,
                discount_percent: newCoupon.discountPercent,
                message: 'Coupon created successfully'
            });
        } catch (error) {
            console.error('Create coupon error:', error);
            return res.status(500).json({ error: 'Failed to create coupon' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
