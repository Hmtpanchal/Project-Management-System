import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService
      .me()
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleUnauthorized = () => setUser(null);
    window.addEventListener('orbit:unauthorized', handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('orbit:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials, asAdmin = false) => {
    const response = asAdmin
      ? await authService.adminLogin(credentials)
      : await authService.login(credentials);
    setUser(response.data.user);
    return response;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    setUser(response.data.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await authService.me();
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
