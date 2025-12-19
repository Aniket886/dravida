import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/MyCourses.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function MyCoursesPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading, token } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard/my-courses');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (token) {
            fetchEnrollments();
            fetchPendingPayments();
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

    const fetchPendingPayments = async () => {
        try {
            const response = await fetch(`${API_URL}/payments/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const pending = data.filter(p => p.status === 'pending_verification');
                setPendingPayments(pending);
            }
        } catch (error) {
            console.error('Failed to fetch pending payments:', error);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'Self-paced';
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredEnrollments = enrollments.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'in-progress') return e.status === 'active' && e.progress > 0;
        if (filter === 'completed') return e.status === 'completed';
        if (filter === 'not-started') return e.progress === 0;
        return true;
    });

    if (authLoading || !isAuthenticated) {
        return <div className={styles.loading}><div className="spinner"></div></div>;
    }

    return (
        <>
            <Head>
                <title>My Courses - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className="container">
                    {/* Pending Payments Alert */}
                    {pendingPayments.length > 0 && (
                        <div className={styles.pendingAlert}>
                            <div className={styles.pendingIcon}>⏳</div>
                            <div className={styles.pendingContent}>
                                <h3>Payment Under Verification</h3>
                                <p>
                                    You have {pendingPayments.length} payment(s) waiting for verification.
                                    Once verified, your courses will appear here.
                                </p>
                                <div className={styles.pendingPaymentsList}>
                                    {pendingPayments.map(payment => (
                                        <div key={payment.id} className={styles.pendingPaymentItem}>
                                            <div>
                                                <strong>{payment.course_titles || 'Course Purchase'}</strong>
                                                <span className={styles.pendingDate}>
                                                    Submitted: {formatDate(payment.created_at)}
                                                </span>
                                            </div>
                                            <div className={styles.pendingAmount}>
                                                {formatPrice(payment.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className={styles.pendingNote}>
                                    ⏱️ Verification typically takes 2-24 hours. We'll notify you once your payment is verified.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={styles.header}>
                        <h1>My Courses</h1>
                        <div className={styles.filters}>
                            <button
                                className={filter === 'all' ? styles.active : ''}
                                onClick={() => setFilter('all')}
                            >
                                All ({enrollments.length})
                            </button>
                            <button
                                className={filter === 'in-progress' ? styles.active : ''}
                                onClick={() => setFilter('in-progress')}
                            >
                                In Progress
                            </button>
                            <button
                                className={filter === 'completed' ? styles.active : ''}
                                onClick={() => setFilter('completed')}
                            >
                                Completed
                            </button>
                            <button
                                className={filter === 'not-started' ? styles.active : ''}
                                onClick={() => setFilter('not-started')}
                            >
                                Not Started
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loading}><div className="spinner"></div></div>
                    ) : filteredEnrollments.length > 0 ? (
                        <div className={styles.grid}>
                            {filteredEnrollments.map(enrollment => (
                                <div key={enrollment.id} className={styles.card}>
                                    <Link href={`/dashboard/learn/${enrollment.slug || enrollment.course_id}`}>
                                        <img
                                            src={enrollment.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400'}
                                            alt={enrollment.title}
                                            className={styles.thumbnail}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400';
                                            }}
                                        />
                                    </Link>
                                    <div className={styles.content}>
                                        <span className={`badge badge-${enrollment.level}`}>{enrollment.level}</span>
                                        <Link href={`/dashboard/learn/${enrollment.slug || enrollment.course_id}`}>
                                            <h3>{enrollment.title}</h3>
                                        </Link>
                                        <p className={styles.meta}>
                                            <span>{formatDuration(enrollment.duration)}</span>
                                            <span>•</span>
                                            <span>{enrollment.totalLessons || 0} lessons</span>
                                        </p>

                                        <div className={styles.progress}>
                                            <div className={styles.progressInfo}>
                                                <span>{Math.round(enrollment.progress || 0)}% complete</span>
                                                <span>{enrollment.completedLessons || 0}/{enrollment.totalLessons || 0} lessons</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/dashboard/learn/${enrollment.slug || enrollment.course_id}`}
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                        >
                                            {enrollment.progress > 0 ? 'Continue Learning' : 'Start Course'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <span>📚</span>
                            <h2>No courses found</h2>
                            <p>
                                {filter !== 'all'
                                    ? 'Try changing the filter to see more courses.'
                                    : pendingPayments.length > 0
                                        ? 'Your courses will appear here once payment is verified.'
                                        : "You haven't enrolled in any courses yet."
                                }
                            </p>
                            <Link href="/courses" className="btn btn-primary">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

