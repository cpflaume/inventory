// Zeigt das automatisch zugeordnete Icon eines Gegenstands (siehe itemIcons.ts)
// als gerahmte Moos-Kachel — für Listen, Detailansicht und die Live-Vorschau
// im Anlege-Formular.

import { iconForItem, type IconVariant } from './itemIcons';

const SIZES = {
  // Sehr kleine Kachel → filled-Silhouette (bleibt bei 18px klar erkennbar);
  // größere Ansichten zeigen die detailreichere outline-Variante.
  sm: { box: 'h-8 w-8 rounded-lg', icon: 18, variant: 'filled' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 22, variant: 'outline' },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 34, variant: 'outline' },
} as const satisfies Record<string, { box: string; icon: number; variant: IconVariant }>;

export function ItemIcon({
  name,
  size = 'md',
  className = '',
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dim = SIZES[size];
  const { Icon, label } = iconForItem(name, dim.variant);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-moos-100 text-moos-700 ring-1 ring-moos-200 ${dim.box} ${className}`}
      // Erkanntes Motiv als Tooltip; leer, solange nichts passt (Fallback-Icon).
      title={label ? `Symbol: ${label}` : undefined}
    >
      <Icon size={dim.icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
