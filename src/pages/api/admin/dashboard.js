import { countUsers } from '../../../models/User';
import { getCollection } from '../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Get real counts from MongoDB
        const totalStudents = await countUsers('student');
        const totalCourses = 5; // From mock courses, can be enhanced later

        // For now, other stats are mock until we add enrollments collection
        const stats = {
            totalStudents,
            totalCourses,
            totalEnrollments: 0,
            totalRevenue: 0,
            recentEnrollments: 0,
            monthlyRevenue: 0
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}
