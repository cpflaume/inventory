import type { ReactNode } from 'react';

/** Gemeinsames Layout für druckbare Blätter (Natur-Header, Print-Button). */
export function PrintSheet({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="print-sheet rounded-2xl bg-white p-8 shadow-sm ring-1 ring-moos-100">
        <div className="mb-6 flex items-center justify-between border-b border-moos-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-moos-800">{title}</h1>
            {subtitle && <p className="text-sm text-moos-500">{subtitle}</p>}
          </div>
          <span className="text-3xl">⛺</span>
        </div>
        {children}
        <p className="mt-8 border-t border-moos-100 pt-3 text-center text-xs text-moos-400">
          Jurtenburg · gedruckt am {new Date().toLocaleDateString('de-DE')}
        </p>
      </div>
      <div className="no-print mt-4 text-center">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-lagerfeuer-500 px-5 py-2 font-semibold text-white hover:bg-lagerfeuer-600"
        >
          🖨️ Drucken
        </button>
      </div>
    </div>
  );
}
