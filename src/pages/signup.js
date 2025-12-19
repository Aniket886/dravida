import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Auth.module.css';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const redirect = router.query.redirect || '/dashboard';

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const validateForm = () => {
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const result = await signup(
                formData.name,
                formData.email,
                formData.password,
                formData.phone
            );

            if (result.success) {
                router.push(redirect);
            } else {
                setError(result.error || 'Signup failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <>
            <Head>
                <title>Sign Up - Cyber Dravida</title>
                <meta name="description" content="Create your Cyber Dravida account and start learning cybersecurity today." />
            </Head>

            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.formCard}>
                        <div className={styles.header}>
                            <Link href="/" className={styles.logo}>
                                🛡️ Cyber Dravida
                            </Link>
                            <h1>Create Account</h1>
                            <p>Start your cybersecurity learning journey</p>
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

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

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
                                <label className="form-label">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="+91 9876543210"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Create a password"
                                    required
                                    minLength={6}
                                />
                                {formData.password && (
                                    <div className={styles.passwordStrength}>
                                        <div className={styles.strengthBar}>
                                            <div
                                                className={styles.strengthFill}
                                                style={{
                                                    width: `${passwordStrength.strength * 20}%`,
                                                    background: passwordStrength.color
                                                }}
                                            ></div>
                                        </div>
                                        <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>

                            <label className={styles.checkbox}>
                                <input type="checkbox" required />
                                <span>
                                    I agree to the{' '}
                                    <Link href="/terms">Terms of Service</Link> and{' '}
                                    <Link href="/privacy">Privacy Policy</Link>
                                </span>
                            </label>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <p className={styles.footerText}>
                            Already have an account?{' '}
                            <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

SignupPage.getLayout = (page) => page;
