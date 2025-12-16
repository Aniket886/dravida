import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Google Fonts */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />

                {/* Favicon */}
                <link rel="icon" href="/favicon.ico" />

                {/* Meta */}
                <meta name="description" content="Cyber Dravida - Premium Cybersecurity Training Platform. Learn OSINT, Ethical Hacking, Network Security, and more from industry experts." />
                <meta name="keywords" content="cybersecurity, ethical hacking, OSINT, network security, malware analysis, online courses, training" />
                <meta name="author" content="Cyber Dravida" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Cyber Dravida" />

                {/* Theme Color */}
                <meta name="theme-color" content="#0f172a" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
