import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '../../styles/CheckoutSuccess.module.css';

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const { payment_id, session_id } = router.query;

    useEffect(() => {
        // Could verify payment here if needed
    }, [payment_id, session_id]);

    return (
        <>
            <Head>
                <title>Payment Successful - Cyber Dravida</title>
            </Head>

            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.icon}>✅</div>
                    <h1>Payment Successful!</h1>
                    <p>
                        Thank you for your purchase. Your course access has been activated.
                        You can start learning right away!
                    </p>

                    {payment_id && (
                        <p className={styles.orderId}>
                            Order ID: <strong>{payment_id}</strong>
                        </p>
                    )}

                    <div className={styles.actions}>
                        <Link href="/dashboard/my-courses" className="btn btn-primary btn-lg">
                            Start Learning
                        </Link>
                        <Link href="/courses" className="btn btn-secondary">
                            Browse More Courses
                        </Link>
                    </div>

                    <p className={styles.note}>
                        A confirmation email has been sent to your registered email address.
                    </p>
                </div>
            </div>
        </>
    );
}

CheckoutSuccessPage.getLayout = (page) => page;
