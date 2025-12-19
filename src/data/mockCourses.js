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
    }
];

export const categories = [
    { category: 'Network Security', count: 12 },
    { category: 'Ethical Hacking', count: 8 },
    { category: 'Web Security', count: 5 },
    { category: 'Cloud Security', count: 4 }
];
