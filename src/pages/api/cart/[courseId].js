import { getCollection } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function getUserIdFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    const userId = getUserIdFromToken(req.headers.authorization);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { courseId } = req.query;

    if (req.method === 'DELETE') {
        try {
            const cartsCollection = await getCollection('carts');

            await cartsCollection.updateOne(
                { userId },
                { $pull: { items: { course_id: parseInt(courseId) } } }
            );

            // Also try string version
            await cartsCollection.updateOne(
                { userId },
                { $pull: { items: { course_id: courseId } } }
            );

            return res.status(200).json({ success: true, message: 'Removed from cart' });
        } catch (error) {
            console.error('Remove from cart error:', error);
            return res.status(500).json({ error: 'Failed to remove from cart' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
