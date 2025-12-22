import { getCollection } from '../../lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function getUserFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const enrollmentsCollection = await getCollection('enrollments');

        // Fetch user's enrollments
        const enrollments = await enrollmentsCollection
            .find({ userId: user.userId })
            .sort({ enrolledAt: -1 })
            .toArray();

        // Get course details for each enrollment
        const { courses } = await import('../../data/mockCourses');

        const formattedEnrollments = enrollments.map(enrollment => {
            const course = courses.find(c =>
                c.id === enrollment.courseId ||
                c.id === parseInt(enrollment.courseId)
            );

            if (!course) {
                return null;
            }

            // Calculate total lessons
            const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

            return {
                id: enrollment._id.toString(),
                course_id: enrollment.courseId,
                slug: course.slug,
                title: course.title,
                thumbnail: course.thumbnail,
                level: course.level,
                duration: course.duration,
                totalLessons,
                completedLessons: enrollment.completedLessons || 0,
                progress: enrollment.progress || 0,
                status: enrollment.status || 'active',
                enrolledAt: enrollment.enrolledAt
            };
        }).filter(Boolean);

        res.status(200).json(formattedEnrollments);
    } catch (error) {
        console.error('Fetch enrollments error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
}
