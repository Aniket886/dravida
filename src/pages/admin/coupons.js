import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminCoupons() {
    const { token } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountPercent: '',
        expiryDate: '',
        usageLimit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, [token]);

    const fetchCoupons = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/admin/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCoupons(data);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/admin/coupons`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData({ code: '', discountPercent: '', expiryDate: '', usageLimit: '' });
                setShowForm(false);
                fetchCoupons();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to create coupon');
            }
        } catch (error) {
            console.error('Create coupon error:', error);
        }
    };

    const deleteCoupon = async (id) => {
        console.log('Deleting coupon:', id);
        if (!token) {
            alert('Not authenticated');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Coupon deleted successfully');
                fetchCoupons();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete coupon');
            }
        } catch (error) {
            console.error('Delete coupon error:', error);
            alert('Failed to delete coupon: ' + error.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No expiry';
        return new Date(dateStr).toLocaleDateString('en-IN');
    };

    return (
        <AdminLayout title="Coupon Management">
            <div className={styles.tableContainer} style={{ marginBottom: 'var(--space-lg)' }}>
                <div className={styles.tableHeader}>
                    <h2>Create Coupon</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ New Coupon'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label>Coupon Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., SAVE20"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Discount %</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 20"
                                    min="1"
                                    max="100"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Usage Limit (Optional)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 100"
                                    min="1"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                            Create Coupon
                        </button>
                    </form>
                )}
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2>All Coupons</h2>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className="spinner"></div>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>🎟️</span>
                        <h3>No coupons yet</h3>
                        <p>Create your first coupon above</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Usage</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon.id}>
                                    <td>
                                        <code style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontWeight: '600'
                                        }}>
                                            {coupon.code}
                                        </code>
                                    </td>
                                    <td><strong>{coupon.discount_percent}% OFF</strong></td>
                                    <td>{coupon.usage_count || 0} / {coupon.usage_limit || '∞'}</td>
                                    <td>{formatDate(coupon.expiry_date)}</td>
                                    <td>
                                        <span className={`${styles.status} ${coupon.is_active ? styles.statusCompleted : styles.statusRejected}`}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`${styles.btnSmall} ${styles.btnReject}`}
                                            onClick={() => deleteCoupon(coupon.id)}
                                        >
                                            Delete
                                        </button>
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

AdminCoupons.getLayout = (page) => page;
