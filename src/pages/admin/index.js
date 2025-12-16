import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        fetchDashboard();
        fetchPendingPayments();
    }, [token]);

    const fetchDashboard = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPayments = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/payments/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingCount(data.count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch pending:', error);
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className={styles.loading}>
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            {/* Alert for pending payments */}
            {pendingCount > 0 && (
                <div style={{
                    background: 'rgba(241, 196, 15, 0.15)',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <strong style={{ color: '#f39c12' }}>⚠️ {pendingCount} Payment(s) Pending Verification</strong>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                            Review and verify payments to grant course access
                        </p>
                    </div>
                    <a href="/admin/payments" className="btn btn-primary">
                        Review Payments
                    </a>
                </div>
            )}

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.totalStudents || 0}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📚</div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.totalCourses || 0}</h3>
                        <p>Total Courses</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.totalEnrollments || 0}</h3>
                        <p>Total Enrollments</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statInfo}>
                        <h3>{formatPrice(stats?.totalRevenue)}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(39, 174, 96, 0.15)' }}>📈</div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.recentEnrollments || 0}</h3>
                        <p>Enrollments (7 days)</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(52, 152, 219, 0.15)' }}>💵</div>
                    <div className={styles.statInfo}>
                        <h3>{formatPrice(stats?.monthlyRevenue)}</h3>
                        <p>Revenue (This Month)</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(241, 196, 15, 0.15)' }}>⏳</div>
                    <div className={styles.statInfo}>
                        <h3>{pendingCount}</h3>
                        <p>Pending Verifications</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.tableContainer} style={{ marginTop: 'var(--space-xl)' }}>
                <div className={styles.tableHeader}>
                    <h2>Quick Actions</h2>
                </div>
                <div style={{ padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    <a href="/admin/payments" className="btn btn-primary">
                        💰 Verify Payments
                    </a>
                    <a href="/admin/courses" className="btn btn-secondary">
                        📚 Manage Courses
                    </a>
                    <a href="/admin/students" className="btn btn-secondary">
                        👥 View Students
                    </a>
                    <a href="/admin/coupons" className="btn btn-secondary">
                        🎟️ Manage Coupons
                    </a>
                </div>
            </div>
        </AdminLayout>
    );
}

AdminDashboard.getLayout = (page) => page;
