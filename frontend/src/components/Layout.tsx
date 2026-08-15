import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const tabs = [
  { to: '', label: 'Lager', icon: '🏕️', end: true },
  { to: 'material', label: 'Material', icon: '🎒' },
  { to: 'bausaetze', label: 'Bausätze', icon: '⛺' },
  { to: 'mangel', label: 'Mängel', icon: '🐛' },
];

export default function Layout() {
  const { depotId = '' } = useParams();
  const { data: depot } = useQuery({
    queryKey: ['depot', depotId],
    queryFn: () => api.getDepot(depotId),
    enabled: !!depotId,
  });

  return (
    <div className="mx-auto min-h-screen max-w-5xl pb-24">
      <header className="no-print sticky top-0 z-30 flex items-center gap-3 bg-moos-700 px-4 py-3 text-white shadow-md">
        <NavLink to="/" className="text-xl" title="Zur Lager-Auswahl">
          ⛺
        </NavLink>
        <div className="leading-tight">
          <p className="text-xs uppercase tracking-wide text-moos-200">Jurtenburg</p>
          <p className="font-semibold">{depot?.name ?? 'Lager'}</p>
        </div>
      </header>

      <main className="px-4 pt-4">
        <Outlet />
      </main>

      {/* Mobile-first: Tab-Leiste unten, daumenfreundlich. */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-5xl justify-around border-t border-moos-100 bg-white/95 py-2 backdrop-blur">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-lg px-3 py-1 text-xs font-medium ${
                isActive ? 'text-moos-700' : 'text-moos-400'
              }`
            }
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
