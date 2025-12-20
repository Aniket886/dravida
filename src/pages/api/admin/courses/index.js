import { courses } from '../../../data/mockCourses';

export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        // Transform mock courses to admin format
        const adminCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            slug: course.slug,
            category: course.category,
            level: course.level,
            price: course.price,
            original_price: course.original_price,
            enrollment_count: course.enrollment_count || 0,
            module_count: course.modules?.length || 0,
            is_published: true, // All mock courses are published
            thumbnail: course.thumbnail,
            instructor_name: course.instructor_name
        }));

        return res.status(200).json(adminCourses);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
