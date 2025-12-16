import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Admin.module.css';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/login?redirect=/admin');
        }
    }, [loading, isAuthenticated, user]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/payments', label: 'Payments', icon: '💰' },
        { href: '/admin/courses', label: 'Courses', icon: '📚' },
        { href: '/admin/students', label: 'Students', icon: '👥' },
        { href: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
    ];

    return (
        <>
            <Head>
                <title>{title} - Cyber Dravida Admin</title>
            </Head>

            <div className={styles.adminContainer}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <Link href="/admin" className={styles.logo}>
                            <span className={styles.logoIcon}>🛡️</span>
                            <span>Admin Panel</span>
                        </Link>
                    </div>

                    <nav className={styles.nav}>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${router.pathname === item.href ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <Link href="/" className={styles.navItem}>
                            <span className={styles.navIcon}>🌐</span>
                            <span>View Site</span>
                        </Link>
                        <div className={styles.adminInfo}>
                            <span className={styles.adminAvatar}>{user?.name?.charAt(0) || 'A'}</span>
                            <div>
                                <strong>{user?.name}</strong>
                                <small>Administrator</small>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    <header className={styles.header}>
                        <h1>{title}</h1>
                    </header>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
