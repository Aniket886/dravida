import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import styles from '../styles/Cart.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CartPage() {
    const router = useRouter();
    const { isAuthenticated, token } = useAuth();
    const { items, total, removeFromCart, clearCart, refreshCart } = useCart();
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            refreshCart();
        }
    }, [isAuthenticated]);

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');

        try {
            const response = await fetch(`${API_URL}/payments/validate-coupon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: couponCode })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setCouponDiscount({
                    code: data.code,
                    percent: data.discountPercent
                });
            } else {
                setCouponError(data.error || 'Invalid coupon code');
            }
        } catch (error) {
            setCouponError('Failed to validate coupon');
        }
    };

    const removeCoupon = () => {
        setCouponDiscount(null);
        setCouponCode('');
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/cart');
            return;
        }

        // Redirect to QR checkout page with coupon info if applied
        if (couponDiscount) {
            router.push(`/checkout?coupon=${couponDiscount.code}&discount=${couponDiscount.percent}`);
        } else {
            router.push('/checkout');
        }
    };

    const discountAmount = couponDiscount ? (total * couponDiscount.percent) / 100 : 0;
    const finalTotal = total - discountAmount;

    return (
        <>
            <Head>
                <title>Shopping Cart - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className="container">
                    <h1>Shopping Cart</h1>
                    <p className="text-secondary mb-xl">{items.length} course(s) in cart</p>

                    {items.length === 0 ? (
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>🛒</span>
                            <h2>Your cart is empty</h2>
                            <p>Looks like you haven't added any courses yet.</p>
                            <Link href="/courses" className="btn btn-primary btn-lg">
                                Browse Courses
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.content}>
                            {/* Cart Items */}
                            <div className={styles.cartItems}>
                                {items.map(item => (
                                    <div key={item.course_id} className={styles.cartItem}>
                                        <img
                                            src={item.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150'}
                                            alt={item.title}
                                            className={styles.itemImage}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150';
                                            }}
                                        />
                                        <div className={styles.itemInfo}>
                                            <Link href={`/courses/${item.slug || item.course_id}`}>
                                                <h3>{item.title}</h3>
                                            </Link>
                                            <p>{item.instructor_name || 'Cyber Dravida'}</p>
                                            <span className={`badge badge-${item.level}`}>
                                                {item.level}
                                            </span>
                                        </div>
                                        <div className={styles.itemPrice}>
                                            <span className={styles.price}>{formatPrice(item.price)}</span>
                                            {item.original_price > item.price && (
                                                <span className={styles.originalPrice}>
                                                    {formatPrice(item.original_price)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeFromCart(item.course_id)}
                                            title="Remove from cart"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className={styles.summary}>
                                <h2>Order Summary</h2>

                                {/* Coupon */}
                                <div className={styles.couponSection}>
                                    {couponDiscount ? (
                                        <div className={styles.appliedCoupon}>
                                            <span>🎉 {couponDiscount.code} applied!</span>
                                            <button onClick={removeCoupon}>Remove</button>
                                        </div>
                                    ) : (
                                        <div className={styles.couponInput}>
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="form-input"
                                            />
                                            <button onClick={applyCoupon} className="btn btn-secondary">
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                    {couponError && (
                                        <p className={styles.couponError}>{couponError}</p>
                                    )}
                                </div>

                                <div className={styles.summaryRows}>
                                    <div className={styles.summaryRow}>
                                        <span>Subtotal</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                    {couponDiscount && (
                                        <div className={`${styles.summaryRow} ${styles.discount}`}>
                                            <span>Discount ({couponDiscount.percent}%)</span>
                                            <span>-{formatPrice(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.summaryRow} ${styles.total}`}>
                                        <span>Total</span>
                                        <span>{formatPrice(finalTotal)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Proceed to Checkout'}
                                </button>

                                <button
                                    onClick={clearCart}
                                    className={styles.clearBtn}
                                >
                                    Clear Cart
                                </button>

                                <p className={styles.guarantee}>
                                    🔒 30-day money-back guarantee
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
