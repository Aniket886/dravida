export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search = '', page = 1, limit = 10 } = req.query;

    // Mock students data
    const allStudents = [
        { id: 1, name: 'Aniket Tegginamath', email: 'aniket.gmu@gmail.com', enrolled_courses: 3, completed_courses: 1, created_at: '2024-01-15' },
        { id: 2, name: 'Rahul Kumar', email: 'rahul.k@gmail.com', enrolled_courses: 2, completed_courses: 2, created_at: '2024-02-20' },
        { id: 3, name: 'Priya Sharma', email: 'priya.s@outlook.com', enrolled_courses: 4, completed_courses: 0, created_at: '2024-03-10' },
        { id: 4, name: 'Amit Patil', email: 'amit.patil@yahoo.com', enrolled_courses: 1, completed_courses: 1, created_at: '2024-04-05' },
        { id: 5, name: 'Sneha Reddy', email: 'sneha.r@gmail.com', enrolled_courses: 5, completed_courses: 3, created_at: '2024-05-12' }
    ];

    // Filter by search
    let filtered = allStudents;
    if (search) {
        const q = search.toLowerCase();
        filtered = allStudents.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedStudents = filtered.slice(startIndex, startIndex + limitNum);
    const totalPages = Math.ceil(filtered.length / limitNum);

    res.status(200).json({
        students: paginatedStudents,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: filtered.length,
            totalPages
        }
    });
}
