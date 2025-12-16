import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import VideoPlayer, { detectVideoType } from '../../../components/VideoPlayer';
import styles from '../../../styles/Learn.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LearnPage() {
    const router = useRouter();
    const { slug } = router.query;
    const { token, isAuthenticated, loading: authLoading } = useAuth();

    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (slug && token) {
            fetchCourseData();
        }
    }, [slug, token]);

    const fetchCourseData = async () => {
        try {
            // Fetch course details
            const courseRes = await fetch(`${API_URL}/courses/${slug}`);
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                setCourse(courseData);
            }

            // Fetch enrollment to get progress
            const enrollRes = await fetch(`${API_URL}/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (enrollRes.ok) {
                const enrollments = await enrollRes.json();
                const found = enrollments.find(e => e.course_id === slug || e.slug === slug);
                if (found) {
                    setEnrollment(found);
                }
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProgress = async (lessonIndex) => {
        if (!enrollment || !course) return;

        const totalLessons = course.curriculum?.length || 10;
        const newProgress = Math.round(((lessonIndex + 1) / totalLessons) * 100);

        try {
            await fetch(`${API_URL}/enrollments/${enrollment.id}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ progress: newProgress })
            });

            setEnrollment(prev => ({ ...prev, progress: newProgress }));
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    const markComplete = () => {
        updateProgress(currentLesson);
        if (currentLesson < (course?.curriculum?.length || 10) - 1) {
            setCurrentLesson(prev => prev + 1);
        }
    };

    // Sample curriculum if none exists
    const curriculum = course?.curriculum || [
        { title: 'Introduction to the Course', duration: '5:00', type: 'video' },
        { title: 'Core Concepts Overview', duration: '12:30', type: 'video' },
        { title: 'Hands-on Lab Setup', duration: '8:45', type: 'lab' },
        { title: 'Practical Exercise 1', duration: '15:00', type: 'practice' },
        { title: 'Advanced Techniques', duration: '20:00', type: 'video' },
        { title: 'Security Best Practices', duration: '10:30', type: 'video' },
        { title: 'Real-world Case Studies', duration: '18:00', type: 'video' },
        { title: 'Final Assessment', duration: '30:00', type: 'quiz' },
    ];

    if (loading || authLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className={styles.error}>
                <h2>Course Not Found</h2>
                <p>The course you're looking for doesn't exist or you don't have access.</p>
                <Link href="/dashboard/my-courses" className="btn btn-primary">
                    Back to My Courses
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{course.title} - Learn | Cyber Dravida</title>
            </Head>

            <div className={styles.learnLayout}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <Link href="/dashboard/my-courses" className={styles.backBtn}>
                            ← Back
                        </Link>
                        <button
                            className={styles.toggleBtn}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? '◀' : '▶'}
                        </button>
                    </div>

                    <div className={styles.courseInfo}>
                        <h2>{course.title}</h2>
                        <div className={styles.progressSection}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${enrollment?.progress || 0}%` }}
                                ></div>
                            </div>
                            <span>{enrollment?.progress || 0}% complete</span>
                        </div>
                    </div>

                    <nav className={styles.lessonList}>
                        <h3>Course Content</h3>
                        {curriculum.map((lesson, index) => (
                            <button
                                key={index}
                                className={`${styles.lessonItem} ${currentLesson === index ? styles.active : ''} ${index < (enrollment?.progress / 100 * curriculum.length) ? styles.completed : ''}`}
                                onClick={() => setCurrentLesson(index)}
                            >
                                <span className={styles.lessonNumber}>
                                    {index < (enrollment?.progress / 100 * curriculum.length) ? '✓' : index + 1}
                                </span>
                                <span className={styles.lessonTitle}>{lesson.title}</span>
                                <span className={styles.lessonDuration}>{lesson.duration}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    {/* Video/Content Area */}
                    <div className={styles.contentArea}>
                        <div className={styles.videoContainer}>
                            {/* Placeholder video player */}
                            <div className={styles.videoPlaceholder}>
                                <span>🎬</span>
                                <h3>{curriculum[currentLesson]?.title}</h3>
                                <p>Video content would play here</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Duration: {curriculum[currentLesson]?.duration}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lesson Info */}
                    <div className={styles.lessonInfo}>
                        <div className={styles.lessonHeader}>
                            <div>
                                <span className={styles.lessonTag}>
                                    {curriculum[currentLesson]?.type === 'video' && '🎥 Video Lesson'}
                                    {curriculum[currentLesson]?.type === 'lab' && '🔬 Lab Exercise'}
                                    {curriculum[currentLesson]?.type === 'practice' && '💻 Practice'}
                                    {curriculum[currentLesson]?.type === 'quiz' && '📝 Quiz'}
                                </span>
                                <h2>{curriculum[currentLesson]?.title}</h2>
                            </div>
                            <div className={styles.lessonActions}>
                                {currentLesson > 0 && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentLesson(prev => prev - 1)}
                                    >
                                        ← Previous
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={markComplete}
                                >
                                    {currentLesson === curriculum.length - 1
                                        ? '✅ Complete Course'
                                        : 'Mark Complete & Next →'
                                    }
                                </button>
                            </div>
                        </div>

                        <div className={styles.lessonContent}>
                            <h3>About This Lesson</h3>
                            <p>
                                This lesson covers important concepts related to {course.title}.
                                Watch the video above and complete the exercises to progress through the course.
                            </p>

                            <h3>Key Takeaways</h3>
                            <ul>
                                <li>Understanding core cybersecurity principles</li>
                                <li>Hands-on practical exercises</li>
                                <li>Real-world application scenarios</li>
                                <li>Best practices and techniques</li>
                            </ul>

                            <h3>Resources</h3>
                            <div className={styles.resources}>
                                <a href="#" className={styles.resourceItem}>
                                    📄 Lesson Notes (PDF)
                                </a>
                                <a href="#" className={styles.resourceItem}>
                                    🔗 Additional Reading
                                </a>
                                <a href="#" className={styles.resourceItem}>
                                    💾 Lab Files
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

LearnPage.getLayout = (page) => page;
