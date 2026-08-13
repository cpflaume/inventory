import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button, Card } from '../components/ui';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.register({
        username: form.username,
        email: form.email || undefined,
        displayName: form.displayName || undefined,
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-5xl">🏕️</div>
        <h1 className="mt-2 text-3xl font-bold text-moos-800">Registrieren</h1>
      </div>
      <Card className="p-6">
        {done ? (
          <div className="space-y-3 text-center">
            <p className="text-3xl">📨</p>
            <p className="font-semibold text-moos-800">Fast geschafft!</p>
            <p className="text-sm text-moos-600">
              Dein Konto wartet auf die Freigabe durch einen Admin. Danach kannst du dich anmelden.
            </p>
            <Link to="/login">
              <Button variant="ghost">Zur Anmeldung</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <input
              autoFocus
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Benutzername"
              className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
            />
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Anzeigename (optional)"
              className="w-full rounded-xl border border-moos-200 px-4 py-2"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="E-Mail (optional)"
              className="w-full rounded-xl border border-moos-200 px-4 py-2"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Passwort (min. 8 Zeichen)"
              className="w-full rounded-xl border border-moos-200 px-4 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={busy || !form.username || form.password.length < 8}>
              Konto anlegen
            </Button>
          </form>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-moos-500">
        Schon ein Konto?{' '}
        <Link to="/login" className="font-semibold text-moos-700 underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
