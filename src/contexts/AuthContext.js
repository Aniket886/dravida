import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Check for existing token on mount
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            fetchUser(savedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (authToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('Login Attempt:', { email, API_URL });
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login Response Status:', response.status);

            // Clone response to read text if JSON fails
            const resClone = response.clone();
            try {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            } catch (err) {
                const text = await resClone.text();
                console.error('Login Parse Error:', err);
                console.error('Response Text:', text);
                return { success: false, error: `Server Error (${response.status}): ${text.slice(0, 100)}...` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (name, email, password, phone) => {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async (credential) => {
        try {
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ credential })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Google login failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (updates) => {
        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Update failed');
            }

            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
