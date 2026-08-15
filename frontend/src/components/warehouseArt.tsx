// Grafische Bausteine für das virtuelle Lager: prozedurale Holzmaserung,
// „tiefe" leere Regalfächer mit Fund-Grafiken und die Truhen-Darstellung der
// Kisten. Alles selbsttragend als Inline-SVG bzw. data-URI — keine Bildassets,
// damit Docker-Image und Tests schlank bleiben (siehe CLAUDE.md).

import type { CSSProperties, ReactNode } from 'react';

// --- Holzmaserung -----------------------------------------------------------

// feTurbulence erzeugt eine feine, sich wiederholende Maserung, die als
// halbtransparente dunkle Streifen über die CSS-Holzverläufe gelegt wird.
// `dir='v'` = stehende Maserung (Pfosten), `'h'` = liegende (Bretter/Fächer).
function grainUri(seed: number, dir: 'v' | 'h'): string {
  const freq = dir === 'v' ? '0.9 0.035' : '0.035 0.9';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>` +
    `<filter id='w'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='matrix' values='0 0 0 0 0.23 0 0 0 0 0.12 0 0 0 0 0.04 0.85 0 0 0 -0.34'/>` +
    `</filter>` +
    `<rect width='180' height='180' filter='url(#w)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Holzoberfläche als CSS-Style (Grundverlauf + Maserung). */
export function woodStyle(opts?: {
  seed?: number;
  dir?: 'v' | 'h';
  from?: string;
  to?: string;
}): CSSProperties {
  const { seed = 7, dir = 'h', from = '#a9793f', to = '#7a4e26' } = opts ?? {};
  const angle = dir === 'v' ? '90deg' : '178deg';
  return {
    backgroundImage: `${grainUri(seed, dir)}, linear-gradient(${angle}, ${from}, ${to})`,
    backgroundSize: '180px 180px, cover',
  };
}

// --- Leere Regalfächer ------------------------------------------------------

// Fund-Grafiken, die ein leeres Fach gelegentlich optisch beleben. Nicht jedes
// Fach bekommt etwas — die `null`-Einträge lassen das Fach bewusst leer, damit
// nicht in jedem Fach zwanghaft eine Grafik liegt. Per Seed stabil pro Fach.
const EMPTY_ART: (null | (() => ReactNode))[] = [cobweb, leaf, acorn, null, null, null];

/**
 * Deko für ein leeres Fach: der „tiefe" Innenraum (dunkler Verlauf +
 * Innenschatten) kommt vom Fach selbst. Hier liegt – falls überhaupt – eine
 * per Seed gewählte Fund-Grafik darüber; sonst bleibt das Fach leer.
 */
export function EmptyCellArt({ seed }: { seed: number }) {
  const Art = EMPTY_ART[((seed % EMPTY_ART.length) + EMPTY_ART.length) % EMPTY_ART.length];
  if (!Art) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Art />
    </span>
  );
}

// Gemeinsamer SVG-Rahmen: füllt das Fach, leichte Vignette für Tiefe.
function Scene({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="art-vig" cx="50%" cy="38%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.32" />
        </radialGradient>
      </defs>
      {children}
      <rect x="0" y="0" width="100" height="100" fill="url(#art-vig)" />
    </svg>
  );
}

