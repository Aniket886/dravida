import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from '../../styles/CourseDetails.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function CourseDetailsPage() {
    const router = useRouter();
    const { id } = router.query;
    const { isAuthenticated, token } = useAuth();
    const { addToCart, isInCart } = useCart();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedModules, setExpandedModules] = useState([]);

    useEffect(() => {
        if (id) {
            fetchCourse();
        }
    }, [id, token]);

    const fetchCourse = async () => {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/courses/${id}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setCourse(data);
                if (data.modules?.length > 0) {
                    setExpandedModules([data.modules[0].id]);
                }
            } else {
                router.push('/courses');
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'Self-paced';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} minutes`;
        if (mins === 0) return `${hours} hours`;
        return `${hours}h ${mins}m`;
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }
        await addToCart(course);
    };

    const handleEnrollNow = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }
        if (isInCart(course.id)) {
            router.push('/cart');
        } else {
            addToCart(course).then(() => router.push('/cart'));
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className={i < Math.floor(rating) ? 'star' : 'star-empty'}>
                    ★
                </span>
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className={styles.notFound}>
                <h1>Course Not Found</h1>
                <p>The course you're looking for doesn't exist or has been removed.</p>
                <Link href="/courses" className="btn btn-primary">
                    Browse Courses
                </Link>
            </div>
        );
    }

    const discount = course.original_price && course.original_price > course.price
        ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
        : 0;

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

    return (
        <>
            <Head>
                <title>{course.title} - Cyber Dravida</title>
                <meta name="description" content={course.short_description || course.description?.substring(0, 160)} />
            </Head>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroGrid}>
                        <div className={styles.heroContent}>
                            <div className={styles.breadcrumb}>
                                <Link href="/">Home</Link>
                                <span>/</span>
                                <Link href="/courses">Courses</Link>
                                <span>/</span>
                                <span>{course.category}</span>
                            </div>

                            <h1>{course.title}</h1>
                            <p className={styles.shortDesc}>{course.short_description || course.description}</p>

                            <div className={styles.meta}>
                                <div className={styles.rating}>
                                    <span className={styles.ratingValue}>{(course.rating_avg || 0).toFixed(1)}</span>
                                    <div className="stars">{renderStars(course.rating_avg || 0)}</div>
                                    <span>({course.rating_count || 0} reviews)</span>
                                </div>
                                <span className={styles.students}>
                                    {course.enrollment_count || 0} students enrolled
                                </span>
                            </div>

                            <div className={styles.instructor}>
                                <div className={styles.instructorAvatar}>
                                    {course.instructor_name?.charAt(0) || 'I'}
                                </div>
                                <div>
                                    <span>Instructor</span>
                                    <strong>{course.instructor_name || 'Cyber Dravida'}</strong>
                                </div>
                            </div>

                            <div className={styles.stats}>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>📚</span>
                                    <span>{course.modules?.length || 0} Modules</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>📖</span>
                                    <span>{totalLessons} Lessons</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>⏱️</span>
                                    <span>{formatDuration(course.duration)}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>📊</span>
                                    <span style={{ textTransform: 'capitalize' }}>{course.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className={styles.pricingCard}>
                            <img
                                src={course.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400'}
                                alt={course.title}
                                className={styles.thumbnail}
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400';
                                }}
                            />

                            <div className={styles.pricing}>
                                <div className={styles.priceRow}>
                                    <span className={styles.price}>{formatPrice(course.price)}</span>
                                    {course.original_price > course.price && (
                                        <>
                                            <span className={styles.originalPrice}>
                                                {formatPrice(course.original_price)}
                                            </span>
                                            <span className={styles.discount}>{discount}% off</span>
                                        </>
                                    )}
                                </div>

                                {course.isEnrolled ? (
                                    <Link
                                        href={`/dashboard/learn/${course.slug || course.id}`}
                                        className="btn btn-primary btn-lg"
                                        style={{ width: '100%' }}
                                    >
                                        Continue Learning
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEnrollNow}
                                            className="btn btn-primary btn-lg"
                                            style={{ width: '100%' }}
                                        >
                                            Enroll Now
                                        </button>
                                        <button
                                            onClick={handleAddToCart}
                                            className="btn btn-secondary"
                                            style={{ width: '100%' }}
                                            disabled={isInCart(course.id)}
                                        >
                                            {isInCart(course.id) ? 'Added to Cart' : 'Add to Cart'}
                                        </button>
                                    </>
                                )}

                                <ul className={styles.includes}>
                                    <li>✓ Full lifetime access</li>
                                    <li>✓ Access on mobile and desktop</li>
                                    <li>✓ Certificate of completion</li>
                                    <li>✓ Downloadable resources</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className={styles.content}>
                <div className="container">
                    <div className={styles.contentGrid}>
                        <div className={styles.mainContent}>
                            {/* Tabs */}
                            <div className={styles.tabs}>
                                <button
                                    className={activeTab === 'overview' ? styles.activeTab : ''}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    className={activeTab === 'curriculum' ? styles.activeTab : ''}
                                    onClick={() => setActiveTab('curriculum')}
                                >
                                    Curriculum
                                </button>
                                <button
                                    className={activeTab === 'reviews' ? styles.activeTab : ''}
                                    onClick={() => setActiveTab('reviews')}
                                >
                                    Reviews
                                </button>
                            </div>

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className={styles.tabContent}>
                                    <h2>About This Course</h2>
                                    <div className={styles.description}>
                                        {course.description?.split('\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>

                                    <h3>What You'll Learn</h3>
                                    <ul className={styles.learningOutcomes}>
                                        <li>Master fundamental concepts and techniques</li>
                                        <li>Hands-on practice with real-world scenarios</li>
                                        <li>Industry-standard tools and methodologies</li>
                                        <li>Build a professional portfolio</li>
                                        <li>Prepare for industry certifications</li>
                                    </ul>
                                </div>
                            )}

                            {/* Curriculum Tab */}
                            {activeTab === 'curriculum' && (
                                <div className={styles.tabContent}>
                                    <h2>Course Curriculum</h2>
                                    <p className="text-secondary mb-lg">
                                        {course.modules?.length || 0} modules • {totalLessons} lessons • {formatDuration(course.duration)}
                                    </p>

                                    <div className={styles.modules}>
                                        {course.modules?.map((module, index) => (
                                            <div key={module.id} className={styles.module}>
                                                <button
                                                    className={styles.moduleHeader}
                                                    onClick={() => toggleModule(module.id)}
                                                >
                                                    <span className={styles.moduleNumber}>{index + 1}</span>
                                                    <div className={styles.moduleInfo}>
                                                        <strong>{module.title}</strong>
                                                        <span>{module.lessons?.length || 0} lessons</span>
                                                    </div>
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        className={expandedModules.includes(module.id) ? styles.rotated : ''}
                                                    >
                                                        <path d="M6 9l6 6 6-6"></path>
                                                    </svg>
                                                </button>

                                                {expandedModules.includes(module.id) && (
                                                    <ul className={styles.lessons}>
                                                        {module.lessons?.map((lesson) => (
                                                            <li key={lesson.id} className={styles.lesson}>
                                                                <span className={styles.lessonIcon}>
                                                                    {lesson.is_preview ? '▶️' : '🔒'}
                                                                </span>
                                                                <span className={styles.lessonTitle}>{lesson.title}</span>
                                                                <span className={styles.lessonDuration}>
                                                                    {Math.round((lesson.duration || 0) / 60)}m
                                                                </span>
                                                                {lesson.is_preview && (
                                                                    <span className={styles.previewBadge}>Preview</span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviews Tab */}
                            {activeTab === 'reviews' && (
                                <div className={styles.tabContent}>
                                    <h2>Student Reviews</h2>

                                    <div className={styles.reviewsSummary}>
                                        <div className={styles.ratingBig}>
                                            <span className={styles.ratingNumber}>{(course.rating_avg || 0).toFixed(1)}</span>
                                            <div className="stars" style={{ fontSize: '1.5rem' }}>
                                                {renderStars(course.rating_avg || 0)}
                                            </div>
                                            <span>{course.rating_count || 0} reviews</span>
                                        </div>
                                    </div>

                                    {course.reviews?.length > 0 ? (
                                        <div className={styles.reviewsList}>
                                            {course.reviews.map(review => (
                                                <div key={review.id} className={styles.review}>
                                                    <div className={styles.reviewHeader}>
                                                        <div className={styles.reviewerAvatar}>
                                                            {review.user_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <strong>{review.user_name}</strong>
                                                            <div className="stars">{renderStars(review.rating)}</div>
                                                        </div>
                                                        <span className={styles.reviewDate}>
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p>{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-secondary">No reviews yet. Be the first to review!</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Related Courses */}
                        {course.relatedCourses?.length > 0 && (
                            <aside className={styles.sidebar}>
                                <h3>Related Courses</h3>
                                <div className={styles.relatedCourses}>
                                    {course.relatedCourses.map(related => (
                                        <Link
                                            key={related.id}
                                            href={`/courses/${related.slug || related.id}`}
                                            className={styles.relatedCard}
                                        >
                                            <img
                                                src={related.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100'}
                                                alt={related.title}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100';
                                                }}
                                            />
                                            <div>
                                                <strong>{related.title}</strong>
                                                <span>{formatPrice(related.price)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
