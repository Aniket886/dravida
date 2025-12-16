import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { itemCount } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
        setUserMenuOpen(false);
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🛡️</span>
                    <span className={styles.logoText}>Cyber Dravida</span>
                </Link>

                {/* Desktop Navigation */}
                <div className={styles.navLinks}>
                    <Link href="/" className={router.pathname === '/' ? styles.active : ''}>
                        Home
                    </Link>
                    <Link href="/courses" className={router.pathname.startsWith('/courses') ? styles.active : ''}>
                        Courses
                    </Link>
                    <Link href="/about" className={router.pathname === '/about' ? styles.active : ''}>
                        About
                    </Link>
                    <Link href="/contact" className={router.pathname === '/contact' ? styles.active : ''}>
                        Contact
                    </Link>
                </div>

                {/* Right Side Actions */}
                <div className={styles.navActions}>
                    {/* Cart */}
                    <Link href="/cart" className={styles.cartBtn}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {itemCount > 0 && (
                            <span className={styles.cartBadge}>{itemCount}</span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <div className={styles.userMenu}>
                            <button
                                className={styles.userBtn}
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className={styles.avatar}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6"></path>
                                </svg>
                            </button>

                            {userMenuOpen && (
                                <div className={styles.dropdown}>
                                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="9"></rect>
                                            <rect x="14" y="3" width="7" height="5"></rect>
                                            <rect x="14" y="12" width="7" height="9"></rect>
                                            <rect x="3" y="16" width="7" height="5"></rect>
                                        </svg>
                                        Dashboard
                                    </Link>
                                    <Link href="/dashboard/my-courses" onClick={() => setUserMenuOpen(false)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                        </svg>
                                        My Courses
                                    </Link>
                                    <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Profile
                                    </Link>
                                    {isAdmin && (
                                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="3"></circle>
                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                            </svg>
                                            Admin Panel
                                        </Link>
                                    )}
                                    <hr className={styles.divider} />
                                    <button onClick={handleLogout} className={styles.logoutBtn}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/login" className="btn btn-secondary btn-sm">
                                Login
                            </Link>
                            <Link href="/signup" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className={styles.mobileToggle}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            ) : (
                                <>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                    {isAuthenticated ? (
                        <>
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
