import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CourseCard from '../../components/CourseCard';
import styles from '../../styles/Courses.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    // Filters
    const [filters, setFilters] = useState({
        category: '',
        level: '',
        sort: 'newest',
        search: '',
        minPrice: '',
        maxPrice: ''
    });

    useEffect(() => {
        // Set filters from URL query
        if (router.isReady) {
            setFilters(prev => ({
                ...prev,
                category: router.query.category || '',
                level: router.query.level || '',
                sort: router.query.sort || 'newest',
                search: router.query.search || ''
            }));
        }
    }, [router.isReady, router.query]);

    useEffect(() => {
        fetchCourses();
        fetchCategories();
    }, [filters, pagination.page]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.category) params.append('category', filters.category);
            if (filters.level) params.append('level', filters.level);
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.search) params.append('search', filters.search);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            params.append('page', pagination.page);
            params.append('limit', 12);

            const response = await fetch(`${API_URL}/courses?${params}`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
                setPagination(prev => ({
                    ...prev,
                    totalPages: data.pagination?.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/courses/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));

        // Update URL
        const params = new URLSearchParams(router.query);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/courses?${params.toString()}`, undefined, { shallow: true });
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            level: '',
            sort: 'newest',
            search: '',
            minPrice: '',
            maxPrice: ''
        });
        router.push('/courses');
    };

    const levels = ['beginner', 'intermediate', 'advanced'];
    const sortOptions = [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'popular', label: 'Most Popular' }
    ];

    const hasActiveFilters = filters.category || filters.level || filters.search;

    return (
        <>
            <Head>
                <title>Courses - Cyber Dravida | Cybersecurity Training</title>
                <meta name="description" content="Browse our comprehensive cybersecurity courses. From OSINT to ethical hacking, find the perfect course to advance your career." />
            </Head>

            <div className={styles.page}>
                {/* Header */}
                <section className={styles.header}>
                    <div className="container">
                        <h1>Explore Our Courses</h1>
                        <p>Master cybersecurity with our expert-led training programs</p>

                        {/* Search Bar */}
                        <div className={styles.searchBar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className={styles.searchInput}
                            />
                            {filters.search && (
                                <button
                                    className={styles.clearSearch}
                                    onClick={() => handleFilterChange('search', '')}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="container">
                    <div className={styles.content}>
                        {/* Sidebar Filters */}
                        <aside className={styles.sidebar}>
                            <div className={styles.filterSection}>
                                <div className={styles.filterHeader}>
                                    <h3>Filters</h3>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className={styles.clearBtn}>
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Categories */}
                                <div className={styles.filterGroup}>
                                    <h4>Category</h4>
                                    <div className={styles.filterOptions}>
                                        <label className={styles.filterOption}>
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={!filters.category}
                                                onChange={() => handleFilterChange('category', '')}
                                            />
                                            <span>All Categories</span>
                                        </label>
                                        {categories.map(cat => (
                                            <label key={cat.category} className={styles.filterOption}>
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    checked={filters.category === cat.category}
                                                    onChange={() => handleFilterChange('category', cat.category)}
                                                />
                                                <span>{cat.category}</span>
                                                <span className={styles.count}>({cat.count})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Levels */}
                                <div className={styles.filterGroup}>
                                    <h4>Level</h4>
                                    <div className={styles.filterOptions}>
                                        <label className={styles.filterOption}>
                                            <input
                                                type="radio"
                                                name="level"
                                                checked={!filters.level}
                                                onChange={() => handleFilterChange('level', '')}
                                            />
                                            <span>All Levels</span>
                                        </label>
                                        {levels.map(level => (
                                            <label key={level} className={styles.filterOption}>
                                                <input
                                                    type="radio"
                                                    name="level"
                                                    checked={filters.level === level}
                                                    onChange={() => handleFilterChange('level', level)}
                                                />
                                                <span style={{ textTransform: 'capitalize' }}>{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className={styles.main}>
                            {/* Toolbar */}
                            <div className={styles.toolbar}>
                                <p className={styles.resultCount}>
                                    {loading ? 'Loading...' : `${courses.length} courses found`}
                                </p>
                                <div className={styles.sortWrapper}>
                                    <label>Sort by:</label>
                                    <select
                                        value={filters.sort}
                                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                                        className="form-input form-select"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Filters */}
                            {hasActiveFilters && (
                                <div className={styles.activeFilters}>
                                    {filters.category && (
                                        <span className={styles.filterTag}>
                                            {filters.category}
                                            <button onClick={() => handleFilterChange('category', '')}>×</button>
                                        </span>
                                    )}
                                    {filters.level && (
                                        <span className={styles.filterTag}>
                                            {filters.level}
                                            <button onClick={() => handleFilterChange('level', '')}>×</button>
                                        </span>
                                    )}
                                    {filters.search && (
                                        <span className={styles.filterTag}>
                                            Search: "{filters.search}"
                                            <button onClick={() => handleFilterChange('search', '')}>×</button>
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Course Grid */}
                            {loading ? (
                                <div className={styles.grid}>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className={styles.skeleton}></div>
                                    ))}
                                </div>
                            ) : courses.length > 0 ? (
                                <div className={styles.grid}>
                                    {courses.map(course => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.empty}>
                                    <span className={styles.emptyIcon}>📚</span>
                                    <h3>No courses found</h3>
                                    <p>Try adjusting your filters or search terms</p>
                                    <button onClick={clearFilters} className="btn btn-primary">
                                        Clear Filters
                                    </button>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && pagination.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        className="btn btn-secondary"
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        className="btn btn-secondary"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
