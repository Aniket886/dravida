import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Admin.module.css';
import ResetModal from '../../components/ResetModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminPayments() {
    const { token } = useAuth();
    const [payments, setPayments] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [searchEmail, setSearchEmail] = useState('');
    const [processing, setProcessing] = useState(null);

    const [showReset, setShowReset] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, [token, filter]);

    const handleReset = async () => {
        setResetLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/reset/payments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                setShowReset(false);
                fetchPayments(); // Refresh list
            } else {
                throw new Error('Reset failed');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to reset payments');
        } finally {
            setResetLoading(false);
        }
    };

    const fetchPayments = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let url = `${API_URL}/admin/payments`;
            if (filter === 'pending') {
                url = `${API_URL}/admin/payments/pending`;
            } else if (filter !== 'all') {
                url += `?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const paymentList = data.payments || data;
                setPayments(paymentList);
                setAllPayments(paymentList);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (email) => {
        setSearchEmail(email);
        if (!email.trim()) {
            setPayments(allPayments);
        } else {
            const filtered = allPayments.filter(p =>
                p.user_email?.toLowerCase().includes(email.toLowerCase()) ||
                p.user_name?.toLowerCase().includes(email.toLowerCase()) ||
                p.utr_number?.toLowerCase().includes(email.toLowerCase())
            );
            setPayments(filtered);
        }
    };

    const verifyPayment = async (paymentId) => {
        console.log('Verifying payment:', paymentId);
        if (!token) {
            alert('Not authenticated');
            return;
        }

        setProcessing(paymentId);
        try {
            const response = await fetch(`${API_URL}/admin/payments/${paymentId}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('✅ Payment verified! User now has course access.');
                fetchPayments();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to verify payment');
            }
        } catch (error) {
            console.error('Verify error:', error);
            alert('Failed to verify payment');
        } finally {
            setProcessing(null);
        }
    };

    const rejectPayment = async (paymentId) => {
        console.log('Rejecting payment:', paymentId);
        if (!token) {
            alert('Not authenticated');
            return;
        }

        setProcessing(paymentId);
        try {
            const response = await fetch(`${API_URL}/admin/payments/${paymentId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Payment rejected by admin' })
            });

            if (response.ok) {
                alert('✅ Payment rejected successfully.');
                fetchPayments();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to reject payment');
            }
        } catch (error) {
            console.error('Reject error:', error);
            alert('Failed to reject payment');
        } finally {
            setProcessing(null);
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
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending_verification': return styles.statusPending;
            case 'completed': return styles.statusCompleted;
            case 'rejected': return styles.statusRejected;
            default: return '';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending_verification': return '⏳ Pending';
            case 'completed': return '✅ Verified';
            case 'rejected': return '❌ Rejected';
            default: return status;
        }
    };

    return (
        <AdminLayout title="Payment Verification">
            {/* Reset Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    onClick={() => setShowReset(true)}
                    className="btn"
                    style={{ background: '#e74c3c', color: 'white' }}
                >
                    ⚠️ Reset All Payments
                </button>
            </div>

            {/* Filters */}
            <div className={styles.tableContainer} style={{ marginBottom: 'var(--space-lg)' }}>
                <div className={styles.tableHeader}>
                    <h2>Filter Payments</h2>
                    <div className={styles.tableFilters}>
                        <input
                            type="text"
                            placeholder="Search by email, name, or UTR..."
                            value={searchEmail}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="form-input"
                            style={{ width: '300px' }}
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="form-input"
                        >
                            <option value="pending">Pending Verification</option>
                            <option value="completed">Verified</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">All Payments</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2>
                        {filter === 'pending' ? 'Pending Verifications' :
                            filter === 'completed' ? 'Verified Payments' :
                                filter === 'rejected' ? 'Rejected Payments' : 'All Payments'}
                        {filter === 'pending' && payments.length > 0 && (
                            <span className={styles.alertBadge}>{payments.length}</span>
                        )}
                    </h2>
                    <button onClick={fetchPayments} className="btn btn-secondary">
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className="spinner"></div>
                        <p>Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>📭</span>
                        <h3>No {filter === 'pending' ? 'pending' : ''} payments found</h3>
                        <p>
                            {filter === 'pending'
                                ? 'All payments have been verified!'
                                : 'No payments match your criteria.'}
                        </p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Courses</th>
                                <th>Amount</th>
                                <th>UTR Number</th>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <strong>{payment.user_name}</strong>
                                        <br />
                                        <small style={{ color: 'var(--text-muted)' }}>
                                            {payment.user_email}
                                        </small>
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <small>{payment.course_titles || '-'}</small>
                                    </td>
                                    <td>
                                        {payment.coupon_code ? (
                                            <div style={{ fontSize: '0.85em' }}>
                                                <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                                                    {formatPrice(payment.original_amount || payment.amount)}
                                                </div>
                                                <strong style={{ color: 'var(--primary)' }}>
                                                    {formatPrice(payment.amount)}
                                                </strong>
                                                <div style={{ color: 'var(--success)', fontSize: '0.75em' }}>
                                                    🏷️ {payment.coupon_code} ({payment.discount_percent}% off)
                                                </div>
                                            </div>
                                        ) : (
                                            <strong style={{ color: 'var(--primary)' }}>
                                                {formatPrice(payment.amount)}
                                            </strong>
                                        )}
                                    </td>
                                    <td>
                                        <code style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.85em'
                                        }}>
                                            {payment.utr_number || '-'}
                                        </code>
                                    </td>
                                    <td>
                                        <code style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.85em'
                                        }}>
                                            {payment.transaction_id || '-'}
                                        </code>
                                    </td>
                                    <td>
                                        <small>{formatDate(payment.created_at)}</small>
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(payment.status)}`}>
                                            {getStatusText(payment.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {payment.status === 'pending_verification' && (
                                                <>
                                                    <button
                                                        className={`${styles.btnSmall} ${styles.btnVerify}`}
                                                        onClick={() => verifyPayment(payment.id)}
                                                        disabled={processing === payment.id}
                                                    >
                                                        {processing === payment.id ? '...' : '✓ Verify'}
                                                    </button>
                                                    <button
                                                        className={`${styles.btnSmall} ${styles.btnReject}`}
                                                        onClick={() => rejectPayment(payment.id)}
                                                        disabled={processing === payment.id}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </>
                                            )}
                                            {payment.status === 'completed' && (
                                                <span style={{ color: 'var(--success)', fontSize: '0.85em' }}>
                                                    Verified ✓
                                                </span>
                                            )}
                                            {payment.status === 'rejected' && (
                                                <span style={{ color: 'var(--danger)', fontSize: '0.85em' }}>
                                                    Rejected ✕
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <ResetModal
                isOpen={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={handleReset}
                title="Reset Payments"
                message="Are you sure you want to DELETE ALL PAYMENTS? This clears all transaction history. Course enrollments will remain."
                confirmText="DELETE"
                loading={resetLoading}
            />
        </AdminLayout>
    );
}

AdminPayments.getLayout = (page) => page;
