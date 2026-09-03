// Basis für das eigene Pfadfinder- & Zelten-Icon-Set. Ersetzt lucide-react für
// die automatischen Gegenstands-Grafiken (siehe itemIcons.ts). Jede Grafik ist
// Inline-SVG (kein Bildasset, tree-shakeable) und liegt in zwei Varianten vor:
//   • outline – Linien-Version (stroke = currentColor), für größere Ansichten
//     und das virtuelle Regal, wo Details lesbar bleiben.
//   • filled  – gefüllte Silhouette (fill = currentColor), die auch sehr klein
//     (Listen) noch klar erkennbar ist.
// Die Prop-Schnittstelle (size / strokeWidth / className / aria-*) ist bewusst
// lucide-kompatibel, damit die Aufrufer unverändert bleiben.

import type { FC, ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Kantenlänge in px (quadratisch). */
  size?: number | string;
  /** Linienstärke der outline-Variante (bei filled ohne Wirkung). */
  strokeWidth?: number | string;
}

export type IconComponent = FC<IconProps>;

/** Ein Motiv in beiden Darstellungen. */
export interface IconMotif {
  outline: IconComponent;
  filled: IconComponent;
}

/** Baut eine outline-Grafik (Linien, keine Füllung). */
export function outlineIcon(name: string, children: ReactNode): IconComponent {
  const Comp: IconComponent = ({ size = 24, strokeWidth = 2, className, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
  Comp.displayName = `${name}Outline`;
  return Comp;
}

/** Baut eine gefüllte Grafik (Silhouette, currentColor). */
export function filledIcon(name: string, children: ReactNode): IconComponent {
  const Comp: IconComponent = ({ size = 24, className, strokeWidth: _sw, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
  Comp.displayName = `${name}Filled`;
  return Comp;
}

/** Bündelt outline + filled zu einem Motiv. */
export function motif(name: string, outline: ReactNode, filled: ReactNode): IconMotif {
  return { outline: outlineIcon(name, outline), filled: filledIcon(name, filled) };
}
