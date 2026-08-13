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
