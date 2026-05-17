import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const API_BASE = import.meta.env.VITE_AUTH_BASE_URL + '/api/auth' || 'http://localhost:5000/api/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fm_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() =>
    sessionStorage.getItem('fm_token') || null
  );

  const [refreshToken, setRefreshToken] = useState(() =>
    sessionStorage.getItem('fm_refresh_token') || null
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  // POST /api/auth/user/signup
  // Body: { username, email, password }
  // Response 201: { id, email, username }
  const signup = useCallback(async (username, email, password) => {
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed.');
    return data;
  }, []);

  // POST /api/auth/user/login
  // Body: { email, password }
  // Response 200: { access_token, refresh_token }
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed.');

    // Backend returns access_token and refresh_token from generate_tokens()
    const authToken = data.access_token || data.token || '';
    const newRefreshToken = data.refresh_token || '';
    const userData = {
      email,
      name: data.username || email.split('@')[0],
      avatar: (data.username || email)[0].toUpperCase(),
    };

    setUser(userData);
    setToken(authToken);
    setRefreshToken(newRefreshToken);
    sessionStorage.setItem('fm_user', JSON.stringify(userData));
    sessionStorage.setItem('fm_token', authToken);
    sessionStorage.setItem('fm_refresh_token', newRefreshToken);

    return userData;
  }, []);

  // POST /api/auth/user/reset-pwd  (request reset email)
  const requestPasswordReset = useCallback(async (email) => {
    const res = await fetch(`${API_BASE}/user/reset-pwd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Reset request failed.');
    return data;
  }, []);

  // PUT /api/auth/user/reset-pwd  (confirm new password)
  const confirmPasswordReset = useCallback(async (user_id, token, password) => {
    const res = await fetch(`${API_BASE}/user/reset-pwd`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, token, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password reset failed.');
    return data;
  }, []);

  // POST /api/auth/user/logout
  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/user/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {}
    }
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    sessionStorage.removeItem('fm_user');
    sessionStorage.removeItem('fm_token');
    sessionStorage.removeItem('fm_refresh_token');
  }, [token]);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || isRefreshing) {
      return false;
    }

    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/user/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`
         },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      const newAccessToken = data.access_token || data.token || '';
      const newRefreshToken = data.refresh_token || refreshToken;

      setToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      sessionStorage.setItem('fm_token', newAccessToken);
      sessionStorage.setItem('fm_refresh_token', newRefreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, isRefreshing, logout]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, signup, logout, requestPasswordReset, confirmPasswordReset, refreshAccessToken, isRefreshing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
