import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/UserDashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function DashboardLayout({ children, title = 'Dashboard' }) {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading, logout, token } = useAuth();
    const [pendingPayments, setPendingPayments] = useState(0);
    const [enrolledCount, setEnrolledCount] = useState(0);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            // Fetch pending payments count
            const paymentsRes = await fetch(`${API_URL}/payments/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (paymentsRes.ok) {
                const payments = await paymentsRes.json();
                const pending = payments.filter(p => p.status === 'pending_verification');
                setPendingPayments(pending.length);
            }

            // Fetch enrolled count
            const enrollRes = await fetch(`${API_URL}/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (enrollRes.ok) {
                const enrollments = await enrollRes.json();
                setEnrolledCount(enrollments.length);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    };

    const menuItems = [
        { href: '/dashboard', icon: '🏠', label: 'Overview' },
        { href: '/dashboard/my-courses', icon: '📚', label: 'My Courses', badge: enrolledCount || null },
        { href: '/dashboard/payments', icon: '💳', label: 'Payments', badge: pendingPayments || null, badgeType: 'warning' },
        { href: '/dashboard/certificates', icon: '🎓', label: 'Certificates' },
        { href: '/dashboard/profile', icon: '👤', label: 'Profile' },
    ];

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
            </div>
        );
    }

    const isActive = (path) => {
        if (path === '/dashboard') {
            return router.pathname === '/dashboard';
        }
        return router.pathname.startsWith(path);
    };

    return (
        <>
            <Head>
                <title>{title} - Cyber Dravida</title>
            </Head>

            <div className={styles.layout}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <strong>{user?.name}</strong>
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    <nav className={styles.nav}>
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                                {item.badge > 0 && (
                                    <span className={`${styles.badge} ${item.badgeType === 'warning' ? styles.badgeWarning : ''}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <Link href="/courses" className={styles.navItem}>
                            <span className={styles.navIcon}>🔍</span>
                            <span className={styles.navLabel}>Browse Courses</span>
                        </Link>
                        <button onClick={logout} className={styles.logoutBtn}>
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <header className={styles.topBar}>
                        <h1>{title}</h1>
                        <div className={styles.topBarRight}>
                            {pendingPayments > 0 && (
                                <Link href="/dashboard/payments" className={styles.pendingAlert}>
                                    ⏳ {pendingPayments} payment(s) pending verification
                                </Link>
                            )}
                        </div>
                    </header>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
