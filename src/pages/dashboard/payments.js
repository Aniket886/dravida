import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/UserDashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function PaymentsPage() {
    const { token } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchPayments();
            // Poll for updates every 30 seconds
            const interval = setInterval(fetchPayments, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const fetchPayments = async () => {
        try {
            const response = await fetch(`${API_URL}/payments/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending_verification':
                return { text: '⏳ Pending Verification', class: styles.statusPending };
            case 'completed':
                return { text: '✅ Verified', class: styles.statusCompleted };
            case 'rejected':
                return { text: '❌ Rejected', class: styles.statusRejected };
            default:
                return { text: status, class: '' };
        }
    };

    const pendingCount = payments.filter(p => p.status === 'pending_verification').length;
    const totalSpent = payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + (p.amount || 0), 0);

    return (
        <DashboardLayout title="Payment History">
            {/* Stats */}
            <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💳</span>
                    <div>
                        <span className={styles.statValue}>{payments.length}</span>
                        <span className={styles.statLabel}>Total Transactions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>⏳</span>
                    <div>
                        <span className={styles.statValue}>{pendingCount}</span>
                        <span className={styles.statLabel}>Pending Verification</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💰</span>
                    <div>
                        <span className={styles.statValue}>{formatPrice(totalSpent)}</span>
                        <span className={styles.statLabel}>Total Spent</span>
                    </div>
                </div>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <div className={styles.card} style={{
                    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(241, 196, 15, 0.05))',
                    borderColor: 'rgba(243, 156, 18, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{ fontSize: '2rem' }}>⏳</span>
                        <div>
                            <h3 style={{ margin: 0, color: '#f39c12' }}>Payment Under Verification</h3>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                                You have {pendingCount} payment(s) waiting for admin verification.
                                This usually takes 2-24 hours.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Table */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>All Transactions</h2>
                    <button onClick={fetchPayments} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className={styles.empty}>
                        <div className="spinner"></div>
                        <p>Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className={styles.empty}>
                        <span>💳</span>
                        <h2>No Payments Yet</h2>
                        <p>You haven't made any payments yet. Browse courses and enroll to get started!</p>
                        <Link href="/courses" className="btn btn-primary">
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Courses</th>
                                <th>Amount</th>
                                <th>UTR Number</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => {
                                const statusInfo = getStatusInfo(payment.status);
                                return (
                                    <tr key={payment.id}>
                                        <td>
                                            <small>{formatDate(payment.created_at)}</small>
                                        </td>
                                        <td style={{ maxWidth: '250px' }}>
                                            <small>{payment.course_titles || 'Course Purchase'}</small>
                                        </td>
                                        <td>
                                            <strong style={{ color: 'var(--primary)' }}>
                                                {formatPrice(payment.amount)}
                                            </strong>
                                        </td>
                                        <td>
                                            <code style={{
                                                background: 'var(--bg-tertiary)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {payment.utr_number || '-'}
                                            </code>
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${statusInfo.class}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🔄 Payment status updates automatically every 30 seconds
            </p>
        </DashboardLayout>
    );
}

PaymentsPage.getLayout = (page) => page;
