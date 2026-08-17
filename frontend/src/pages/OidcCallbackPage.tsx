import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppVersion, Card } from '../components/ui';

/** Menschenlesbare Meldung zu den Fehlercodes, die das Backend im Fragment liefert. */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Die Anmeldung ist abgelaufen oder ungültig. Bitte erneut versuchen.',
  invalid_request: 'Die Antwort des Anmeldedienstes war unvollständig.',
  oidc_failed: 'Die Anmeldung über Nextcloud ist fehlgeschlagen.',
};

/**
 * Ziel der OIDC-Weiterleitung: liest das App-Token (oder einen Fehler) aus dem URL-Fragment,
 * übernimmt es in die Session und leitet weiter. Das Fragment wird nie an den Server gesendet
 * und hier sofort aus der Adresszeile entfernt.
 */
export default function OidcCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token');
    const err = params.get('error');
    // Token/Fehler aus der Adresszeile tilgen (History-Leak vermeiden).
    window.history.replaceState(null, '', window.location.pathname);

    if (token) {
      loginWithToken(token)
        .then(() => navigate('/', { replace: true }))
        .catch(() => setError('oidc_failed'));
    } else {
      setError(err ?? 'oidc_failed');
    }
  }, [loginWithToken, navigate]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 pb-10">
      <div className="mb-6 text-center">
        <div className="text-5xl">⛺</div>
        <h1 className="mt-2 text-3xl font-bold text-moos-800">Jurtenburg</h1>
      </div>
      <Card className="p-6 text-center">
        {error ? (
          <>
            <p className="mb-4 text-sm text-red-600">
              {ERROR_MESSAGES[error] ?? 'Die Anmeldung ist fehlgeschlagen.'}
            </p>
            <Link to="/login" className="font-semibold text-moos-700 underline">
              Zurück zur Anmeldung
            </Link>
          </>
        ) : (
          <p className="text-moos-500">Anmeldung wird abgeschlossen …</p>
        )}
      </Card>
      <AppVersion className="absolute inset-x-0 bottom-4" />
    </div>
  );
}
