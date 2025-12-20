export default function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'PUT') {
        // Mock publish/unpublish - in a real app this would update the database
        return res.status(200).json({
            success: true,
            message: `Course ${id} publication status updated`
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
