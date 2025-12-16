import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/CourseCard.module.css';

export default function CourseCard({ course }) {
    const { addToCart, isInCart } = useCart();
    const { isAuthenticated } = useAuth();

    const {
        id,
        title,
        slug,
        short_description,
        description,
        price,
        original_price,
        level,
        duration,
        thumbnail,
        instructor_name,
        rating_avg,
        rating_count,
        enrollment_count,
        category
    } = course;

    const formatDuration = (minutes) => {
        if (!minutes) return 'Self-paced';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            window.location.href = '/login?redirect=' + encodeURIComponent(`/courses/${slug || id}`);
            return;
        }

        await addToCart(course);
    };

    const discount = original_price && original_price > price
        ? Math.round(((original_price - price) / original_price) * 100)
        : 0;

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<span key={i} className="star">★</span>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<span key={i} className="star">★</span>);
            } else {
                stars.push(<span key={i} className="star-empty">★</span>);
            }
        }
        return stars;
    };

    return (
        <Link href={`/courses/${slug || id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img
                    src={thumbnail || '/images/course-placeholder.jpg'}
                    alt={title}
                    className={styles.image}
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop';
                    }}
                />
                {discount > 0 && (
                    <span className={styles.discountBadge}>{discount}% OFF</span>
                )}
                <span className={`badge ${styles.levelBadge} badge-${level}`}>
                    {level}
                </span>
            </div>

            <div className={styles.content}>
                {category && (
                    <span className={styles.category}>{category}</span>
                )}

                <h3 className={styles.title}>{title}</h3>

                <p className={styles.description}>
                    {short_description || description?.substring(0, 100)}
                </p>

                {instructor_name && (
                    <p className={styles.instructor}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        {instructor_name}
                    </p>
                )}

                <div className={styles.meta}>
                    <div className={styles.rating}>
                        <span className={styles.ratingValue}>{(rating_avg || 0).toFixed(1)}</span>
                        <div className="stars">{renderStars(rating_avg || 0)}</div>
                        <span className={styles.ratingCount}>({rating_count || 0})</span>
                    </div>
                    <div className={styles.stats}>
                        <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formatDuration(duration)}
                        </span>
                        <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            {enrollment_count || 0}
                        </span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.pricing}>
                        <span className={styles.price}>{formatPrice(price)}</span>
                        {original_price && original_price > price && (
                            <span className={styles.originalPrice}>{formatPrice(original_price)}</span>
                        )}
                    </div>
                    <button
                        className={`btn btn-primary btn-sm ${styles.cartBtn}`}
                        onClick={handleAddToCart}
                        disabled={isInCart(id)}
                    >
                        {isInCart(id) ? 'In Cart' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </Link>
    );
}
