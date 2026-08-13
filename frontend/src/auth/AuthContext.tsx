import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { DepotAccess, UserSummary } from '../api/types';

interface AuthState {
  user: UserSummary | null;
  depots: DepotAccess[];
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [depots, setDepots] = useState<DepotAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    if (!getToken()) {
      setUser(null);
      setDepots([]);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me.user);
      setDepots(me.depots);
    } catch {
      clearToken();
      setUser(null);
      setDepots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Zentrale 401-Behandlung: Token weg → ausloggen.
    setUnauthorizedHandler(() => {
      setUser(null);
      setDepots([]);
    });
    loadMe();
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setToken(res.token);
    await loadMe();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setDepots([]);
  };

  const value = useMemo<AuthState>(
    () => ({ user, depots, loading, isAdmin: user?.systemRole === 'ADMIN', login, logout, refresh: loadMe }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, depots, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
