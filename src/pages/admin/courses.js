import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminCourses() {
    const { token } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, [token]);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (courseId, currentStatus) => {
        try {
            const response = await fetch(`${API_URL}/admin/courses/${courseId}/publish`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ published: !currentStatus })
            });
            if (response.ok) {
                fetchCourses();
            }
        } catch (error) {
            console.error('Toggle publish error:', error);
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <AdminLayout title="Course Management">
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📚</div>
                    <div className={styles.statInfo}>
                        <h3>{courses.length}</h3>
                        <p>Total Courses</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(39, 174, 96, 0.15)' }}>✅</div>
                    <div className={styles.statInfo}>
                        <h3>{courses.filter(c => c.is_published).length}</h3>
                        <p>Published</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(241, 196, 15, 0.15)' }}>📝</div>
                    <div className={styles.statInfo}>
                        <h3>{courses.filter(c => !c.is_published).length}</h3>
                        <p>Drafts</p>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2>All Courses</h2>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Category</th>
                                <th>Level</th>
                                <th>Price</th>
                                <th>Enrollments</th>
                                <th>Modules</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course.id}>
                                    <td>
                                        <strong>{course.title}</strong>
                                        <br />
                                        <small style={{ color: 'var(--text-muted)' }}>
                                            {course.slug}
                                        </small>
                                    </td>
                                    <td>{course.category}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{course.level}</td>
                                    <td>{formatPrice(course.price)}</td>
                                    <td>{course.enrollment_count || 0}</td>
                                    <td>{course.module_count || 0} modules</td>
                                    <td>
                                        <span className={`${styles.status} ${course.is_published ? styles.statusCompleted : styles.statusPending}`}>
                                            {course.is_published ? '✓ Published' : '📝 Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.btnSmall} ${course.is_published ? styles.btnReject : styles.btnVerify}`}
                                                onClick={() => togglePublish(course.id, course.is_published)}
                                            >
                                                {course.is_published ? 'Unpublish' : 'Publish'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}

AdminCourses.getLayout = (page) => page;
