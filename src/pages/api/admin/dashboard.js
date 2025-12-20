export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock dashboard stats
    const stats = {
        totalStudents: 156,
        totalCourses: 5,
        totalEnrollments: 423,
        totalRevenue: 847500,
        recentEnrollments: 24,
        monthlyRevenue: 125000
    };

    res.status(200).json({ success: true, stats });
}
