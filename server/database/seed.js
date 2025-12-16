const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb, closeDb } = require('./db');

async function seedDatabase() {
    console.log('Seeding database with sample data...');

    try {
        const db = await getDb();

        // Create instructor user
        const instructorPassword = await bcrypt.hash('Instructor@123', 10);

        // Check if instructor exists
        let stmt = db.prepare('SELECT id FROM users WHERE email = ?');
        stmt.bind(['instructor@cyberdravida.com']);
        const existingInstructor = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();

        let instructorId;
        if (!existingInstructor) {
            instructorId = uuidv4();
            db.run(
                'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
                [instructorId, 'instructor@cyberdravida.com', instructorPassword, 'Sunil Kumar', 'instructor']
            );
            console.log('Instructor user created');
        } else {
            instructorId = existingInstructor.id;
        }

        // Sample courses - Comprehensive catalog with multiple courses per category
        const courses = [
            // ==================== OSINT Category ====================
            {
                title: 'OSINT Fundamentals',
                slug: 'osint-fundamentals',
                description: 'Start your journey into Open Source Intelligence. Learn the basics of information gathering from publicly available sources including social media, websites, and public records. Perfect for beginners entering the cybersecurity field.',
                short_description: 'Introduction to Open Source Intelligence gathering',
                price: 2499,
                original_price: 3999,
                level: 'beginner',
                duration: 480,
                thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
                category: 'OSINT',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Advanced OSINT Techniques',
                slug: 'advanced-osint-techniques',
                description: 'Master Open Source Intelligence gathering with advanced techniques. Learn to gather intelligence from publicly available sources, social media, and the deep web. This comprehensive course covers all aspects of OSINT including tools, methodologies, and real-world applications.',
                short_description: 'Master the art of Open Source Intelligence gathering',
                price: 4999,
                original_price: 7999,
                level: 'intermediate',
                duration: 720,
                thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
                category: 'OSINT',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Social Media Intelligence (SOCMINT)',
                slug: 'social-media-intelligence',
                description: 'Specialized course on gathering intelligence from social media platforms. Learn to track digital footprints, analyze social networks, and extract valuable information from Facebook, Twitter, LinkedIn, Instagram, and more.',
                short_description: 'Master social media investigation techniques',
                price: 3999,
                original_price: 5999,
                level: 'intermediate',
                duration: 540,
                thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
                category: 'OSINT',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Dark Web Investigation',
                slug: 'dark-web-investigation',
                description: 'Advanced course on investigating the dark web safely. Learn to navigate Tor networks, identify threat actors, monitor underground forums, and gather intelligence from hidden services while maintaining operational security.',
                short_description: 'Safely investigate the dark web and hidden services',
                price: 6999,
                original_price: 9999,
                level: 'advanced',
                duration: 660,
                thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
                category: 'OSINT',
                is_published: 1,
                is_featured: 0
            },

            // ==================== Ethical Hacking Category ====================
            {
                title: 'Introduction to Ethical Hacking',
                slug: 'intro-ethical-hacking',
                description: 'Begin your ethical hacking journey with this foundational course. Understand the mindset of hackers, learn basic attack vectors, and get hands-on experience with essential hacking tools in a legal and controlled environment.',
                short_description: 'Start your journey as an ethical hacker',
                price: 2999,
                original_price: 4999,
                level: 'beginner',
                duration: 600,
                thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
                category: 'Ethical Hacking',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Ethical Hacking Masterclass',
                slug: 'ethical-hacking-masterclass',
                description: 'Complete ethical hacking course from beginner to advanced. Learn penetration testing, vulnerability assessment, and security auditing. Includes hands-on labs and real-world scenarios.',
                short_description: 'Become a certified ethical hacker',
                price: 6999,
                original_price: 9999,
                level: 'intermediate',
                duration: 1440,
                thumbnail: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=400',
                category: 'Ethical Hacking',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Web Application Penetration Testing',
                slug: 'web-app-pentesting',
                description: 'Master the art of web application security testing. Learn OWASP Top 10 vulnerabilities, SQL injection, XSS, CSRF, and other common web attacks. Includes hands-on labs with real-world applications.',
                short_description: 'Comprehensive web application security testing',
                price: 5499,
                original_price: 7999,
                level: 'intermediate',
                duration: 900,
                thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
                category: 'Ethical Hacking',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Advanced Exploitation Techniques',
                slug: 'advanced-exploitation',
                description: 'Take your hacking skills to the next level. Learn advanced exploitation techniques including buffer overflows, shellcode development, privilege escalation, and post-exploitation tactics used by professional pentesters.',
                short_description: 'Master advanced exploitation and post-exploitation',
                price: 8999,
                original_price: 12999,
                level: 'advanced',
                duration: 1080,
                thumbnail: 'https://images.unsplash.com/photo-1544890225-2f3faec4cd60?w=400',
                category: 'Ethical Hacking',
                is_published: 1,
                is_featured: 0
            },

            // ==================== Network Security Category ====================
            {
                title: 'Network Security Fundamentals',
                slug: 'network-security-fundamentals',
                description: 'Learn network security from the ground up. Understand firewalls, IDS/IPS, VPNs, and network protocols. This course provides a solid foundation for anyone looking to specialize in network security.',
                short_description: 'Build a strong foundation in network security',
                price: 3999,
                original_price: 5999,
                level: 'beginner',
                duration: 600,
                thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
                category: 'Network Security',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Wireshark & Network Traffic Analysis',
                slug: 'wireshark-traffic-analysis',
                description: 'Become proficient in network traffic analysis using Wireshark. Learn to capture, filter, and analyze packets. Detect malicious traffic, troubleshoot network issues, and investigate security incidents.',
                short_description: 'Master network packet analysis with Wireshark',
                price: 3499,
                original_price: 4999,
                level: 'intermediate',
                duration: 540,
                thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
                category: 'Network Security',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Firewall & IDS/IPS Configuration',
                slug: 'firewall-ids-ips-config',
                description: 'Hands-on course on configuring and managing enterprise security infrastructure. Learn to deploy, configure, and optimize firewalls, intrusion detection systems, and intrusion prevention systems.',
                short_description: 'Configure enterprise security infrastructure',
                price: 5999,
                original_price: 8999,
                level: 'intermediate',
                duration: 720,
                thumbnail: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?w=400',
                category: 'Network Security',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Advanced Network Defense',
                slug: 'advanced-network-defense',
                description: 'Enterprise-level network security strategies. Learn advanced threat detection, network segmentation, zero trust architecture, and incident response procedures for large-scale networks.',
                short_description: 'Enterprise network security and defense strategies',
                price: 7999,
                original_price: 11999,
                level: 'advanced',
                duration: 900,
                thumbnail: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400',
                category: 'Network Security',
                is_published: 1,
                is_featured: 0
            },

            // ==================== Malware Analysis Category ====================
            {
                title: 'Introduction to Malware Analysis',
                slug: 'intro-malware-analysis',
                description: 'Start your journey in malware analysis. Learn to set up safe analysis environments, understand malware types, perform basic static and dynamic analysis, and identify common malware indicators.',
                short_description: 'Begin your malware analysis journey',
                price: 3999,
                original_price: 5999,
                level: 'beginner',
                duration: 540,
                thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
                category: 'Malware Analysis',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Malware Analysis & Reverse Engineering',
                slug: 'malware-analysis-reverse-engineering',
                description: 'Deep dive into malware analysis and reverse engineering. Learn to dissect malicious software, understand its behavior, and develop detection mechanisms.',
                short_description: 'Analyze and understand malicious software',
                price: 7999,
                original_price: 11999,
                level: 'advanced',
                duration: 960,
                thumbnail: 'https://images.unsplash.com/photo-1526374870839-e155464bb9b2?w=400',
                category: 'Malware Analysis',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Ransomware Analysis & Defense',
                slug: 'ransomware-analysis-defense',
                description: 'Specialized course on ransomware threats. Learn how ransomware works, analyze real samples, understand encryption mechanisms, and implement effective defense and recovery strategies.',
                short_description: 'Understand and defend against ransomware attacks',
                price: 5499,
                original_price: 7999,
                level: 'intermediate',
                duration: 600,
                thumbnail: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400',
                category: 'Malware Analysis',
                is_published: 1,
                is_featured: 0
            },

            // ==================== Bug Bounty Category ====================
            {
                title: 'Bug Bounty Basics',
                slug: 'bug-bounty-basics',
                description: 'Get started with bug bounty hunting. Learn how bug bounty programs work, understand scope and rules, set up your hunting environment, and discover your first vulnerabilities.',
                short_description: 'Start your bug bounty hunting career',
                price: 2999,
                original_price: 4499,
                level: 'beginner',
                duration: 480,
                thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400',
                category: 'Bug Bounty',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Bug Bounty Hunting',
                slug: 'bug-bounty-hunting',
                description: 'Start earning money by finding vulnerabilities in web applications. Learn the methodology, tools, and techniques used by successful bug bounty hunters.',
                short_description: 'Learn to find and report security vulnerabilities',
                price: 5499,
                original_price: 7999,
                level: 'intermediate',
                duration: 840,
                thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
                category: 'Bug Bounty',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'Advanced Bug Bounty Techniques',
                slug: 'advanced-bug-bounty',
                description: 'Elevate your bug bounty game with advanced techniques. Learn to find complex vulnerabilities, chain bugs for higher impact, automate your hunting workflow, and maximize your earnings.',
                short_description: 'Advanced techniques for professional bug hunters',
                price: 6999,
                original_price: 9999,
                level: 'advanced',
                duration: 720,
                thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
                category: 'Bug Bounty',
                is_published: 1,
                is_featured: 0
            },

            // ==================== Cloud Security Category ====================
            {
                title: 'Cloud Security Fundamentals',
                slug: 'cloud-security-fundamentals',
                description: 'Introduction to cloud security concepts. Learn the shared responsibility model, understand cloud-specific threats, and get familiar with security features across major cloud providers.',
                short_description: 'Foundation course for cloud security',
                price: 3499,
                original_price: 4999,
                level: 'beginner',
                duration: 480,
                thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
                category: 'Cloud Security',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Cloud Security Essentials',
                slug: 'cloud-security-essentials',
                description: 'Secure cloud environments across AWS, Azure, and GCP. Learn best practices, compliance frameworks, and security configurations for cloud platforms.',
                short_description: 'Secure AWS, Azure, and GCP environments',
                price: 5999,
                original_price: 8999,
                level: 'intermediate',
                duration: 780,
                thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
                category: 'Cloud Security',
                is_published: 1,
                is_featured: 1
            },
            {
                title: 'AWS Security Specialization',
                slug: 'aws-security-specialization',
                description: 'Deep dive into Amazon Web Services security. Master IAM, VPC security, CloudTrail, GuardDuty, Security Hub, and other AWS security services. Prepare for AWS Security Specialty certification.',
                short_description: 'Master AWS security services and best practices',
                price: 6499,
                original_price: 9499,
                level: 'intermediate',
                duration: 840,
                thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=400',
                category: 'Cloud Security',
                is_published: 1,
                is_featured: 0
            },
            {
                title: 'Kubernetes Security',
                slug: 'kubernetes-security',
                description: 'Secure your container orchestration platform. Learn Kubernetes security best practices, pod security policies, network policies, secrets management, and runtime security monitoring.',
                short_description: 'Security for containerized applications on K8s',
                price: 5999,
                original_price: 8499,
                level: 'advanced',
                duration: 660,
                thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400',
                category: 'Cloud Security',
                is_published: 1,
                is_featured: 0
            }
        ];

        // Insert courses
        for (const course of courses) {
            // Check if course exists
            stmt = db.prepare('SELECT id FROM courses WHERE slug = ?');
            stmt.bind([course.slug]);
            const existingCourse = stmt.step() ? stmt.getAsObject() : null;
            stmt.free();

            if (!existingCourse) {
                const courseId = uuidv4();
                db.run(
                    `INSERT INTO courses (id, title, slug, description, short_description, price, original_price, level, duration, thumbnail, instructor_id, category, is_published, is_featured)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [courseId, course.title, course.slug, course.description, course.short_description, course.price, course.original_price, course.level, course.duration, course.thumbnail, instructorId, course.category, course.is_published, course.is_featured]
                );

                // Add modules and lessons
                const modules = [
                    { title: 'Introduction', lessons: ['Welcome & Course Overview', 'Setting Up Your Environment', 'Understanding the Basics'] },
                    { title: 'Core Concepts', lessons: ['Key Principles', 'Tools & Techniques', 'Hands-on Practice'] },
                    { title: 'Advanced Topics', lessons: ['Advanced Techniques', 'Real-world Scenarios', 'Best Practices'] },
                    { title: 'Conclusion', lessons: ['Project Work', 'Final Assessment', 'Next Steps'] }
                ];

                for (let i = 0; i < modules.length; i++) {
                    const moduleId = uuidv4();
                    db.run(
                        'INSERT INTO modules (id, course_id, title, order_num) VALUES (?, ?, ?, ?)',
                        [moduleId, courseId, modules[i].title, i + 1]
                    );

                    for (let j = 0; j < modules[i].lessons.length; j++) {
                        const lessonId = uuidv4();
                        db.run(
                            `INSERT INTO lessons (id, module_id, title, content, duration, order_num, is_preview)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [lessonId, moduleId, modules[i].lessons[j], `Content for ${modules[i].lessons[j]}`, 15 + Math.floor(Math.random() * 30), j + 1, i === 0 && j === 0 ? 1 : 0]
                        );
                    }
                }

                console.log(`Created course: ${course.title}`);
            }
        }

        // Create a sample coupon
        stmt = db.prepare('SELECT id FROM coupons WHERE code = ?');
        stmt.bind(['CYBER50']);
        const existingCoupon = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();

        if (!existingCoupon) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            const couponId = uuidv4();

            db.run(
                'INSERT INTO coupons (id, code, discount_percent, expiry_date, usage_limit, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [couponId, 'CYBER50', 50, expiryDate.toISOString(), 100, 1]
            );
            console.log('Sample coupon created: CYBER50 (50% off)');
        }

        saveDb();
        console.log('Database seeding completed');

    } catch (error) {
        console.error('Seeding error:', error);
        throw error;
    }
}

module.exports = { seedDatabase };

// Run if called directly
if (require.main === module) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
    const { initializeDatabase } = require('./init');

    initializeDatabase()
        .then(() => seedDatabase())
        .then(() => {
            console.log('Done!');
            closeDb();
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
