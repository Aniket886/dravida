import { getCollection } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper to get user ID from token
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

    const cartsCollection = await getCollection('carts');

    if (req.method === 'GET') {
        try {
            const cart = await cartsCollection.findOne({ userId });
            return res.status(200).json({
                items: cart?.items || [],
                total: cart?.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
            });
        } catch (error) {
            console.error('Get cart error:', error);
            return res.status(500).json({ error: 'Failed to fetch cart' });
        }
    }

    if (req.method === 'POST') {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }

        try {
            // Get course details from mock data
            const { courses } = await import('../../../data/mockCourses');
            const course = courses.find(c => c.id === parseInt(courseId) || c.id === courseId || c.slug === courseId);

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const cartItem = {
                course_id: course.id,
                id: course.id,
                title: course.title,
                price: course.price,
                original_price: course.original_price,
                thumbnail: course.thumbnail,
                instructor_name: course.instructor_name
            };

            // Upsert cart
            await cartsCollection.updateOne(
                { userId },
                {
                    $addToSet: { items: cartItem },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );

            return res.status(200).json({ success: true, message: 'Added to cart' });
        } catch (error) {
            console.error('Add to cart error:', error);
            return res.status(500).json({ error: 'Failed to add to cart' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            await cartsCollection.deleteOne({ userId });
            return res.status(200).json({ success: true, message: 'Cart cleared' });
        } catch (error) {
            console.error('Clear cart error:', error);
            return res.status(500).json({ error: 'Failed to clear cart' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
