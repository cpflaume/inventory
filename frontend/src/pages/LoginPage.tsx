import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { AppVersion, Button, Card } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [oidcLoginUrl, setOidcLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    // Nur anzeigen, wenn das Backend OIDC aktiviert hat.
    api
      .oidcConfig()
      .then((cfg) => setOidcLoginUrl(cfg.enabled ? cfg.loginUrl : null))
      .catch(() => setOidcLoginUrl(null));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 pb-10">
      <div className="mb-6 text-center">
        <div className="text-5xl">⛺</div>
        <h1 className="mt-2 text-3xl font-bold text-moos-800">Jurtenburg</h1>
        <p className="text-moos-500">Anmelden und ans Lagerfeuer treten.</p>
      </div>
      <Card className="p-6">
        <form className="space-y-3" onSubmit={submit}>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy || !email || !password}>
            Anmelden
          </Button>
        </form>
        {oidcLoginUrl && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-moos-400">
              <span className="h-px flex-1 bg-moos-100" />
              oder
              <span className="h-px flex-1 bg-moos-100" />
            </div>
            <a
              href={oidcLoginUrl}
              className="block w-full rounded-xl bg-moos-100 px-4 py-2 text-center text-sm font-semibold text-moos-800 transition hover:bg-moos-200"
            >
              Mit Nextcloud anmelden
            </a>
          </>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-moos-500">
        Noch kein Konto?{' '}
        <Link to="/register" className="font-semibold text-moos-700 underline">
          Registrieren
        </Link>
      </p>
      <AppVersion className="absolute inset-x-0 bottom-4" />
    </div>
  );
}
