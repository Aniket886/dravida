import { getAllUsers, countUsers } from '../../../models/User';
import { getCollection } from '../../../lib/mongodb';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search = '', page = 1, limit = 10 } = req.query;

    try {
        // Get students from MongoDB
        const result = await getAllUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            role: 'student'
        });

        // Get enrollment counts (mock for now, can be enhanced later)
        const students = result.users.map(user => ({
            ...user,
            enrolled_courses: 0,
            completed_courses: 0,
            created_at: user.createdAt
        }));

        res.status(200).json({
            students,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
}
