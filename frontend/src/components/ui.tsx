import type { ConditionFlag } from '../api/types';
import type { ReactNode } from 'react';

/** Zustands-Ampel als Punkt. */
export function ConditionDot({ flag, title }: { flag: ConditionFlag; title?: string }) {
  const color =
    flag === 'GREEN' ? 'bg-moos-500' : flag === 'YELLOW' ? 'bg-lagerfeuer-400' : 'bg-red-500';
  const label =
    flag === 'GREEN' ? 'einsatzbereit' : flag === 'YELLOW' ? 'kleine Macke' : 'defekt';
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${color}`}
      title={title ?? label}
      aria-label={label}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/90 shadow-sm ring-1 ring-moos-100 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'fire';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-moos-600 text-white hover:bg-moos-700',
    ghost: 'bg-moos-100 text-moos-800 hover:bg-moos-200',
    fire: 'bg-lagerfeuer-500 text-white hover:bg-lagerfeuer-600',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-moos-200 p-10 text-center text-moos-500">
      <span className="text-4xl">{emoji}</span>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

/** Einheitliche Feld-Optik für Text-/Zahl-/Select-Eingaben. */
export const inputClass =
  'w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500';

/** GitHub-Repo der Anwendung — Ziel des Links in der Versionsanzeige. */
const REPO_URL = 'https://github.com/cpflaume/inventory';

/** GitHub-Logo als kleines Inline-Icon. */
function GitHubIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Zentrierte Versionsanzeige (Release-Tag, zur Build-Zeit injiziert — siehe vite.config.ts) mit Link zum GitHub-Repo. */
export function AppVersion({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex items-center justify-center gap-1.5 text-center text-xs text-moos-400 ${className}`}
    >
      <span>Version {__APP_VERSION__}</span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer noopener"
        title="Zum GitHub-Repository"
        aria-label="GitHub-Repository öffnen"
        className="inline-flex items-center gap-1 text-moos-400 transition hover:text-moos-600"
      >
        <GitHubIcon />
        <span>GitHub</span>
      </a>
    </p>
  );
}

/**
 * Gemeinsame Modal-Hülle: mobil ein Bottom-Sheet, ab `sm` zentriert. `minHalf`
 * erzwingt mindestens halbe Bildschirmhöhe (für Kisten-/Fach-Ansichten).
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  minHalf,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  minHalf?: boolean;
}) {
  return (
    <div
      className="no-print fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl ${
          minHalf ? 'min-h-[50vh]' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-moos-100 px-5 py-3">
          <h3 className="font-bold text-moos-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-xl leading-none text-moos-400 hover:text-moos-600"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-moos-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
