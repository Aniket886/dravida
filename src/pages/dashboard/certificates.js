import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/UserDashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CertificatesPage() {
    const { token, user } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchCertificates();
        }
    }, [token]);

    const fetchCertificates = async () => {
        try {
            // Fetch completed courses (they get certificates)
            const response = await fetch(`${API_URL}/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter only completed courses
                const completed = data.filter(e => e.status === 'completed' || e.progress === 100);
                setCertificates(completed);
            }
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const downloadCertificate = (cert) => {
        // Create a printable certificate
        const certWindow = window.open('', '_blank');
        certWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${cert.title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Georgia', serif;
                        background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                    }
                    .certificate {
                        width: 800px;
                        background: white;
                        padding: 60px;
                        border: 8px solid #00d4ff;
                        position: relative;
                    }
                    .certificate::before {
                        content: '';
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        right: 20px;
                        bottom: 20px;
                        border: 2px solid #00d4ff;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1a1a2e;
                        margin-bottom: 10px;
                    }
                    h1 {
                        font-size: 48px;
                        color: #1a1a2e;
                        margin-bottom: 20px;
                        font-weight: normal;
                    }
                    .subtitle {
                        color: #666;
                        font-size: 18px;
                    }
                    .content {
                        text-align: center;
                        margin: 40px 0;
                    }
                    .name {
                        font-size: 36px;
                        color: #1a1a2e;
                        border-bottom: 2px solid #00d4ff;
                        display: inline-block;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .course {
                        font-size: 24px;
                        color: #333;
                        margin: 20px 0;
                    }
                    .course strong {
                        color: #00d4ff;
                    }
                    .date {
                        color: #666;
                        margin-top: 30px;
                    }
                    .footer {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 60px;
                        padding-top: 40px;
                    }
                    .signature {
                        text-align: center;
                    }
                    .signature .line {
                        width: 200px;
                        border-bottom: 1px solid #333;
                        margin-bottom: 10px;
                    }
                    .id {
                        text-align: center;
                        margin-top: 30px;
                        color: #999;
                        font-size: 12px;
                    }
                    @media print {
                        body { 
                            background: white; 
                            padding: 0;
                        }
                        .certificate {
                            border-color: #00d4ff !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="header">
                        <div class="logo">🛡️ CYBER DRAVIDA</div>
                        <h1>Certificate of Completion</h1>
                        <p class="subtitle">This is to certify that</p>
                    </div>
                    <div class="content">
                        <div class="name">${user?.name || 'Student Name'}</div>
                        <p class="course">has successfully completed the course</p>
                        <p class="course"><strong>${cert.title}</strong></p>
                        <p class="date">Completed on ${formatDate(cert.completed_at || cert.updated_at)}</p>
                    </div>
                    <div class="footer">
                        <div class="signature">
                            <div class="line"></div>
                            <p>Instructor</p>
                        </div>
                        <div class="signature">
                            <div class="line"></div>
                            <p>Director, Cyber Dravida</p>
                        </div>
                    </div>
                    <p class="id">Certificate ID: CD-${cert.id?.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        certWindow.document.close();
    };

    return (
        <DashboardLayout title="My Certificates">
            {/* Stats */}
            <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 'var(--space-xl)' }}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🎓</span>
                    <div>
                        <span className={styles.statValue}>{certificates.length}</span>
                        <span className={styles.statLabel}>Certificates Earned</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🏆</span>
                    <div>
                        <span className={styles.statValue}>{certificates.length > 0 ? 'Active' : 'Beginner'}</span>
                        <span className={styles.statLabel}>Learning Status</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={styles.empty}>
                    <div className="spinner"></div>
                    <p>Loading certificates...</p>
                </div>
            ) : certificates.length === 0 ? (
                <div className={styles.card}>
                    <div className={styles.empty}>
                        <span>🎓</span>
                        <h2>No Certificates Yet</h2>
                        <p>Complete a course to earn your certificate! Certificates are awarded when you finish 100% of a course.</p>
                        <Link href="/dashboard/my-courses" className="btn btn-primary">
                            Continue Learning
                        </Link>
                    </div>
                </div>
            ) : (
                <div className={styles.certGrid}>
                    {certificates.map((cert) => (
                        <div key={cert.id} className={styles.certCard}>
                            <span className={styles.certIcon}>🏆</span>
                            <h3>{cert.title}</h3>
                            <p>Cybersecurity Course</p>
                            <span className={styles.certDate}>
                                Completed {formatDate(cert.completed_at || cert.updated_at)}
                            </span>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => downloadCertificate(cert)}
                                >
                                    📥 Download
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `I just completed "${cert.title}" at Cyber Dravida! 🎓 #CyberSecurity #Learning`
                                        );
                                        alert('Certificate share text copied to clipboard!');
                                    }}
                                >
                                    🔗 Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.card} style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>🎯 Keep Learning!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                    Explore more courses to expand your cybersecurity skills
                </p>
                <Link href="/courses" className="btn btn-primary">
                    Browse More Courses
                </Link>
            </div>
        </DashboardLayout>
    );
}

CertificatesPage.getLayout = (page) => page;
