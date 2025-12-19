import { courses } from '../../../data/mockCourses';

export default function handler(req, res) {
    const { id } = req.query;

    // Find by ID or Slug
    const course = courses.find(c => c.id.toString() === id || c.slug === id);

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    // Add related courses (simple logic: same category or just others)
    const relatedCourses = courses
        .filter(c => c.id !== course.id)
        .slice(0, 2);

    res.status(200).json({
        ...course,
        relatedCourses,
        isEnrolled: false // Default to false for mock
    });
}
