import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Dashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading, token } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (token) {
            fetchEnrollments();
        }
    }, [token]);

    const fetchEnrollments = async () => {
        try {
            const response = await fetch(`${API_URL}/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
            </div>
        );
    }

    const inProgress = enrollments.filter(e => e.status === 'active' && e.progress > 0);
    const completed = enrollments.filter(e => e.status === 'completed');
    const totalHours = enrollments.reduce((acc, e) => acc + (e.duration || 0), 0) / 60;

    return (
        <>
            <Head>
                <title>Dashboard - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className="container">
                    {/* Welcome Header */}
                    <div className={styles.header}>
                        <div>
                            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                            <p>Continue your cybersecurity learning journey</p>
                        </div>
                        <Link href="/courses" className="btn btn-primary">
                            Browse More Courses
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>📚</span>
                            <div>
                                <span className={styles.statValue}>{enrollments.length}</span>
                                <span className={styles.statLabel}>Enrolled Courses</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>⏱️</span>
                            <div>
                                <span className={styles.statValue}>{Math.round(totalHours)}</span>
                                <span className={styles.statLabel}>Hours of Content</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>✅</span>
                            <div>
                                <span className={styles.statValue}>{completed.length}</span>
                                <span className={styles.statLabel}>Completed</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🏆</span>
                            <div>
                                <span className={styles.statValue}>{completed.length}</span>
                                <span className={styles.statLabel}>Certificates</span>
                            </div>
                        </div>
                    </div>

                    {/* Continue Learning */}
                    {inProgress.length > 0 && (
                        <section className={styles.section}>
                            <h2>Continue Learning</h2>
                            <div className={styles.courseGrid}>
                                {inProgress.slice(0, 3).map(enrollment => (
                                    <Link
                                        key={enrollment.id}
                                        href={`/dashboard/learn/${enrollment.slug || enrollment.course_id}`}
                                        className={styles.courseCard}
                                    >
                                        <img
                                            src={enrollment.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300'}
                                            alt={enrollment.title}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300';
                                            }}
                                        />
                                        <div className={styles.courseInfo}>
                                            <h3>{enrollment.title}</h3>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className={styles.progressText}>
                                                {Math.round(enrollment.progress || 0)}% complete
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Quick Actions */}
                    <section className={styles.section}>
                        <h2>Quick Actions</h2>
                        <div className={styles.quickActions}>
                            <Link href="/dashboard/my-courses" className={styles.actionCard}>
                                <span>📖</span>
                                <strong>My Courses</strong>
                                <span>View all enrolled courses</span>
                            </Link>
                            <Link href="/dashboard/certificates" className={styles.actionCard}>
                                <span>🎓</span>
                                <strong>Certificates</strong>
                                <span>Download your certificates</span>
                            </Link>
                            <Link href="/dashboard/payments" className={styles.actionCard}>
                                <span>💳</span>
                                <strong>Payment History</strong>
                                <span>View transactions</span>
                            </Link>
                            <Link href="/dashboard/profile" className={styles.actionCard}>
                                <span>👤</span>
                                <strong>Profile Settings</strong>
                                <span>Update your info</span>
                            </Link>
                        </div>
                    </section>

                    {/* Empty State */}
                    {enrollments.length === 0 && !loading && (
                        <div className={styles.empty}>
                            <span>🎯</span>
                            <h2>Start Your Learning Journey</h2>
                            <p>You haven't enrolled in any courses yet. Browse our catalog to find the perfect course for you.</p>
                            <Link href="/courses" className="btn btn-primary btn-lg">
                                Explore Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
