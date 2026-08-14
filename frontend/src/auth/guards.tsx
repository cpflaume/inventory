import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Loading() {
  return <div className="p-10 text-center text-moos-400">Lade …</div>;
}

/** Nur für angemeldete Benutzer; sonst → Login. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Nur für Plattform-Admins; sonst zurück zur Startseite. */
export function RequireAdmin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
