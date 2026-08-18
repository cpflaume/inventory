import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppVersion, Button, Card } from '../components/ui';

/**
 * Freundliche, lager-thematische Fehlerseite. Fängt sowohl abgestürzte Routen
 * (`errorElement`) als auch unbekannte Pfade (Catch-all `*`) ab und ersetzt so
 * die nüchterne Whitelabel-Standardseite. Bewusst mit einer Prise Humor —
 * am Lagerfeuer trägt man Pannen mit Fassung.
 */

type Scene = { emoji: string; code: string; title: string; quip: string };

const NOT_FOUND: Scene = {
  emoji: '🗺️',
  code: '404',
  title: 'Diese Kiste ist unauffindbar',
  quip: 'Wir haben jedes Regalfach durchwühlt — die Seite bleibt verschollen. Vermutlich noch im Anhänger vom letzten Lager.',
};

const CRASH: Scene = {
  emoji: '🔥',
  code: '500',
  title: 'Da ist das Lagerfeuer kurz übergesprungen',
  quip: 'Ein unerwarteter Fehler hat sich ins Gepäck geschmuggelt. Wir schütten schon einen Eimer Wasser drauf — probier es gern gleich noch einmal.',
};

export default function ErrorPage() {
  const error = useRouteError();

  // 404 kommt entweder als Route-Response (kein Match) oder über die Catch-all-Route
  // ganz ohne Fehlerobjekt. Alles andere behandeln wir als echten Absturz.
  const is404 = !error || (isRouteErrorResponse(error) && error.status === 404);
  const scene = is404 ? NOT_FOUND : CRASH;

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 pb-10">
      <div className="mb-6 text-center">
        <div className="text-6xl">{scene.emoji}</div>
        <p className="mt-3 text-5xl font-black tracking-tight text-moos-300">{scene.code}</p>
        <h1 className="mt-1 text-2xl font-bold text-moos-800">{scene.title}</h1>
      </div>
      <Card className="p-6 text-center">
        <p className="text-moos-600">{scene.quip}</p>
        {detail && (
          <p className="mt-4 rounded-xl bg-moos-50 px-3 py-2 font-mono text-xs text-moos-400">
            {detail}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button>Zurück zum Lagerplatz</Button>
          </Link>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Neu versuchen
          </Button>
        </div>
      </Card>
      <p className="mt-4 text-center text-sm text-moos-500">
        Bleibt der Fehler hartnäckig, ruf den Lagerleiter — oder mach kurz Pause am Feuer. 🏕️
      </p>
      <AppVersion className="absolute inset-x-0 bottom-4" />
    </div>
  );
}