// Spinnweben in der oberen Ecke – radiale Fäden + Bögen.
function cobweb() {
  const cx = 4;
  const cy = 4;
  const spokes = [10, 26, 42, 58, 74, 88].map((deg) => (deg * Math.PI) / 180);
  const R = 78;
  return (
    <Scene>
      <g stroke="#f4f1ea" strokeOpacity="0.5" strokeWidth="0.5" fill="none" strokeLinecap="round">
        {spokes.map((a, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} />
        ))}
        {[16, 30, 46, 64].map((r, i) => {
          const pts = spokes
            .map((a) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`)
            .join(' ');
          return <polyline key={`ring-${i}`} points={pts} strokeOpacity={0.42 - i * 0.05} />;
        })}
        {/* kleines Spinnentier am äußersten Faden */}
        <g stroke="#e9e5da" strokeOpacity="0.55">
          <circle cx={cx + Math.cos(spokes[3]) * 52} cy={cy + Math.sin(spokes[3]) * 52} r="1.6" fill="#3a2f26" stroke="none" />
        </g>
      </g>
    </Scene>
  );
}

// Trockenes Herbstblatt in der Ecke.
function leaf() {
  return (
    <Scene>
      <ellipse cx="58" cy="84" rx="26" ry="4.5" fill="#000" fillOpacity="0.24" />
      <defs>
        <linearGradient id="leaf-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c98a3c" />
          <stop offset="100%" stopColor="#8a4a1c" />
        </linearGradient>
      </defs>
      <g transform="rotate(24 56 66)">
        <path
          d="M56 40 C 74 48 78 74 56 88 C 34 74 38 48 56 40 Z"
          fill="url(#leaf-fill)"
          stroke="#5f3213"
          strokeWidth="0.8"
        />
        {/* Mittelrippe + Adern */}
        <path d="M56 42 L 56 86" stroke="#4a2810" strokeWidth="0.9" fill="none" />
        {[52, 60, 68, 76].map((y, i) => (
          <g key={i} stroke="#5a3115" strokeWidth="0.5" fill="none">
            <path d={`M56 ${y} L ${56 - 9 - i} ${y + 6}`} />
            <path d={`M56 ${y} L ${56 + 9 + i} ${y + 6}`} />
          </g>
        ))}
        {/* Stiel */}
        <path d="M56 88 q -1 6 -4 9" stroke="#4a2810" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    </Scene>
  );
}

// Vergessene Eichel – noch etwas Waldiges für die Vielfalt.
function acorn() {
  return (
    <Scene>
      <ellipse cx="50" cy="83" rx="20" ry="4" fill="#000" fillOpacity="0.26" />
      <defs>
        <linearGradient id="acorn-nut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c98b4a" />
          <stop offset="100%" stopColor="#8a5322" />
        </linearGradient>
        <linearGradient id="acorn-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5228" />
          <stop offset="100%" stopColor="#4e3115" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 50 66)">
        {/* Nuss */}
        <path d="M40 58 h20 v10 a10 12 0 0 1 -20 0 Z" fill="url(#acorn-nut)" stroke="#5f3a17" strokeWidth="0.7" />
        <path d="M50 68 v11" stroke="#5f3a17" strokeWidth="0.6" />
        {/* Hütchen */}
        <path d="M38 58 a12 8 0 0 1 24 0 Z" fill="url(#acorn-cap)" stroke="#3d2610" strokeWidth="0.7" />
        <g stroke="#3d2610" strokeOpacity="0.5" strokeWidth="0.4">
          <path d="M42 54 h16 M40 57 h20 M44 51 h12" />
        </g>
        {/* Stiel */}
        <path d="M50 50 v-6" stroke="#3d2610" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </Scene>
  );
}

// --- Kiste als Holztruhe ----------------------------------------------------

/**
 * Truhen-Grafik, die eine Kiste als Kachel-Hintergrund füllt. Beschriftung &
 * Zähler liegen als HTML darüber (bleiben scharf und barrierefrei bedienbar).
 */
export function ChestArt({ seed = 0 }: { seed?: number }) {
  // leichte Tonvariation je Kiste, damit nicht alle Truhen identisch wirken.
  const tone = [
    { a: '#b9823f', b: '#6f4520' },
    { a: '#a9793f', b: '#5f3a1c' },
    { a: '#c0894a', b: '#754826' },
  ][((seed % 3) + 3) % 3];
  const uid = `chest${((seed % 997) + 997) % 997}`;
  return (
    <svg
      viewBox="0 0 100 76"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.a} />
          <stop offset="100%" stopColor={tone.b} />
        </linearGradient>
        <linearGradient id={`${uid}-lidg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c68f4d" />
          <stop offset="100%" stopColor={tone.a} />
        </linearGradient>
        <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a4a4f" />
          <stop offset="50%" stopColor="#2c2c30" />
          <stop offset="100%" stopColor="#3a3a3f" />
        </linearGradient>
        <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2cf6b" />
          <stop offset="100%" stopColor="#a9781f" />
        </linearGradient>
      </defs>

      {/* Korpus */}
      <rect x="6" y="30" width="88" height="42" rx="3" fill={`url(#${uid}-body)`} stroke="#3d2610" strokeWidth="1.4" />
      {/* Bretterfugen im Korpus */}
      <g stroke="#3d2610" strokeOpacity="0.35" strokeWidth="0.8">
        <path d="M6 44 H94 M6 58 H94" />
      </g>

      {/* Deckel (gewölbt) */}
      <path
        d="M6 30 Q 6 10 50 10 Q 94 10 94 30 Z"
        fill={`url(#${uid}-lidg)`}
        stroke="#3d2610"
        strokeWidth="1.4"
      />
      {/* Deckel-Highlight */}
      <path d="M12 27 Q 14 15 50 15 Q 86 15 88 27" fill="none" stroke="#e7bd7d" strokeOpacity="0.5" strokeWidth="1" />

      {/* Metallbänder senkrecht */}
      {[24, 76].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 4} 72 v-42 q 0 -18 4 -20 q 4 2 4 20 v42 Z`}
            fill={`url(#${uid}-band)`}
            stroke="#1e1e22"
            strokeWidth="0.6"
          />
          {/* Nieten */}
          {[34, 48, 62].map((y) => (
            <circle key={y} cx={x} cy={y} r="1.1" fill="#d9d9de" fillOpacity="0.7" />
          ))}
        </g>
      ))}

      {/* horizontales Band an der Deckelkante */}
      <rect x="6" y="27" width="88" height="6" fill={`url(#${uid}-band)`} stroke="#1e1e22" strokeWidth="0.5" />

      {/* Schloss */}
      <rect x="44" y="34" width="12" height="12" rx="1.5" fill={`url(#${uid}-brass)`} stroke="#5a3d0c" strokeWidth="0.7" />
      <circle cx="50" cy="40" r="1.6" fill="#3d2610" />
      <rect x="49" y="40" width="2" height="4" fill="#3d2610" />
    </svg>
  );
}
