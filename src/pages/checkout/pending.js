import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Checkout.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CheckoutPendingPage() {
    const router = useRouter();
    const { payment_id } = router.query;
    const { isAuthenticated, token } = useAuth();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (payment_id) {
            fetchPaymentStatus();
        }
    }, [isAuthenticated, payment_id]);

    const fetchPaymentStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/payments/${payment_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPayment(data);
            }
        } catch (error) {
            console.error('Failed to fetch payment status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
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
                <title>Payment Pending - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className="container">
                    <div className={styles.pendingCard}>
                        <div className={styles.pendingIcon}>⏳</div>
                        <h1>Payment Verification Pending</h1>
                        <p>
                            Thank you for your payment! We've received your transaction details
                            and our team is verifying it.
                        </p>

                        {payment_id && (
                            <div className={styles.orderId}>
                                Order ID: <strong>{payment_id.slice(0, 8)}...</strong>
                            </div>
                        )}

                        <div className={styles.timeline}>
                            <h3>What happens next?</h3>
                            <ul>
                                <li className="active">
                                    ✓ Payment submission received
                                </li>
                                <li>
                                    Our team will verify your UTR & Transaction ID
                                </li>
                                <li>
                                    You'll receive email confirmation once verified
                                </li>
                                <li>
                                    Your courses will be unlocked automatically
                                </li>
                            </ul>
                        </div>

                        <p>
                            ⏱️ <strong>Verification typically takes 2-24 hours</strong>
                            <br />
                            <small>For urgent queries, contact support@cyberdravida.com</small>
                        </p>

                        <div className={styles.actions}>
                            <Link href="/dashboard" className="btn btn-primary">
                                Go to Dashboard
                            </Link>
                            <Link href="/courses" className="btn btn-secondary">
                                Browse More Courses
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CheckoutPendingPage.getLayout = (page) => page;
