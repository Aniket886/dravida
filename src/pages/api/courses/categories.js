import { categories } from '../../../data/mockCourses';

export default function handler(req, res) {
    res.status(200).json(categories);
}
