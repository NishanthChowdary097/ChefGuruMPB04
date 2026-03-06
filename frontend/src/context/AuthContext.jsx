import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Correct way for Vite
export const API_BASE =
  import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/api/auth`
    : "http://localhost:5000/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    sessionStorage.getItem('fm_token') || null
  );

  const signup = useCallback(async (username, email, password) => {
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Signup failed.');

    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Login failed.');

    const authToken = data.token || data.accessToken || data.access_token || '';

    const userData = {
      email,
      name: data.username || data.user?.username || email.split('@')[0],
      avatar: (data.username || email)[0].toUpperCase(),
      id: data.userId || data.user?.id || data.user?._id || '',
    };

    setUser(userData);
    setToken(authToken);

    sessionStorage.setItem('fm_user', JSON.stringify(userData));
    sessionStorage.setItem('fm_token', authToken);

    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('fm_user');
    sessionStorage.removeItem('fm_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}