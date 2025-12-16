import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import CourseCard from '../components/CourseCard';
import styles from '../styles/Home.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function Home() {
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/courses/featured`),
                fetch(`${API_URL}/courses/categories`)
            ]);

            if (coursesRes.ok) {
                const courses = await coursesRes.json();
                setFeaturedCourses(courses);
            }

            if (categoriesRes.ok) {
                const cats = await categoriesRes.json();
                setCategories(cats);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { value: '10,000+', label: 'Students Trained' },
        { value: '50+', label: 'Expert Courses' },
        { value: '98%', label: 'Success Rate' },
        { value: '24/7', label: 'Support' }
    ];

    const features = [
        {
            icon: '🎯',
            title: 'Hands-on Labs',
            description: 'Practice in real-world environments with guided labs and exercises.'
        },
        {
            icon: '🏆',
            title: 'Industry Certifications',
            description: 'Earn certificates recognized by top cybersecurity employers.'
        },
        {
            icon: '👨‍🏫',
            title: 'Expert Instructors',
            description: 'Learn from active security professionals with years of experience.'
        },
        {
            icon: '📱',
            title: 'Learn Anywhere',
            description: 'Access courses on any device, anytime, at your own pace.'
        }
    ];

    return (
        <>
            <Head>
                <title>Cyber Dravida - Premier Cybersecurity Training Platform</title>
                <meta name="description" content="Master cybersecurity with expert-led courses. Learn OSINT, ethical hacking, network security, and more. Start your cybersecurity journey today!" />
            </Head>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGrid}></div>
                </div>
                <div className={`container ${styles.heroContent}`}>
                    <span className={styles.heroBadge}>🚀 New Courses Available</span>
                    <h1 className={styles.heroTitle}>
                        Master <span className={styles.highlight}>Cybersecurity</span><br />
                        with Expert Training
                    </h1>
                    <p className={styles.heroText}>
                        Join thousands of security professionals learning OSINT, Ethical Hacking,
                        Network Security, and more. Advance your career with industry-recognized certifications.
                    </p>
                    <div className={styles.heroButtons}>
                        <Link href="/courses" className="btn btn-primary btn-lg">
                            Explore Courses
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7"></path>
                            </svg>
                        </Link>
                        <Link href="/about" className="btn btn-outline btn-lg">
                            Learn More
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        {stats.map((stat, index) => (
                            <div key={index} className={styles.statItem}>
                                <span className={styles.statValue}>{stat.value}</span>
                                <span className={styles.statLabel}>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className={`py-3xl ${styles.categories}`}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2>Explore By Category</h2>
                        <p className="text-secondary">Choose from our wide range of cybersecurity topics</p>
                    </div>
                    <div className={styles.categoryGrid}>
                        {[
                            { name: 'OSINT', icon: '🔍', color: '#3b82f6' },
                            { name: 'Ethical Hacking', icon: '💻', color: '#10b981' },
                            { name: 'Network Security', icon: '🌐', color: '#8b5cf6' },
                            { name: 'Malware Analysis', icon: '🦠', color: '#ef4444' },
                            { name: 'Bug Bounty', icon: '🐛', color: '#f59e0b' },
                            { name: 'Cloud Security', icon: '☁️', color: '#06b6d4' }
                        ].map((cat, index) => (
                            <Link
                                key={index}
                                href={`/courses?category=${encodeURIComponent(cat.name)}`}
                                className={styles.categoryCard}
                                style={{ '--accent-color': cat.color }}
                            >
                                <span className={styles.categoryIcon}>{cat.icon}</span>
                                <span className={styles.categoryName}>{cat.name}</span>
                                <span className={styles.categoryCount}>
                                    {categories.find(c => c.category === cat.name)?.count || 0} Courses
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-3xl">
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Featured Courses</h2>
                            <p className="text-secondary">Our most popular courses handpicked for you</p>
                        </div>
                        <Link href="/courses" className="btn btn-secondary">
                            View All Courses
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7"></path>
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={styles.skeleton}>
                                    <div className={styles.skeletonImage}></div>
                                    <div className={styles.skeletonContent}>
                                        <div className={styles.skeletonLine}></div>
                                        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4">
                            {featuredCourses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className={`py-3xl ${styles.features}`}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2>Why Choose Cyber Dravida?</h2>
                        <p className="text-secondary">Industry-leading cybersecurity education platform</p>
                    </div>
                    <div className="grid grid-cols-4">
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <span className={styles.featureIcon}>{feature.icon}</span>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureText}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className="container">
                    <div className={styles.ctaContent}>
                        <h2>Ready to Start Your Cybersecurity Journey?</h2>
                        <p>
                            Join thousands of students who have transformed their careers
                            with our expert-led cybersecurity courses.
                        </p>
                        <div className={styles.ctaButtons}>
                            <Link href="/signup" className="btn btn-primary btn-lg">
                                Get Started for Free
                            </Link>
                            <Link href="/courses" className="btn btn-outline btn-lg">
                                Browse All Courses
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
