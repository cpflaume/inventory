import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Card } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
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
      </Card>
      <p className="mt-4 text-center text-sm text-moos-500">
        Noch kein Konto?{' '}
        <Link to="/register" className="font-semibold text-moos-700 underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}
