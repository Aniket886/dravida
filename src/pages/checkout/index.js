import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from '../../styles/Checkout.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CheckoutPage() {
    const router = useRouter();
    const { coupon, discount } = router.query;
    const { isAuthenticated, token, user } = useAuth();
    const { items, total, clearCart } = useCart();
    const [utrNumber, setUtrNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentCreated, setPaymentCreated] = useState(false);
    const [paymentId, setPaymentId] = useState(null);

    // Calculate discounted total
    const discountPercent = discount ? parseInt(discount) : 0;
    const discountAmount = (total * discountPercent) / 100;
    const finalTotal = total - discountAmount;

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/checkout');
            return;
        }
        if (items.length === 0 && !paymentCreated) {
            router.push('/cart');
        }
    }, [isAuthenticated, items, paymentCreated]);

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setError('');

        if (!utrNumber.trim()) {
            setError('Please enter UTR Number');
            return;
        }
        if (!transactionId.trim()) {
            setError('Please enter Transaction ID');
            return;
        }

        setLoading(true);

        try {
            const courseIds = items.map(item => item.course_id || item.id);

            // Create payment with UTR - use final discounted amount
            const response = await fetch(`${API_URL}/payments/submit-utr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseIds,
                    utrNumber: utrNumber.trim(),
                    transactionId: transactionId.trim(),
                    amount: finalTotal,
                    couponCode: coupon || null,
                    discountPercent: discountPercent || 0
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPaymentId(data.paymentId);
                setPaymentCreated(true);
                clearCart();
                router.push(`/checkout/pending?payment_id=${data.paymentId}`);
            } else {
                setError(data.error || 'Failed to submit payment');
            }
        } catch (error) {
            console.error('Submit payment error:', error);
            setError('Failed to submit payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated || (items.length === 0 && !paymentCreated)) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Checkout - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className="container">
                    <h1>Complete Your Payment</h1>
                    <p className="text-secondary mb-lg">
                        Scan the QR code below to pay via UPI
                    </p>

                    <div className={styles.checkoutGrid}>
                        {/* QR Code Section */}
                        <div className={styles.qrSection}>
                            <div className={styles.qrCard}>
                                <h2>Pay via UPI</h2>
                                <div className={styles.amount}>
                                    <span className="text-secondary">Amount to Pay</span>
                                    <span className={styles.price}>{formatPrice(finalTotal)}</span>
                                    {discountPercent > 0 && (
                                        <small style={{ color: 'var(--success)', marginTop: '4px' }}>
                                            🎉 {discountPercent}% discount applied!
                                        </small>
                                    )}
                                </div>

                                <div className={styles.qrContainer}>
                                    <img
                                        src="/images/qr_pay.jpeg"
                                        alt="UPI QR Code for Payment"
                                        className={styles.qrImage}
                                    />
                                </div>

                                <div className={styles.instructions}>
                                    <h3>📱 Payment Instructions</h3>
                                    <ol>
                                        <li>Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
                                        <li>Scan the QR code above</li>
                                        <li>Enter the exact amount: <strong>{formatPrice(finalTotal)}</strong></li>
                                        <li>Complete the payment</li>
                                        <li>Note down your <strong>UTR Number</strong> and <strong>Transaction ID</strong></li>
                                        <li>Enter the details in the form and submit</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details Form */}
                        <div className={styles.formSection}>
                            <div className={styles.orderSummary}>
                                <h2>Order Summary</h2>
                                <div className={styles.courseList}>
                                    {items.map(item => (
                                        <div key={item.course_id || item.id} className={styles.courseItem}>
                                            <span>{item.title}</span>
                                            <span>{formatPrice(item.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Subtotal */}
                                <div className={styles.totalRow} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total)}</span>
                                </div>

                                {/* Discount Row */}
                                {discountPercent > 0 && (
                                    <div className={styles.totalRow} style={{ color: 'var(--success)' }}>
                                        <span>Coupon ({coupon}) - {discountPercent}% off</span>
                                        <span>-{formatPrice(discountAmount)}</span>
                                    </div>
                                )}

                                {/* Final Total */}
                                <div className={styles.totalRow} style={{ fontSize: '1.3rem', borderTop: '2px solid var(--border-color)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                                    <span><strong>Total</strong></span>
                                    <span className={styles.totalPrice}>{formatPrice(finalTotal)}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
                                <h2>Enter Payment Details</h2>
                                <p className="text-secondary">
                                    After completing the UPI payment, enter the details below
                                </p>

                                {error && (
                                    <div className={styles.error}>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="utrNumber">UTR Number *</label>
                                    <input
                                        type="text"
                                        id="utrNumber"
                                        className="form-input"
                                        placeholder="Enter 12-digit UTR Number"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        maxLength={20}
                                        required
                                    />
                                    <small>You can find this in your payment confirmation</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="transactionId">Transaction ID *</label>
                                    <input
                                        type="text"
                                        id="transactionId"
                                        className="form-input"
                                        placeholder="Enter Transaction/Reference ID"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        required
                                    />
                                    <small>This is shown after successful payment</small>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Payment for Verification'}
                                </button>

                                <p className={styles.note}>
                                    ⏱️ Your payment will be verified within 24 hours.
                                    Once verified, you'll get instant access to your courses.
                                </p>
                            </form>

                            <Link href="/cart" className={styles.backLink}>
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
