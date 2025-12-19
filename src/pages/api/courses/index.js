import { courses } from '../../../data/mockCourses';

export default function handler(req, res) {
    const { category, level, search, limit = 12, page = 1 } = req.query;

    let filteredCourses = [...courses];

    if (category) {
        filteredCourses = filteredCourses.filter(c => c.category === category);
    }
    if (level) {
        filteredCourses = filteredCourses.filter(c => c.level === level);
    }
    if (search) {
        const q = search.toLowerCase();
        filteredCourses = filteredCourses.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
    }

    // Pagination logic
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + limitNum);
    const totalPages = Math.ceil(filteredCourses.length / limitNum);

    res.status(200).json({
        courses: paginatedCourses,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: filteredCourses.length,
            totalPages
        }
    });
}
