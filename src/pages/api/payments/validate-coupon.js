import { getCollection } from '../../../lib/mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Coupon code is required' });
    }

    try {
        const couponsCollection = await getCollection('coupons');

        // Find coupon by code (case insensitive)
        const coupon = await couponsCollection.findOne({
            code: code.toUpperCase(),
            isActive: { $ne: false }
        });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        // Check if expired
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        // Return valid coupon info
        return res.status(200).json({
            valid: true,
            code: coupon.code,
            percent: coupon.discountPercent,
            discountPercent: coupon.discountPercent,
            message: `${coupon.discountPercent}% discount applied!`
        });
    } catch (error) {
        console.error('Coupon validation error:', error);
        return res.status(500).json({ error: 'Failed to validate coupon' });
    }
}
