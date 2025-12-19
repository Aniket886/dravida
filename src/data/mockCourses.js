export const courses = [
    {
        id: 1,
        slug: 'intro-to-cybersecurity',
        title: 'Introduction to Cybersecurity',
        short_description: 'Start your journey into the world of cybersecurity. Learn the fundamentals of network security, encryption, and threat analysis.',
        description: 'This comprehensive course is designed for beginners who want to start a career in cybersecurity. You will learn about the different types of cyber attacks, how to secure networks, and the basics of cryptography.\n\nThe course covers essential topics such as:\n- Network Security Fundamentals\n- Common Cyber Threats and Attacks\n- Encryption and Cryptography\n- Security Policies and Procedures\n- Risk Management',
        price: 2999,
        original_price: 5999,
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
        rating_avg: 4.8,
        rating_count: 124,
        enrollment_count: 1543,
        level: 'beginner',
        category: 'Network Security',
        duration: 250, // minutes
        instructor_name: 'Aniket Tegginamath',
        modules: [
            {
                id: 101,
                title: 'Introduction to Security',
                lessons: [
                    { id: 1001, title: 'What is Cybersecurity?', duration: 15, is_preview: true },
                    { id: 1002, title: 'The CIA Triad', duration: 20, is_preview: true },
                    { id: 1003, title: 'Risk Management Basics', duration: 25, is_preview: false }
                ]
            },
            {
                id: 102,
                title: 'Network Fundamentals',
                lessons: [
                    { id: 1004, title: 'OSI Model Deep Dive', duration: 30, is_preview: false },
                    { id: 1005, title: 'TCP/IP Protocol Suite', duration: 35, is_preview: false }
                ]
            }
        ],
        reviews: [
            { id: 1, user_name: 'Rahul K.', rating: 5, comment: 'Excellent course for beginners!', created_at: '2023-12-01' },
            { id: 2, user_name: 'Priya S.', rating: 4, comment: 'Great content, but needs more labs.', created_at: '2023-12-05' }
        ]
    },
    {
        id: 2,
        slug: 'ethical-hacking-basics',
        title: 'Ethical Hacking Fundamentals',
        short_description: 'Learn how to think like a hacker to defeat them. Master the tools and techniques used by white-hat hackers.',
        description: 'Unlock the secrets of ethical hacking in this hands-on course. You will learn how to identify vulnerabilities in systems and networks, and how to patch them before malicious hackers can exploit them.',
        price: 4999,
        original_price: 9999,
        thumbnail: 'https://images.unsplash.com/photo-1563206767-5b1d972e8136?w=800&q=80',
        rating_avg: 4.9,
        rating_count: 89,
        enrollment_count: 892,
        level: 'intermediate',
        category: 'Ethical Hacking',
        duration: 480,
        instructor_name: 'Cyber Dravida Team',
        modules: [
            {
                id: 201,
                title: 'Reconnaissance',
                lessons: [
                    { id: 2001, title: 'Passive Recon techniques', duration: 40, is_preview: true },
                    { id: 2002, title: 'Active Scanning with Nmap', duration: 45, is_preview: false }
                ]
            }
        ],
        reviews: []
    },
    {
        id: 3,
        slug: 'web-app-security',
        title: 'Web Application Security',
        short_description: 'Protect web applications from common vulnerabilities like SQL Injection, XSS, and CSRF.',
        description: 'Deep dive into the OWASP Top 10 and learn how to secure modern web applications against sophisticated attacks.',
        price: 3499,
        original_price: 6999,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80',
        rating_avg: 4.7,
        rating_count: 56,
        enrollment_count: 430,
        level: 'advanced',
        category: 'Web Security',
        duration: 360,
        instructor_name: 'Security Expert',
        modules: [],
        reviews: []
    },
    {
        id: 4,
        slug: 'osint-mastery',
        title: 'OSINT Mastery: Open Source Intelligence',
        short_description: 'Master the art of gathering information from public sources. Essential for investigators and ethical hackers.',
        description: 'Open Source Intelligence (OSINT) is a critical skill for any cybersecurity professional. In this course, you will learn how to find hidden information about targets using search engines, social media, and specialized tools.\n\nKey topics:\n- Google Dorking\n- Social Media Intelligence (SOCMINT)\n- Geolocation Analysis\n- People Searching\n- Investigating Corporate Infrastructure',
        price: 3999,
        original_price: 7999,
        thumbnail: 'https://images.unsplash.com/photo-1549605655-3162772584f6?w=800&q=80',
        rating_avg: 4.8,
        rating_count: 75,
        enrollment_count: 670,
        level: 'intermediate',
        category: 'OSINT',
        duration: 320,
        instructor_name: 'Aniket Tegginamath',
        modules: [
            {
                id: 401,
                title: 'OSINT Basics',
                lessons: [
                    { id: 4001, title: 'Introduction to OSINT Framework', duration: 25, is_preview: true },
                    { id: 4002, title: 'Advanced Google Search Operators', duration: 35, is_preview: false }
                ]
            }
        ],
        reviews: []
    },
    {
        id: 5,
        slug: 'bug-bounty-hunting',
        title: 'Bug Bounty Hunting: Zero to Hero',
        short_description: 'Learn how to find bugs in real-world applications and get paid for it. Covers XSS, SQLi, IDOR, and more.',
        description: 'Start your career as a Bug Bounty Hunter. This course takes you from the basics of web vulnerabilities to advanced exploitation techniques. You will learn how to write professional reports and earn bounties from platforms like HackerOne and Bugcrowd.\n\nWhat you will learn:\n- Reconnaissance for Bug Bounty\n- Finding XSS (Cross-Site Scripting)\n- Exploiting IDOR vulnerabilities\n- Automating your workflow\n- Report writing best practices',
        price: 5999,
        original_price: 11999,
        thumbnail: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
        rating_avg: 4.9,
        rating_count: 210,
        enrollment_count: 1890,
        level: 'advanced',
        category: 'Bug Bounty',
        duration: 600,
        instructor_name: 'Cyber Dravida Team',
        modules: [
            {
                id: 501,
                title: 'Getting Started',
                lessons: [
                    { id: 5001, title: 'Choosing a Program', duration: 20, is_preview: true },
                    { id: 5002, title: 'Scope and Rules of Engagement', duration: 25, is_preview: true }
                ]
            }
        ],
        reviews: []
    }
];

export const categories = [
    { category: 'Network Security', count: 12 },
    { category: 'Ethical Hacking', count: 8 },
    { category: 'Web Security', count: 5 },
    { category: 'Cloud Security', count: 4 },
    { category: 'OSINT', count: 6 },
    { category: 'Bug Bounty', count: 9 }
];
