const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Stripe setup (will work in test mode)
let stripe = null;
try {
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
} catch (e) {
    console.log('⚠️ Stripe not configured - using mock payments');
}

// GET /api/payments/history - Get user's payment history
router.get('/history', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();
        const payments = db.prepare(`
            SELECT p.*, GROUP_CONCAT(c.title, ', ') as course_titles
            FROM payments p
            LEFT JOIN payment_items pi ON p.id = pi.payment_id
            LEFT JOIN courses c ON pi.course_id = c.id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `).all(req.user.userId);

        res.json(payments);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// POST /api/payments/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
        const { courseIds, couponCode } = req.body;
        const db = getDatabase();

        if (!courseIds || courseIds.length === 0) {
            return res.status(400).json({ error: 'No courses selected' });
        }

        // Get courses
        const placeholders = courseIds.map(() => '?').join(', ');
        const courses = db.prepare(`
            SELECT * FROM courses WHERE id IN (${placeholders}) AND is_published = 1
        `).all(...courseIds);

        if (courses.length !== courseIds.length) {
            return res.status(400).json({ error: 'Some courses not found' });
        }

        // Check if already enrolled in any
        const enrolledCheck = db.prepare(`
            SELECT course_id FROM enrollments 
            WHERE user_id = ? AND course_id IN (${placeholders})
        `).all(req.user.userId, ...courseIds);

        if (enrolledCheck.length > 0) {
            return res.status(400).json({
                error: 'Already enrolled in one or more courses',
                enrolledCourses: enrolledCheck.map(e => e.course_id)
            });
        }

        // Calculate total
        let totalAmount = courses.reduce((sum, c) => sum + c.price, 0);
        let discountAmount = 0;

        // Apply coupon if provided
        if (couponCode) {
            const coupon = db.prepare(`
                SELECT * FROM coupons 
                WHERE code = ? AND is_active = 1 
                AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
                AND (usage_limit IS NULL OR usage_count < usage_limit)
            `).get(couponCode.toUpperCase());

            if (coupon) {
                discountAmount = (totalAmount * coupon.discount_percent) / 100;
                totalAmount -= discountAmount;
            }
        }

        // Create payment record
        const paymentId = uuidv4();
        db.prepare(`
            INSERT INTO payments (id, user_id, amount, currency, status)
            VALUES (?, ?, ?, 'INR', 'pending')
        `).run(paymentId, req.user.userId, totalAmount);

        // Create payment items
        const insertItem = db.prepare(`
            INSERT INTO payment_items (id, payment_id, course_id, price)
            VALUES (?, ?, ?, ?)
        `);

        for (const course of courses) {
            insertItem.run(uuidv4(), paymentId, course.id, course.price);
        }

        // If Stripe is configured, create checkout session
        if (stripe) {
            const lineItems = courses.map(course => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: course.title,
                        description: course.short_description || course.description?.substring(0, 100)
                    },
                    unit_amount: Math.round(course.price * 100) // Stripe uses paise
                },
                quantity: 1
            }));

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}`,
                cancel_url: `${process.env.FRONTEND_URL}/cart`,
                customer_email: req.user.email,
                metadata: {
                    paymentId,
                    userId: req.user.userId
                },
                discounts: discountAmount > 0 ? [{
                    coupon: couponCode
                }] : undefined
            });

            db.prepare(`
                UPDATE payments SET stripe_session_id = ? WHERE id = ?
            `).run(session.id, paymentId);

            res.json({
                sessionId: session.id,
                url: session.url,
                paymentId
            });
        } else {
            // Mock payment for development
            res.json({
                paymentId,
                mockPayment: true,
                totalAmount,
                courses: courses.map(c => ({ id: c.id, title: c.title, price: c.price })),
                message: 'Stripe not configured. Use /api/payments/mock-complete to simulate payment.'
            });
        }
    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// POST /api/payments/mock-complete - Complete mock payment (for development)
router.post('/mock-complete', authenticateToken, (req, res) => {
    try {
        const { paymentId } = req.body;
        const db = getDatabase();

        const payment = db.prepare(`
            SELECT * FROM payments WHERE id = ? AND user_id = ?
        `).get(paymentId, req.user.userId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.status(400).json({ error: 'Payment already completed' });
        }

        // Update payment status
        db.prepare(`
            UPDATE payments SET status = 'completed', stripe_payment_id = ? WHERE id = ?
        `).run(`mock_${Date.now()}`, paymentId);

        // Get payment items and create enrollments
        const items = db.prepare(`
            SELECT course_id FROM payment_items WHERE payment_id = ?
        `).all(paymentId);

        for (const item of items) {
            // Check if already enrolled
            const existing = db.prepare(`
                SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
            `).get(req.user.userId, item.course_id);

            if (!existing) {
                db.prepare(`
                    INSERT INTO enrollments (id, user_id, course_id, progress, status)
                    VALUES (?, ?, ?, 0, 'active')
                `).run(uuidv4(), req.user.userId, item.course_id);

                db.prepare(`
                    UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?
                `).run(item.course_id);
            }
        }

        // Clear cart
        db.prepare(`
            DELETE FROM cart_items WHERE user_id = ?
        `).run(req.user.userId);

        res.json({
            message: 'Payment completed successfully',
            enrolledCourses: items.map(i => i.course_id)
        });
    } catch (error) {
        console.error('Mock complete error:', error);
        res.status(500).json({ error: 'Failed to complete payment' });
    }
});

// POST /api/payments/webhook - Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = getDatabase();

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { paymentId, userId } = session.metadata;

        // Update payment status
        db.prepare(`
            UPDATE payments SET status = 'completed', stripe_payment_id = ? WHERE id = ?
        `).run(session.payment_intent, paymentId);

        // Get payment items and create enrollments
        const items = db.prepare(`
            SELECT course_id FROM payment_items WHERE payment_id = ?
        `).all(paymentId);

        for (const item of items) {
            const existing = db.prepare(`
                SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?
            `).get(userId, item.course_id);

            if (!existing) {
                db.prepare(`
                    INSERT INTO enrollments (id, user_id, course_id, progress, status)
                    VALUES (?, ?, ?, 0, 'active')
                `).run(uuidv4(), userId, item.course_id);

                db.prepare(`
                    UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?
                `).run(item.course_id);
            }
        }

        // Clear cart
        db.prepare(`
            DELETE FROM cart_items WHERE user_id = ?
        `).run(userId);
    }

    res.json({ received: true });
});

// POST /api/payments/validate-coupon - Validate coupon code
router.post('/validate-coupon', authenticateToken, (req, res) => {
    try {
        const { code } = req.body;
        const db = getDatabase();

        const coupon = db.prepare(`
            SELECT id, code, discount_percent, expiry_date, usage_limit, usage_count
            FROM coupons 
            WHERE code = ? AND is_active = 1 
            AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
            AND (usage_limit IS NULL OR usage_count < usage_limit)
        `).get(code.toUpperCase());

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid or expired coupon' });
        }

        res.json({
            valid: true,
            code: coupon.code,
            discountPercent: coupon.discount_percent
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

// POST /api/payments/submit-utr - Submit UTR for UPI payment verification
router.post('/submit-utr', authenticateToken, (req, res) => {
    try {
        const { courseIds, utrNumber, transactionId, amount, couponCode, discountPercent } = req.body;
        const db = getDatabase();

        if (!courseIds || courseIds.length === 0) {
            return res.status(400).json({ error: 'No courses selected' });
        }
        if (!utrNumber || !transactionId) {
            return res.status(400).json({ error: 'UTR Number and Transaction ID are required' });
        }

        // Check if UTR already submitted
        const existingUtr = db.prepare(`
            SELECT id FROM payments WHERE utr_number = ?
        `).get(utrNumber);

        if (existingUtr) {
            return res.status(400).json({ error: 'This UTR has already been submitted' });
        }

        // Verify courses exist
        const placeholders = courseIds.map(() => '?').join(', ');
        const courses = db.prepare(`
            SELECT * FROM courses WHERE id IN (${placeholders}) AND is_published = 1
        `).all(...courseIds);

        if (courses.length !== courseIds.length) {
            return res.status(400).json({ error: 'Some courses not found' });
        }

        // Check if already enrolled
        const enrolled = db.prepare(`
            SELECT course_id FROM enrollments 
            WHERE user_id = ? AND course_id IN (${placeholders})
        `).all(req.user.userId, ...courseIds);

        if (enrolled.length > 0) {
            return res.status(400).json({
                error: 'Already enrolled in one or more courses',
                enrolledCourses: enrolled.map(e => e.course_id)
            });
        }

        // Calculate original total
        const originalTotal = courses.reduce((sum, c) => sum + c.price, 0);

        // Use the amount from frontend (which has discount applied) or calculate it
        const finalAmount = amount || originalTotal;

        // Create payment record with UTR and coupon info
        const paymentId = uuidv4();

        db.prepare(`
            INSERT INTO payments (id, user_id, amount, currency, status, utr_number, transaction_id, coupon_code, discount_percent, original_amount)
            VALUES (?, ?, ?, 'INR', 'pending_verification', ?, ?, ?, ?, ?)
        `).run(paymentId, req.user.userId, finalAmount, utrNumber, transactionId, couponCode || null, discountPercent || 0, originalTotal);

        // Increment coupon usage if used
        if (couponCode) {
            db.prepare(`
                UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?
            `).run(couponCode.toUpperCase());
        }

        // Create payment items
        for (const course of courses) {
            const itemId = uuidv4();
            db.prepare(`
                INSERT INTO payment_items (id, payment_id, course_id, price)
                VALUES (?, ?, ?, ?)
            `).run(itemId, paymentId, course.id, course.price);
        }

        console.log(`💰 UTR Payment submitted: ${utrNumber} by user ${req.user.userId}${couponCode ? ` (Coupon: ${couponCode}, ${discountPercent}% off)` : ''}`);

        res.status(201).json({
            message: 'Payment submitted for verification',
            paymentId,
            utrNumber,
            amount: finalAmount,
            originalAmount: originalTotal,
            couponCode: couponCode || null,
            discountPercent: discountPercent || 0,
            courses: courses.map(c => ({ id: c.id, title: c.title }))
        });
    } catch (error) {
        console.error('Submit UTR error:', error);
        res.status(500).json({ error: 'Failed to submit payment' });
    }
});

// GET /api/payments/:id - Get payment details
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const payment = db.prepare(`
            SELECT p.*, GROUP_CONCAT(c.title, ', ') as course_titles
            FROM payments p
            LEFT JOIN payment_items pi ON p.id = pi.payment_id
            LEFT JOIN courses c ON pi.course_id = c.id
            WHERE p.id = ? AND p.user_id = ?
            GROUP BY p.id
        `).get(id, req.user.userId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
});

module.exports = router;

