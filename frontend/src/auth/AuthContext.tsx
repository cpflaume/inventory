import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { DepotAccess, DepotRole, UserSummary } from '../api/types';

interface AuthState {
  user: UserSummary | null;
  depots: DepotAccess[];
  loading: boolean;
  isAdmin: boolean;
  /** Effektive Rolle des Benutzers im Lager (Plattform-Admin: ADMIN überall). */
  roleForDepot: (depotId: string) => DepotRole | null;
  /** Darf der Benutzer im Lager bearbeiten (EDITOR oder ADMIN)? */
  canEdit: (depotId: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Übernimmt ein extern (OIDC) ausgestelltes App-Token und lädt den Benutzer. */
  loginWithToken: (token: string) => Promise<void>;
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
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    await loadMe();
  };

  const loginWithToken = async (token: string) => {
    setToken(token);
    await loadMe();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setDepots([]);
  };

  const value = useMemo<AuthState>(
    () => {
      const roleForDepot = (depotId: string): DepotRole | null =>
        depots.find((d) => d.depotId === depotId)?.role ?? null;
      return {
        user,
        depots,
        loading,
        isAdmin: user?.systemRole === 'ADMIN',
        roleForDepot,
        canEdit: (depotId: string) => {
          const role = roleForDepot(depotId);
          return role === 'EDITOR' || role === 'ADMIN';
        },
        login,
        loginWithToken,
        logout,
        refresh: loadMe,
      };
    },
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
