import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Admin.module.css';
import ResetModal from '../../components/ResetModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminStudents() {
    const { token } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    const [showReset, setShowReset] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [token, pagination.page]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/admin/students?page=${pagination.page}&search=${search}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setResetLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/reset/students`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                setShowReset(false);
                fetchStudents();
            } else {
                throw new Error('Reset failed');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to reset students');
        } finally {
            setResetLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(p => ({ ...p, page: 1 }));
        fetchStudents();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <AdminLayout title="Student Management">
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    onClick={() => setShowReset(true)}
                    className="btn"
                    style={{ background: '#e74c3c', color: 'white' }}
                >
                    ⚠️ Reset All Students
                </button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                        <h3>{pagination.total}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2>All Students</h2>
                    <form onSubmit={handleSearch} className={styles.tableFilters}>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input"
                            style={{ width: '300px' }}
                        />
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className="spinner"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>👥</span>
                        <h3>No students found</h3>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Enrolled Courses</th>
                                <th>Completed</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td><strong>{student.name}</strong></td>
                                    <td>{student.email}</td>
                                    <td>{student.enrolled_courses || 0}</td>
                                    <td>{student.completed_courses || 0}</td>
                                    <td>{formatDate(student.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {pagination.totalPages > 1 && (
                    <div style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                        <button
                            className="btn btn-secondary"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </button>
                        <span style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            className="btn btn-secondary"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <ResetModal
                isOpen={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={handleReset}
                title="Reset Students"
                message="Are you sure you want to DELETE ALL STUDENTS? This will remove all user accounts, enrollments, and progress. Admin accounts will be preserved."
                confirmText="DELETE"
                loading={resetLoading}
            />
        </AdminLayout>
    );
}

AdminStudents.getLayout = (page) => page;
