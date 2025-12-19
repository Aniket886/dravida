import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Auth.module.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '420316358222-dl8kui8snt01i1qqn33jql4fs1m4a0vn.apps.googleusercontent.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LoginPage() {
    const router = useRouter();
    const { login, loginWithGoogle } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const redirect = router.query.redirect || '/dashboard';

    // Initialize Google Sign-In
    useEffect(() => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn'),
                    {
                        theme: 'filled_black',
                        size: 'large',
                        width: '100%',
                        text: 'signin_with',
                        shape: 'rectangular'
                    }
                );
            }
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const handleGoogleResponse = async (response) => {
        setGoogleLoading(true);
        setError('');

        try {
            const result = await loginWithGoogle(response.credential);
            if (result.success) {
                router.push(redirect);
            } else {
                setError(result.error || 'Google login failed');
            }
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                router.push(redirect);
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - Cyber Dravida</title>
                <meta name="description" content="Login to your Cyber Dravida account to access your courses and continue learning." />
            </Head>

            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.formCard}>
                        <div className={styles.header}>
                            <Link href="/" className={styles.logo}>
                                🛡️ Cyber Dravida
                            </Link>
                            <h1>Welcome Back</h1>
                            <p>Login to continue your learning journey</p>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Google Sign-In Button */}
                        <div className={styles.socialLogin}>
                            <div id="google-signin-btn" className={styles.googleBtn}></div>
                            {googleLoading && (
                                <div className={styles.googleLoading}>
                                    <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                    Signing in with Google...
                                </div>
                            )}
                        </div>

                        <div className={styles.divider}>
                            <span>or continue with email</span>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <div className={styles.labelRow}>
                                    <label className="form-label">Password</label>
                                    <Link href="/forgot-password" className={styles.forgotLink}>
                                        Forgot password?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <p className={styles.footerText}>
                            Don't have an account?{' '}
                            <Link href={`/signup${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

LoginPage.getLayout = (page) => page;

