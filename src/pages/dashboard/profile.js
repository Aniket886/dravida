import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/UserDashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ProfilePage() {
    const { user, token, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
                if (updateUser) {
                    updateUser({ ...user, ...formData });
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_URL}/auth/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: '✅ Password changed successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <DashboardLayout title="Profile Settings">
            {/* Message Alert */}
            {message.text && (
                <div className={styles.card} style={{
                    background: message.type === 'success'
                        ? 'rgba(39, 174, 96, 0.1)'
                        : 'rgba(231, 76, 60, 0.1)',
                    borderColor: message.type === 'success'
                        ? 'rgba(39, 174, 96, 0.3)'
                        : 'rgba(231, 76, 60, 0.3)',
                    padding: 'var(--space-md) var(--space-lg)'
                }}>
                    <p style={{
                        margin: 0,
                        color: message.type === 'success' ? '#27ae60' : '#e74c3c'
                    }}>
                        {message.text}
                    </p>
                </div>
            )}

            {/* Account Overview */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>Account Overview</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
                    <div className={styles.avatar} style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px' }}>{user?.name}</h3>
                        <p style={{ margin: '0 0 4px', color: 'var(--text-muted)' }}>
                            {user?.email}
                        </p>
                        <small style={{ color: 'var(--text-muted)' }}>
                            Member since {formatDate(user?.created_at)}
                        </small>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                {/* Profile Information */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Personal Information</h2>
                    </div>
                    <form onSubmit={handleProfileUpdate} className={styles.form} style={{ maxWidth: '100%' }}>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                className={styles.formInput}
                                value={user?.email || ''}
                                disabled
                            />
                            <small style={{ color: 'var(--text-muted)' }}>
                                Email cannot be changed
                            </small>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                className={styles.formInput}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter your phone number"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Change Password</h2>
                    </div>
                    <form onSubmit={handlePasswordChange} className={styles.form} style={{ maxWidth: '100%' }}>
                        <div className={styles.formGroup}>
                            <label>Current Password</label>
                            <input
                                type="password"
                                className={styles.formInput}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>New Password</label>
                            <input
                                type="password"
                                className={styles.formInput}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className={styles.formInput}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

ProfilePage.getLayout = (page) => page;
