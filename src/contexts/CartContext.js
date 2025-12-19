import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCart();
        } else {
            // Load from localStorage for guests
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setItems(JSON.parse(savedCart));
            }
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        // Calculate total
        const sum = items.reduce((acc, item) => acc + (item.price || 0), 0);
        setTotal(sum);

        // Save to localStorage for guests
        if (!isAuthenticated) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, isAuthenticated]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (course) => {
        if (isAuthenticated) {
            try {
                const response = await fetch(`${API_URL}/cart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ courseId: course.id })
                });

                if (response.ok) {
                    await fetchCart();
                    return { success: true };
                } else {
                    const data = await response.json();
                    return { success: false, error: data.error };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        } else {
            // Guest cart
            const courseId = course.id || course.course_id;
            if (!isInCart(courseId)) {
                setItems([...items, { course_id: courseId, id: courseId, ...course }]);
                return { success: true };
            }
            return { success: false, error: 'Already in cart' };
        }
    };

    const removeFromCart = async (courseId) => {
        if (isAuthenticated) {
            try {
                await fetch(`${API_URL}/cart/${courseId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                await fetchCart();
            } catch (error) {
                console.error('Failed to remove from cart:', error);
            }
        } else {
            setItems(items.filter(item => item.course_id !== courseId && item.id !== courseId));
        }
    };

    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                await fetch(`${API_URL}/cart`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setItems([]);
            } catch (error) {
                console.error('Failed to clear cart:', error);
            }
        } else {
            setItems([]);
            localStorage.removeItem('cart');
        }
    };

    const isInCart = (courseId) => {
        return items.some(item => item.course_id === courseId || item.id === courseId);
    };

    const value = {
        items,
        total,
        loading,
        itemCount: items.length,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        refreshCart: fetchCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
