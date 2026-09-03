// Motiv-Datenbank des Pfadfinder- & Zelten-Icon-Sets. Jedes Motiv liegt als
// outline (Linie) und filled (Silhouette) vor – siehe base.tsx. Nachgezeichnet
// nach dem hausinternen Icon-Set (Pfadfinder, Zelt & Lager, Ausrüstung,
// Navigation). Zeichenfläche 24×24, Inhalt grob im Bereich 2…22.
//
// Die filled-Variante ist bewusst eine vereinfachte Vollflächen-Silhouette:
// feine Innendetails der outline-Version entfallen, damit das Symbol auch sehr
// klein (Listen) klar bleibt.

import { motif } from './base';

export const MOTIFS = {
  // ============================ Pfadfinder ============================

  lilie: motif(
    'Lilie',
    <>
      <path d="M12 2c-1.5 2.2-1.5 5.6 0 7.9 1.5-2.3 1.5-5.7 0-7.9z" />
      <path d="M12 9c-1.9-1.7-4.5-1.6-6 0-1.2 1.3-1.1 3.3.2 4.4 1.1 1 2.8 1 4-.1" />
      <path d="M12 9c1.9-1.7 4.5-1.6 6 0 1.2 1.3 1.1 3.3-.2 4.4-1.1 1-2.8 1-4-.1" />
      <path d="M12 9v10" />
      <path d="M8.2 13.4h7.6" />
      <path d="M9 19c1-1.7 5-1.7 6 0" />
    </>,
    <>
      <path d="M12 2c-1.5 2.2-1.5 5.6 0 7.9 1.5-2.3 1.5-5.7 0-7.9z" />
      <path d="M12.9 8.1c-2-1.7-4.7-1.6-6.2.1-1.3 1.5-1 3.7.6 4.7.7.4 1.5.5 2.3.3v5.4c-1-.2-2 .2-2.6 1.1h9.9c-.6-.9-1.6-1.3-2.6-1.1v-5.4c.8.2 1.6.1 2.3-.3 1.6-1 1.9-3.2.6-4.7-1.5-1.7-4.2-1.8-6.2-.1l-.9 1z" />
      <path d="M8 12.6h8v1.6H8z" />
    </>,
  ),

  halstuch: motif(
    'Halstuch',
    <>
      <path d="M4 6c2 3 5 5 8 5s6-2 8-5" />
      <path d="M9 10l3 4 3-4" />
      <circle cx="12" cy="15" r="1.6" />
      <path d="M10.5 16.5l1.5 4.5 1.5-4.5" />
    </>,
    <>
      <path d="M4 6c2 3 5 5 8 5s6-2 8-5l-1.8-1C16.6 7.4 14.5 8.8 12 8.8S7.4 7.4 5.8 5z" />
      <path d="M8.8 9.6 12 14l3.2-4.4-1.6-.5-1.6 2.2-1.6-2.2z" />
      <circle cx="12" cy="15" r="1.9" />
      <path d="M10.2 17 12 21.5l1.8-4.5z" />
    </>,
  ),

  kluft: motif(
    'Kluft',
    <>
      <path d="M8 3l4 3 4-3 4 3-2 3-1-1v11H7V8L6 9 4 6z" />
      <path d="M12 6v14" />
      <path d="M12 9l1.5 1.5M12 12l1.5 1.5" />
    </>,
    <>
      <path d="M8 3l4 3 4-3 4 3-2.4 3.2L16 8v12h-3V6.6L12 7l-1-.4V20H8V8l-1.6 1.2L4 6z" />
    </>,
  ),

  wimpel: motif(
    'Wimpel',
    <>
      <path d="M6 3v18" />
      <path d="M6 4h12l-4 4 4 4H6" />
    </>,
    <>
      <rect x="5" y="3" width="2" height="18" rx="1" />
      <path d="M7 4h11l-4 4 4 4H7z" />
    </>,
  ),

  kompass: motif(
    'Kompass',
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5.5-5 2 2-5.5z" />
      <circle cx="12" cy="12" r="1" />
    </>,
    <>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.9 6.1L13.5 14 8 16l2.5-5.5z" />
      <circle cx="12" cy="12" r="1.3" fill="none" />
    </>,
  ),

  karte: motif(
    'Karte',
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
      <path d="M6.5 9l3 3 2-2 3 3" strokeDasharray="1.5 1.5" />
      <path d="M11 8l1 1-1 1-1-1z" />
    </>,
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zm-.5 1.8l4 1.3v11l-4-1.3zm5 1.3l3.5-1.1v11l-3.5 1.1z" />
    </>,
  ),

  wegweiser: motif(
    'Wegweiser',
    <>
      <path d="M12 3v18" />
      <path d="M12 6H6L4 8l2 2h6" />
      <path d="M12 12h6l2 2-2 2h-6" />
    </>,
    <>
      <rect x="11" y="3" width="2" height="18" rx="1" />
      <path d="M11 5.5H6L3.5 8 6 10.5h5z" />
      <path d="M13 11.5h5l2.5 2.5-2.5 2.5h-5z" />
    </>,
  ),

  lagerfeuer: motif(
    'Lagerfeuer',
    <>
      <path d="M12 3c1.5 2 3 3.6 3 6a3 3 0 0 1-6 0c0-1 .4-1.8 1-2.5.2 1 .8 1.5 1.4 1.7C11.5 6.5 11 5 12 3z" />
      <path d="M4 19l16-4M4 15l16 4" />
    </>,
    <>
      <path d="M12 3c1.7 2.2 3.2 3.9 3.2 6.3A3.2 3.2 0 0 1 12 12.5a3.2 3.2 0 0 1-3.2-3.2c0-1 .4-2 1.1-2.8.1 1.1.7 1.7 1.4 2C11.4 6.7 11 5.1 12 3z" />
      <path d="M3.7 18l16.6-4.1.5 1.9L4.2 20zM3.5 15.9 20.1 20l-.5 1.9L3 17.8z" />
    </>,
  ),

  zelt: motif(
    'Zelt',
    <>
      <path d="M12 4L3 20h18z" />
      <path d="M12 4v16" />
      <path d="M12 12l-4 8M12 12l4 8" />
    </>,
    <>
      <path d="M12.9 4.5 21 20h-8V9.5z" />
      <path d="M11.1 4.5 3 20h8V9.5z" />
    </>,
  ),

  kothe: motif(
    'Kothe',
    <>
      <path d="M12 3L4 20h16z" />
      <path d="M12 3v17" />
      <path d="M12 3l6 8M12 3l-6 8" />
      <path d="M5.5 16.5h13" />
    </>,
    <>
      <path d="M12 3 4 20h16zm0 3.4L16.7 14h-9.4z" />
    </>,
  ),

  jurte: motif(
    'Jurte',
    <>
      <path d="M12 3l-4 4h8z" />
      <path d="M8 7L4 11h16l-4-4" />
      <path d="M4 11v9h16v-9" />
      <path d="M8 11v9M16 11v9M12 11v9" />
    </>,
    <>
      <path d="M12 3 7.5 7h9z" />
      <path d="M8 7 3.5 11.2h17L16 7z" />
      <path d="M4 11.5h16V20h-4v-6h-3v6h-2v-6H8v6H4z" />
    </>,
  ),

  rucksack: motif(
    'Rucksack',
    <>
      <path d="M7 8a5 5 0 0 1 10 0v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
      <rect x="9.5" y="12" width="5" height="4" rx="1" />
      <path d="M7 14H5v3M17 14h2v3" />
    </>,
    <>
      <path d="M7 9a5 5 0 0 1 10 0v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm2.5-1a2.5 2.5 0 0 1 5 0zm0 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
      <path d="M6 13H4.5v4h1.5zm12 0h1.5v4H18z" />
    </>,
  ),

  affe: motif(
    'Rucksack Affe',
    <>
      <rect x="6" y="8" width="12" height="13" rx="2" />
      <path d="M6 12h12M6 17h12" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M9.5 4l1.5 1.5M13 5.5L14.5 4" />
    </>,
    <>
      <path d="M6 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm3-2V6a3 3 0 0 1 6 0v1h-1.6V6a1.4 1.4 0 0 0-2.8 0v1z" fillRule="evenodd" />
    </>,
  ),

  // ============================ Schlafen & Zelt-Zubehör ============================

  schlafsack: motif(
    'Schlafsack',
    <>
      <path d="M6 5c-1.5 1-2 3-2 6v6a4 4 0 0 0 4 4h9a2 2 0 0 0 2-2c0-6-1-11-4-13" />
      <path d="M9 5l7 3M8 9l8 3M8 13l8 2" />
    </>,
    <>
      <path d="M6.5 5C5 6 4.2 8.2 4.2 11.4V17a4 4 0 0 0 4 4H17a1.8 1.8 0 0 0 1.8-1.9c0-6.2-1.1-11-4.1-13.2z" />
    </>,
  ),

  isomatte: motif(
    'Isomatte',
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M14 8v8M17 8v8" />
      <circle cx="17.5" cy="12" r="1.5" />
    </>,
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <circle cx="17.5" cy="12" r="1.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M13.5 8v8" stroke="#fff" strokeWidth="1.2" />
    </>,
  ),

  plane: motif(
    'Plane',
    <>
      <path d="M4 7l8-2 8 2-8 12z" />
      <circle cx="4" cy="7" r="1" />
      <circle cx="20" cy="7" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>,
    <>
      <path d="M4 7l8-2 8 2-8 12z" />
    </>,
  ),

  hering: motif(
    'Hering',
    <>
      <path d="M9 3l3 3-6 12-1.5-.5" />
      <path d="M8 4.5l3 3" />
      <path d="M6 18l-1.5 3" />
    </>,
    <>
      <path d="M8.6 3 12 6.4 6.6 17.2 4.4 16.3 8.6 3zM5.8 18l-1.6 3.1 1.8.6L7.4 18.7z" />
    </>,
  ),

  abspannseil: motif(
    'Abspannseil',
    <>
      <path d="M5 4v16" />
      <path d="M5 6c4 0 8 2 8 6s-4 6-8 6" />
      <rect x="11" y="9" width="4" height="6" rx="1" />
      <path d="M15 12h4" />
    </>,
    <>
      <rect x="4" y="4" width="2" height="16" rx="1" />
      <path d="M6 6c3.6.3 7 2.3 7 6s-3.4 5.7-7 6v-2c2.6-.3 5-1.7 5-4s-2.4-3.7-5-4z" />
      <rect x="11" y="9.5" width="4" height="5" rx="1" />
      <path d="M15 11.5h4v1.5h-4z" />
    </>,
  ),

  zeltstange: motif(
    'Zeltstange',
    <>
      <path d="M4 20L20 4" />
      <path d="M9 9l2 2M13 5l2 2" />
      <circle cx="20" cy="4" r="1.3" />
      <circle cx="4" cy="20" r="1.3" />
    </>,
    <>
      <path d="M3.3 19.3 19.3 3.3l1.4 1.4L4.7 20.7z" />
      <path d="M8 9l3 3-1 1-3-3zm4-4 3 3-1 1-3-3z" fill="#fff" />
    </>,
  ),

  hammer: motif(
    'Hammer',
    <>
      <path d="M6 9L3 6l3-3 3 3" />
      <path d="M4.5 7.5l4 4" />
      <path d="M7.5 10.5l3-3 11 11-3 3z" />
    </>,
    <>
      <path d="M6 9.4 2.6 6l3.4-3.4L9.4 6 8 7.4l1.4 1.4L7.4 10.8 6 9.4z" />
      <path d="M9.6 8.2 8.2 9.6l9.2 9.2c.4.4 1 .4 1.4 0l1.6-1.6c.4-.4.4-1 0-1.4z" />
    </>,
  ),

  // ============================ Feuer & Licht ============================

  kocher: motif(
    'Kocher',
    <>
      <rect x="8" y="11" width="8" height="4" rx="1" />
      <path d="M12 11V8" />
      <path d="M6 8h12l-3 3H9z" />
      <path d="M10 15v4h4v-4" />
      <path d="M9 19h6" />
    </>,
    <>
      <path d="M6.5 7.5h11L15 11H9z" />
      <rect x="8" y="11" width="8" height="4" rx="1" />
      <path d="M11 5h2v3h-2z" />
      <path d="M10 15h4v3.5h1.5V20h-7v-1.5H10z" />
    </>,
  ),

  hockerkocher: motif(
    'Hockerkocher',
    <>
      <rect x="6" y="6" width="12" height="4" rx="1" />
      <path d="M8 10v3M16 10v3M12 10v3" />
      <path d="M7 13h10" />
      <path d="M8 13l-2 6M16 13l2 6" />
      <path d="M6 19h12" />
    </>,
    <>
      <rect x="6" y="6" width="12" height="4" rx="1" />
      <path d="M7 12h10v1.6H7z" />
      <path d="M8.2 13.6 6.4 19H4.6l2-5.4zm7.6 0 1.8 5.4h1.8l-2-5.4z" />
      <path d="M5.5 19h13v1.6h-13z" />
    </>,
  ),

  laterne: motif(
    'Laterne',
    <>
      <path d="M10 3h4" />
      <path d="M9 6h6l1 2v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8z" />
      <path d="M8 8h8" />
      <path d="M8 15h8" />
      <path d="M12 4v2" />
    </>,
    <>
      <path d="M9.5 2.6h5v2h-5z" />
      <path d="M8 8h8l1-1.5V6H7v.5zM8 8v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8zm2 1.6h4a2 2 0 1 1-4 0z" fillRule="evenodd" />
    </>,
  ),

  stirnlampe: motif(
    'Stirnlampe',
    <>
      <path d="M3 12a9 5 0 0 1 18 0" />
      <rect x="10" y="9" width="6" height="6" rx="1" />
      <path d="M16 11l3-1M16 13l3 1" />
    </>,
    <>
      <path d="M3 12.5a9 5 0 0 1 6-4.7V15c-2.4-.3-4.6-1.3-6-2.5z" />
      <rect x="9.5" y="8.5" width="6.5" height="7" rx="1.2" />
      <path d="M16 10.5l3.5-1.2.5 1.4-3.5 1.2zm0 3 3.5 1.2-.5 1.4-3.5-1.2z" />
    </>,
  ),

  taschenlampe: motif(
    'Taschenlampe',
    <>
      <path d="M9 3h6l-1 4H10z" />
      <path d="M10 7h4v13a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" />
      <path d="M10.5 11h3" />
    </>,
    <>
      <path d="M9 2.6h6l-1 4.4h-4z" />
      <path d="M10 7.4h4V20a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm.5 3.2h3v1.4h-3z" fillRule="evenodd" />
    </>,
  ),

  feuerstahl: motif(
    'Feuerstahl',
    <>
      <path d="M5 19L15 9" />
      <rect x="13" y="4" width="3" height="7" rx="1.2" transform="rotate(45 14.5 7.5)" />
      <path d="M17 6l3-2M18 9l3-1M17 3l1-1" />
    </>,
    <>
      <path d="M4.4 18.6 13 10l1.4 1.4L5.8 20z" />
      <rect x="12.7" y="4" width="3.4" height="7.5" rx="1.4" transform="rotate(45 14.4 7.7)" />
      <path d="M16.6 6l3.4-2.3.9 1.3-3.4 2.3zm1 3 3.6-1.2.5 1.5L18.1 10z" />
    </>,
  ),

  streichhoelzer: motif(
    'Streichhölzer',
    <>
      <path d="M6 21L15 6" />
      <circle cx="16" cy="4.5" r="2" />
      <path d="M10 21L18 8" />
      <circle cx="19" cy="6.5" r="2" />
    </>,
    <>
      <path d="M5.4 20.6 14 6l1.7 1-8.6 14.6zm4.2.4L17 8.4l1.7 1L10.9 22z" />
      <circle cx="15.6" cy="4.6" r="2.2" />
      <circle cx="18.6" cy="6.6" r="2.2" />
    </>,
  ),

  feueranzuender: motif(
    'Feueranzünder',
    <>
      <rect x="5" y="9" width="14" height="8" rx="1" />
      <path d="M5 12h14M9 9v8M13 9v8" />
      <path d="M8 6c0 1.5 1 2 1 3M15 5c0 1.5-1 2.5-1 3.5" />
    </>,
    <>
      <rect x="5" y="9" width="14" height="8" rx="1" />
      <path d="M8.5 9v8M12.5 9v8" stroke="#fff" strokeWidth="1.2" />
      <path d="M5 12.5h14" stroke="#fff" strokeWidth="1.2" />
      <path d="M7.6 5.6c0 1.6 1 2.2 1 3.4M14.4 4.6c0 1.6-1 2.7-1 3.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  feuerkorb: motif(
    'Feuerkorb',
    <>
      <path d="M6 11h12l-1.5 7h-9z" />
      <path d="M6 11l-1.5-3M18 11l1.5-3" />
      <path d="M8 8c0-1.5 1.5-2 1.5-3.5M12 8c0-2 1.5-2.5 1.5-4M16 8c0-1.5-1.5-2-1.5-3.5" />
      <path d="M8 18l-1.5 3M16 18l1.5 3M12 18v3" />
    </>,
    <>
      <path d="M6 11h12l-1.5 7h-9z" />
      <path d="M4.5 8 6 11H4l-1.2-2.4zm15 0L18 11h2l1.2-2.4z" />
      <path d="M8 7.6c0-1.7 1.5-2.2 1.5-3.9M12 7.6c0-2.2 1.5-2.7 1.5-4.4M16 7.6c0-1.7-1.5-2.2-1.5-3.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.5 18 6 21.2M16.5 18 18 21.2M12 18v3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  // ============================ Kochen & Küche ============================

  topf: motif(
    'Kochtopf',
    <>
      <path d="M5 9h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M3 9h4M17 9h4" />
      <path d="M9 5c0 1 1.5 1 1.5 2M13 5c0 1-1.5 1-1.5 2" />
    </>,
    <>
      <path d="M5 9.5h14V16a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M2.5 8.5h5v2h-5zm14 0h5v2h-5z" />
      <path d="M9 4.8c0 1.1 1.5 1.1 1.5 2.2M13 4.8c0 1.1-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  pfanne: motif(
    'Pfanne',
    <>
      <circle cx="10" cy="13" r="6" />
      <path d="M15.5 11l6-2" />
      <path d="M10 9v0" />
    </>,
    <>
      <circle cx="10" cy="13" r="6" />
      <path d="M15.4 10.4l6.1-2 .6 1.9-6.1 2z" />
    </>,
  ),

  kessel: motif(
    'Kessel',
    <>
      <path d="M5 12a7 5 0 0 1 14 0v3a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M7 9c-1-1-2-1-3-2M16 8l3-3" />
      <path d="M10 6h4" />
    </>,
    <>
      <path d="M5 12.5a7 4.5 0 0 1 14 0V15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M9.5 5.5h5v2h-5z" />
      <path d="M16 8l3.2-3.2 1.3 1.3L17.3 9.3zM7.2 9.2C6.2 8.2 5.4 8 4.3 7.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  tasse: motif(
    'Tasse',
    <>
      <path d="M6 8h11v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path d="M17 10h2a2 2 0 0 1 0 4h-2" />
    </>,
    <>
      <path d="M6 8h11v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path d="M17 9.6h2.2a2.4 2.4 0 0 1 0 4.8H17v-1.8h2a.7.7 0 0 0 0-1.4h-2z" />
    </>,
  ),

  feldflasche: motif(
    'Feldflasche',
    <>
      <path d="M9 3h4v2l1 1a5 5 0 0 1 1 3v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8a5 5 0 0 1 1-3l1-1z" />
      <path d="M9 5h4" />
      <circle cx="14.5" cy="7" r="1.2" />
    </>,
    <>
      <path d="M9 2.6h4v2.6l1 1a5 5 0 0 1 1 3.2V19a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.4a5 5 0 0 1 1-3.2l1-1z" />
      <path d="M8.6 4.6h4.8v1.6H8.6z" fill="#fff" />
    </>,
  ),

  trinkflasche: motif(
    'Trinkflasche',
    <>
      <path d="M9 6h6v3l-1 2v8a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-8l-1-2z" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M9.5 13h5" />
    </>,
    <>
      <rect x="9" y="2.6" width="6" height="3.4" rx="1" />
      <path d="M9 6h6v3.2l-1 2V19a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-7.8l-1-2z" />
      <path d="M9.5 12.6h5v1.4h-5z" fill="#fff" />
    </>,
  ),

  wasserkanister: motif(
    'Wasserkanister',
    <>
      <rect x="5" y="7" width="12" height="13" rx="2" />
      <path d="M13 7V5h3v2" />
      <path d="M17 11h2v4h-2" />
      <path d="M8 11h4" />
    </>,
    <>
      <path d="M5 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm8-2V5.2c0-.7.5-1.2 1.2-1.2h1.6c.7 0 1.2.5 1.2 1.2V7z" />
      <path d="M17 11h2.2v4H17z" />
      <path d="M7.6 10.6h4v1.6h-4z" fill="#fff" />
    </>,
  ),

  kanister: motif(
    'Kanister',
    <>
      <path d="M6 8h9l3 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <path d="M9 8V6h4v2" />
      <path d="M15 8v3h3" />
    </>,
    <>
      <path d="M6 8h9l3 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm3 0V6.2c0-.7.5-1.2 1.2-1.2h1.6c.7 0 1.2.5 1.2 1.2V8z" fillRule="evenodd" />
    </>,
  ),

  gasflasche: motif(
    'Gasflasche',
    <>
      <path d="M8 8a4 4 0 0 1 8 0v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <rect x="10" y="3" width="4" height="3" rx="1" />
      <path d="M11 3.5h2" />
    </>,
    <>
      <path d="M8 8.5a4 4 0 0 1 8 0V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <rect x="9.6" y="2.6" width="4.8" height="3.4" rx="1" />
      <path d="M10.5 3.4h3v1.2h-3z" fill="#fff" />
    </>,
  ),

  gaskartusche: motif(
    'Gaskartusche',
    <>
      <rect x="8" y="8" width="8" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M10.5 6h3" />
      <path d="M8 12h8" />
    </>,
    <>
      <rect x="8" y="8" width="8" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2h-1.6V6a1.4 1.4 0 0 0-2.8 0v2z" fillRule="evenodd" />
      <path d="M8 12h8v1.4H8z" fill="#fff" />
    </>,
  ),

  grillrost: motif(
    'Grillrost',
    <>
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <path d="M8 6v10M12 6v10M16 6v10M4 9.5h16M4 12.5h16" />
      <path d="M7 16v3M17 16v3" />
    </>,
    <>
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <path d="M8 6v10M12 6v10M16 6v10M4 9.5h16M4 12.5h16" stroke="#fff" strokeWidth="1.2" />
      <path d="M6.2 16h1.6v3.4H6.2zm10 0h1.6v3.4h-1.6z" />
    </>,
  ),

  dutchoven: motif(
    'Dutch Oven',
    <>
      <path d="M5 11h14v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M6 11l-.5-2h13l-.5 2" />
      <path d="M9 7a3 3 0 0 1 6 0" />
      <path d="M11.5 6.5h1" />
    </>,
    <>
      <path d="M5 11.2h14V15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M5.5 9h13l.5 1.8H5z" />
      <path d="M9 7a3 3 0 0 1 6 0h-1.6a1.4 1.4 0 0 0-2.8 0z" fillRule="evenodd" />
    </>,
  ),

  kohlezange: motif(
    'Kohlezange',
    <>
      <path d="M4 5c3 1 5 4 6 7M4 9c3-1 5-1 7 1" />
      <path d="M9.5 11.5l9 7" />
      <path d="M10.5 12.5c1 2 1.5 4 1 6M9 10.5c2-.5 4 0 5.5 1.5" />
      <circle cx="19" cy="19" r="1.6" />
    </>,
    <>
      <path d="M3.6 4.2C7 5.3 9.2 8.5 10.2 11.7l-1.9.6C7.4 9.5 5.6 6.9 3 6zm.2 3.9c3-1 5.4-1 7.6 1.3l-1.4 1.4c-1.6-1.7-3.4-1.7-5.6-.9z" />
      <circle cx="18.8" cy="18.8" r="2.2" />
      <path d="M9.5 11 18 17.6l-1.2 1.6L8.3 12.6z" />
    </>,
  ),

  topfheber: motif(
    'Topfheber',
    <>
      <path d="M4 6c4 0 6 3 8 6" />
      <path d="M4 10c3-1 6 0 8 3" />
      <path d="M11 9l8 8" />
      <circle cx="19.5" cy="17.5" r="1.5" />
    </>,
    <>
      <path d="M3.6 5C7.6 5.3 9.9 8.2 11.8 11.2l-1.7 1C8.3 9.3 6.4 7 3 7zm.4 4.2c3-.9 5.9.2 7.8 2.7l-1.5 1.2C8.8 11.4 6.8 10.7 4.5 11.4z" />
      <path d="M10.8 8.6 19 16.8l-1.4 1.4L9.4 10z" />
      <circle cx="19.4" cy="17.4" r="2" />
    </>,
  ),

  schoepfkelle: motif(
    'Schöpfkelle',
    <>
      <path d="M14 3v6" />
      <path d="M9 9h10a5 5 0 0 1-10 0z" />
    </>,
    <>
      <rect x="13" y="3" width="2" height="7" rx="1" />
      <path d="M8.5 9.2h11a5.5 5.5 0 0 1-11 0z" />
    </>,
  ),

  schneidebrett: motif(
    'Schneidebrett',
    <>
      <path d="M5 8h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5z" />
      <circle cx="5" cy="14" r="2" />
      <path d="M9 3l3 4M14 3l-2 4" />
    </>,
    <>
      <path d="M6 8h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6zm-1 3.8a2.2 2.2 0 1 0 0 4.4z" fillRule="evenodd" />
      <path d="M8.5 2.6 12 7l3.5-4.4 1.4 1.1L13.3 8H10.7L7.1 3.7z" />
    </>,
  ),

  besteck: motif(
    'Besteck',
    <>
      <path d="M7 3v18" />
      <path d="M5 3v5a2 2 0 0 0 4 0V3" />
      <path d="M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4z" />
      <path d="M17 3v18" />
    </>,
    <>
      <path d="M6 3h2v18H6z" />
      <path d="M4.5 3H6v5a2 2 0 0 1-4 0V3h1.5v4.5h1zM8 3h1.5v5a2 2 0 0 1-1.5 1.9z" fill="none" />
      <path d="M5 3v5a2 2 0 0 0 4 0V3H7.5v4.6h-1V3z" />
      <path d="M17.5 3v18H16v-8.9c-1.4-.4-2.2-2.1-2.2-4.1 0-2.6 1.2-4.6 2.9-5z" />
    </>,
  ),

  muellsack: motif(
    'Müllsack',
    <>
      <path d="M7 8c-.5 3-.5 8 .5 11a2 2 0 0 0 2 1.5h5a2 2 0 0 0 2-1.5c1-3 1-8 .5-11" />
      <path d="M6 8c1-2 3-2 6-2s5 0 6 2" />
      <path d="M9 5l1.5 3M15 5l-1.5 3" />
    </>,
    <>
      <path d="M6.8 8.2c-.5 3-.4 8 .6 11a2 2 0 0 0 1.9 1.4h5.4a2 2 0 0 0 1.9-1.4c1-3 1.1-8 .6-11z" />
      <path d="M5.8 8.4C6.9 6.2 9 6 12 6s5.1.2 6.2 2.4l-1.6.9C15.9 8 14.2 7.8 12 7.8s-3.9.2-4.6 1.5z" />
    </>,
  ),

  seife: motif(
    'Seife',
    <>
      <rect x="4" y="11" width="16" height="8" rx="3" />
      <path d="M13 6c0 1-1.5 1.5-1.5 3S13 11 13 11" />
      <path d="M9 8c0 .8-1 1-1 2" />
    </>,
    <>
      <rect x="4" y="11" width="16" height="8" rx="3" />
      <path d="M13 5.5c0 1.2-1.6 1.7-1.6 3.2S13 11 13 11M8.8 7.6c0 .9-1.1 1.2-1.1 2.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  handtuch: motif(
    'Handtuch',
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z" />
      <path d="M6 8H4a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h1" />
      <path d="M15 8v12M17 7h2" />
    </>,
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z" />
      <path d="M6 8H4a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h1z" />
      <path d="M14.6 8v12" stroke="#fff" strokeWidth="1.3" />
    </>,
  ),

  // ============================ Erste Hilfe & Sicherheit ============================

  erstehilfe: motif(
    'Erste Hilfe',
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M12 11v5M9.5 13.5h5" />
    </>,
    <>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm10.2 2.2h-2.4v2.6H8.2v2.4h2.6v2.6h2.4v-2.6h2.6v-2.4h-2.6z" fillRule="evenodd" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2h-1.6V5.6h-2.8V7z" />
    </>,
  ),

  pflaster: motif(
    'Pflaster',
    <>
      <rect x="2.5" y="9" width="19" height="6" rx="3" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M11 11h.01M13 11h.01M11 13h.01M13 13h.01" />
    </>,
    <>
      <rect x="2.5" y="9" width="19" height="6" rx="3" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M11 11h.4v.4H11zm2 0h.4v.4H13zm-2 2h.4v.4H11zm2 0h.4v.4H13z" fill="#fff" />
    </>,
  ),

  desinfektion: motif(
    'Desinfektion',
    <>
      <path d="M9 8h6v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      <path d="M10 8V6h4v2" />
      <path d="M11 3h3M12 3v3" />
      <path d="M12 12v3M10.5 13.5h3" />
    </>,
    <>
      <path d="M9 8h6v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zm2.2 3.6v1.7H9.5v2h1.7v1.7h1.6v-1.7h1.7v-2h-1.7v-1.7z" fillRule="evenodd" />
      <path d="M10 8V6.2c0-.7.5-1.2 1.2-1.2H11V3h2v2h-.2c.7 0 1.2.5 1.2 1.2V8z" />
    </>,
  ),

  verband: motif(
    'Verband',
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
    </>,
    <>
      <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8z" fillRule="evenodd" />
      <path d="M11.2 4h1.6v2.6h-1.6zm0 13.4h1.6V20h-1.6zM17.4 11.2H20v1.6h-2.6zM4 11.2h2.6v1.6H4z" fill="none" />
    </>,
  ),

  notfallpfeife: motif(
    'Notfallpfeife',
    <>
      <path d="M3 10a4 4 0 0 1 4-4h10l2 2-1 5a4 4 0 0 1-4 3H7a4 4 0 0 1-4-4z" />
      <circle cx="8" cy="11" r="2" />
      <path d="M14 6V3" />
    </>,
    <>
      <path d="M3 10.5a4 4 0 0 1 4-4h10l2 2-1 4.5a4 4 0 0 1-3.9 3H7a4 4 0 0 1-4-4zm5-1.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fillRule="evenodd" />
      <path d="M13.2 6V3h1.6v3z" />
    </>,
  ),

  signalhorn: motif(
    'Signalhorn',
    <>
      <path d="M3 10v4l7 3V7z" />
      <path d="M10 8c3 0 6 1.5 9-3v14c-3-4.5-6-3-9-3" />
      <path d="M6 14v3a1 1 0 0 0 1 1h1" />
    </>,
    <>
      <path d="M3 10v4l7 3V7z" />
      <path d="M10.5 7.7c2.8-.2 5.6-1 8.5-4.7v18c-2.9-3.7-5.7-4.5-8.5-4.7z" />
      <path d="M6 14.5v2.5a1 1 0 0 0 1 1h1.5v-1.6H7.6v-1.9z" />
    </>,
  ),

  funkgeraet: motif(
    'Funkgerät',
    <>
      <rect x="7" y="8" width="9" height="13" rx="2" />
      <rect x="9" y="10" width="5" height="3" rx="0.5" />
      <path d="M10 16h.01M12 16h.01M10 18h.01M12 18h.01" />
      <path d="M14 8V4l2-1" />
    </>,
    <>
      <path d="M7 10a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm2.4.4v2.4h4.2v-2.4z" fillRule="evenodd" />
      <path d="M13.2 8V4.4l2.4-1.2.7 1.4-1.5.8V8z" />
    </>,
  ),

  powerbank: motif(
    'Powerbank',
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M12 7l-2 4h4l-2 4" />
      <path d="M9 18h6" />
    </>,
    <>
      <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm6.6 1.4-3 5.1H12l-.8 4 3.4-5.4h-2.3z" fillRule="evenodd" />
      <path d="M9 18h6" stroke="#fff" strokeWidth="1.3" />
    </>,
  ),

  solarpanel: motif(
    'Solarpanel',
    <>
      <path d="M4 5h16l2 10H2z" transform="skewX(0)" />
      <path d="M3 15h18" />
      <path d="M8 5l-1 10M14 5l1 10M9 9h9M8 12h10" />
      <path d="M12 15v6M9 21h6" />
    </>,
    <>
      <path d="M4 5h16l2 10H2zm3.6 1.6L6.9 13.4h3.3l.3-6.8zm4.5 0 .3 6.8h3.3l-.7-6.8z" fillRule="evenodd" />
      <path d="M11.2 15h1.6v4.4H11.2z" />
      <path d="M8.6 21h6.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  // ============================ Navigation & Beobachtung ============================

  lupe: motif(
    'Lupe',
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="M14.5 14.5L20 20" />
    </>,
    <>
      <path d="M10 4a6 6 0 1 0 3.6 10.8l5 5 1.6-1.6-5-5A6 6 0 0 0 10 4zm0 2.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z" fillRule="evenodd" />
    </>,
  ),

  fernglas: motif(
    'Fernglas',
    <>
      <path d="M7 4h2a1 1 0 0 1 1 1v11a3 3 0 0 1-6 0V9z" />
      <path d="M17 4h-2a1 1 0 0 0-1 1v11a3 3 0 0 0 6 0V9z" />
      <path d="M10 8h4" />
      <path d="M9 4l-2 5M15 4l2 5" />
    </>,
    <>
      <path d="M7 4h2a1 1 0 0 1 1 1v11a3 3 0 0 1-6 0V9zm10 0h-2a1 1 0 0 0-1 1v11a3 3 0 0 0 6 0V9z" />
      <path d="M10 7.6h4v1.6h-4z" />
    </>,
  ),

  uhr: motif(
    'Uhr',
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9.5V13l2.5 1.5" />
      <path d="M9 3h6M12 3v3" />
    </>,
    <>
      <path d="M12 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm.9 3.2v3.4l2.3 1.4-.9 1.4-2.9-1.8V9.2z" fillRule="evenodd" />
      <path d="M9 2.6h6v1.8H9zM11.2 3h1.6v3h-1.6z" />
    </>,
  ),

  sonnenbrille: motif(
    'Sonnenbrille',
    <>
      <path d="M3 9h6a1 1 0 0 1 1 1v2a3 3 0 0 1-6 0v-2a1 1 0 0 1 1-1z" />
      <path d="M15 9h6a1 1 0 0 1 1 1v2a3 3 0 0 1-6 0v-2a1 1 0 0 1 1-1z" />
      <path d="M10 11h4" />
      <path d="M3 9l2-2M21 9l-2-2" />
    </>,
    <>
      <path d="M2.5 8.4h7a1 1 0 0 1 1 1V12a3.5 3.5 0 0 1-7 0V9.4a1 1 0 0 1 1-1zm12 0h7a1 1 0 0 1 1 1V12a3.5 3.5 0 0 1-7 0V9.4a1 1 0 0 1-1-1z" />
      <path d="M10 10.4h4v1.2h-4z" />
      <path d="M3 8.6 5.2 6.4M21 8.6 18.8 6.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  mueckenschutz: motif(
    'Mückenschutz',
    <>
      <path d="M9 9h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      <path d="M10 9V6h4v3" />
      <path d="M11 3h2" />
      <path d="M17 6l2-1M17 9h2.5M17 12l2 1" />
    </>,
    <>
      <path d="M9 9h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      <path d="M10 9V6.2c0-.7.5-1.2 1.2-1.2h.3V3h2v2h.3c.7 0 1.2.5 1.2 1.2V9z" />
      <path d="M17 5.8l2.2-1.1M16.8 8.4h2.7M17 11l2.2 1.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  // ============================ Kleidung ============================

  regenjacke: motif(
    'Regenjacke',
    <>
      <path d="M8 4l4 2 4-2 4 3-2 3-2-1.5V20H8V8.5L6 10 4 7z" />
      <path d="M12 6v14" />
      <path d="M12 6l-2 2 2 2" />
    </>,
    <>
      <path d="M8 4l4 2 4-2 4 3-2.4 3.2L16 9V20h-3.2V7.2L12 7.6l-.8-.4V20H8V9l-1.6 1.2L4 7z" fillRule="evenodd" />
    </>,
  ),

  regenponcho: motif(
    'Regenponcho',
    <>
      <path d="M12 3a4 4 0 0 1 4 4v0" />
      <path d="M12 5c-3 0-5 2-6 5l-1 9h14l-1-9c-1-3-3-5-6-5z" />
      <path d="M9 20l1-6M15 20l-1-6" />
    </>,
    <>
      <path d="M12 5c-3 0-5.2 2-6.1 5L4.8 20h14.4l-1.1-10c-.9-3-3.1-5-6.1-5zm0-2a4 4 0 0 1 4 4h-1.6a2.4 2.4 0 0 0-4.8 0H8a4 4 0 0 1 4-4z" fillRule="evenodd" />
    </>,
  ),

  hut: motif(
    'Hut',
    <>
      <path d="M8 13c-1-1-1-4 0-6s3-3 4-3 3 1 4 3 1 5 0 6" />
      <path d="M3 14c2 1.5 5.5 2.5 9 2.5s7-1 9-2.5" />
      <path d="M8 13c-2 .3-3.5.8-5 1.5M16 13c2 .3 3.5.8 5 1.5" />
    </>,
    <>
      <path d="M8 12.6c-1-1.2-1-4 0-6S11 3.6 12 3.6s3 1 4 3 1 4.8 0 6c2 .4 3.7.9 5.2 1.6-2.3 1.4-5.8 2.3-9.2 2.3s-6.9-.9-9.2-2.3C4.3 13.5 6 13 8 12.6z" />
    </>,
  ),

  muetze: motif(
    'Mütze',
    <>
      <path d="M5 16v-1a7 7 0 0 1 14 0v1" />
      <rect x="4" y="16" width="16" height="4" rx="1.5" />
      <path d="M12 4v4M12 4a1.5 1.5 0 1 1 0-.01" />
    </>,
    <>
      <path d="M5 16v-1a7 7 0 0 1 14 0v1z" />
      <rect x="4" y="15.6" width="16" height="4.4" rx="1.5" />
      <circle cx="12" cy="4" r="2" />
    </>,
  ),

  handschuhe: motif(
    'Handschuhe',
    <>
      <path d="M6 21v-6l-1-1a1.5 1.5 0 0 1 2-2l1 1V6a1.2 1.2 0 0 1 2.4 0v4M10.4 10V4.5a1.2 1.2 0 0 1 2.4 0V10M12.8 10V5.5a1.2 1.2 0 0 1 2.4 0V11c0 4-1 7-3 10" />
    </>,
    <>
      <path d="M6.4 21v-6.3l-1.3-1.3a1.4 1.4 0 0 1 2-2l.7.7V6a1.3 1.3 0 0 1 2.6 0v3.4h.6V4.5a1.3 1.3 0 0 1 2.6 0v4.9h.6V5.5a1.3 1.3 0 0 1 2.6 0V11c0 4.2-1 7.3-3 10z" />
    </>,
  ),

  stiefel: motif(
    'Stiefel',
    <>
      <path d="M9 3h3v9l6 3a3 3 0 0 1 2 3v2H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
      <path d="M12 12l-2 2M12 15l-2 2" />
    </>,
    <>
      <path d="M9 3h3v9l6.3 3.1A3 3 0 0 1 20 17.8V20H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
      <path d="M12 11.8l-2.4 2.4M12.4 14.6l-2.4 2.4" stroke="#fff" strokeWidth="1.2" />
    </>,
  ),

  gummistiefel: motif(
    'Gummistiefel',
    <>
      <path d="M8 3h3v10l4 2a4 4 0 0 1 2 3.5V21H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" />
      <path d="M4 10h7" />
    </>,
    <>
      <path d="M8 3h3v10l4.2 2.1A4 4 0 0 1 17 18.5V21H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" />
      <path d="M4 9.6h7v1.4H4z" fill="#fff" />
    </>,
  ),

  sandalen: motif(
    'Sandalen',
    <>
      <ellipse cx="12" cy="17" rx="8" ry="3" />
      <path d="M6 15c1-2 3-2 6-2s5 0 6 2" />
      <path d="M9 13l-1-4M15 13l1-4M12 13v-5" />
    </>,
    <>
      <path d="M4 17c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" />
      <path d="M9 13.5 8 9.2M15 13.5 16 9.2M12 13.4V8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  ),

  fleecejacke: motif(
    'Fleecejacke',
    <>
      <path d="M8 4l4 1 4-1 4 3-2 3-2-1v11h-8V9L6 10 4 7z" />
      <path d="M12 5v15" />
      <path d="M12 8h0M12 11h0M12 14h0" strokeDasharray="0.5 2" />
      <path d="M10 20v-9M14 20v-9" />
    </>,
    <>
      <path d="M8 4l4 1 4-1 4 3-2.2 3.2L16 9.4V20h-3.2V5.6L12 5.8l-.8-.2V20H8V9.4l-1.8 1.8L4 7z" fillRule="evenodd" />
    </>,
  ),

  tshirt: motif(
    'T-Shirt',
    <>
      <path d="M8 4l4 2 4-2 4 3-2.5 3L16 9v11H8V9l-1.5 1L4 7z" />
    </>,
    <>
      <path d="M8 4l4 2 4-2 4 3-2.5 3L16 9v11H8V9l-1.5 1L4 7z" />
    </>,
  ),

  hose: motif(
    'Hose',
    <>
      <path d="M6 3h12l-.5 8L16 21h-3l-1-9-1 9H8L6.5 11z" />
      <path d="M6 6h12" />
    </>,
    <>
      <path d="M6 3h12l-.5 8L16 21h-3l-1-9-1 9H8L6.5 11z" />
      <path d="M6 6h12" stroke="#fff" strokeWidth="1.2" />
    </>,
  ),

  guertel: motif(
    'Gürtel',
    <>
      <rect x="2" y="9" width="20" height="6" rx="1" />
      <rect x="9" y="8" width="6" height="8" rx="1" />
      <path d="M15 12h3" />
      <circle cx="12" cy="12" r="1" />
    </>,
    <>
      <path d="M2 10a1 1 0 0 1 1-1h5v6H3a1 1 0 0 1-1-1zm14-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-5z" />
      <path d="M9 8h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm3 2.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" fillRule="evenodd" />
    </>,
  ),

  // ============================ Werkzeug ============================

  axt: motif(
    'Axt',
    <>
      <path d="M6 21L15 8" />
      <path d="M13 4c3 0 6 2 6 5-2 0-3-1-5-1-1 1.5-1.5 3-3 4-1-1-1.5-2-1.5-4C11 6 12 4 13 4z" />
    </>,
    <>
      <path d="M5.4 20.6 14 8.4l1.6 1.2L7 21.8z" />
      <path d="M13 3.6c3.4 0 6.6 2.1 6.6 5.6-2.3 0-3.5-1.1-5.6-1.1-1.1 1.6-1.7 3.2-3.4 4.3-1.1-1.1-1.7-2.3-1.7-4.6 0-2.4 1.5-4.2 4.1-4.2z" />
    </>,
  ),

  saege: motif(
    'Säge',
    <>
      <path d="M4 8l14-3 2 2-13 4z" />
      <path d="M7 11l1 2 1-2 1 2 1-2 1 2 1-2 1 2 1-2" />
      <path d="M18 5l2 4" />
    </>,
    <>
      <path d="M4 8l14-3 2 2-13.5 4.2zm3 3.2.9 1.9.9-1.9.9 1.9.9-1.9.9 1.9.9-1.9.9 1.9.9-1.9.7 1.5-1.1 1.3H8.6l-.9-1.9-.9 1.9L5.6 12z" fillRule="evenodd" />
    </>,
  ),

  messer: motif(
    'Messer',
    <>
      <path d="M4 4c5 1 9 4 11 8l-2 2C9 11 6 7 4 4z" />
      <path d="M13 14l-4 4a2.8 2.8 0 0 1-4-4l2-2" />
    </>,
    <>
      <path d="M4 3.6c5.2 1 9.4 4.2 11.4 8.3l-2.2 2.2C11.2 10.4 7.2 6.4 4 3.6z" />
      <path d="M12.4 14.6l-3.6 3.6a2.8 2.8 0 0 1-4-4l1.9-1.9z" />
    </>,
  ),

  spaten: motif(
    'Spaten',
    <>
      <path d="M12 3v11" />
      <path d="M9 3h6" />
      <path d="M8 14h8l-1 4a3 3 0 0 1-6 0z" />
    </>,
    <>
      <rect x="11" y="3.5" width="2" height="11" rx="1" />
      <path d="M9 3h6v2H9z" />
      <path d="M7.6 14h8.8l-1.1 4.3a3.4 3.4 0 0 1-6.6 0z" />
    </>,
  ),

  // ============================ Seil & Verbindung ============================

  seil: motif(
    'Seil',
    <>
      <ellipse cx="12" cy="9" rx="6" ry="4" />
      <ellipse cx="12" cy="12" rx="6" ry="4" />
      <path d="M10 15.5c0 2-1 4-3 5M14 15.5c0 2 1 4 3 5" />
    </>,
    <>
      <path d="M12 5c-3.6 0-6.5 1.8-6.5 4S8.4 13 12 13s6.5-1.8 6.5-4S15.6 5 12 5zm0 2.2a3 1.8 0 1 1 0 3.6 3 1.8 0 0 1 0-3.6z" fillRule="evenodd" />
      <path d="M9.6 12.6c.2 2.5-.7 5-2.9 7.1M14.4 12.6c-.2 2.5.7 5 2.9 7.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  ),

  schnur: motif(
    'Schnur',
    <>
      <path d="M4 6c4 0 4 4 8 4s4-4 8-4" />
      <path d="M4 12c4 0 4 4 8 4s4-4 8-4" />
      <path d="M4 18c4 0 4 4 8 4" strokeDasharray="0" />
    </>,
    <>
      <path d="M4 5c4.4 0 4.4 4 8 4s3.6-4 8-4v2c-3.6 0-3.6 4-8 4s-4.4-4-8-4zm0 6c4.4 0 4.4 4 8 4s3.6-4 8-4v2c-3.6 0-3.6 4-8 4s-4.4-4-8-4z" />
    </>,
  ),

  knoten: motif(
    'Knoten',
    <>
      <path d="M7 4c4 2 4 10 0 12M17 4c-4 2-4 10 0 12" />
      <path d="M9 10c2 1 4 1 6 0M9 12c2-1 4-1 6 0" />
      <path d="M7 16l-2 4M17 16l2 4" />
    </>,
    <>
      <path d="M7 3.4C11.4 5.6 11.4 14 7 16.2l-1-1.7c3-1.6 3-8 0-9.6zM17 3.4c-4.4 2.2-4.4 10.6 0 12.8l1-1.7c-3-1.6-3-8 0-9.6z" />
      <path d="M8.6 9.4c2.2 1.1 4.6 1.1 6.8 0M8.6 12.6c2.2-1.1 4.6-1.1 6.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.6 16 4.6 20M17.4 16l2 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  ),

  karabiner: motif(
    'Karabiner',
    <>
      <path d="M12 3a6 6 0 0 1 0 12 4 4 0 0 1-4-4V6" />
      <path d="M12 3a6 6 0 0 0-6 6v9" />
      <path d="M6 18a2 2 0 0 0 4 0" />
    </>,
    <>
      <path d="M12 2.6a6.4 6.4 0 0 1 0 12.8 4.4 4.4 0 0 1-4.4-4.4V6h1.8v5c0 1.4 1.2 2.6 2.6 2.6a4.6 4.6 0 0 0 0-9.2 5.6 5.6 0 0 0-5.6 5.6v9H4.6v-9A7.4 7.4 0 0 1 12 2.6z" fillRule="evenodd" />
      <path d="M5.6 18a2.4 2.4 0 0 0 4.8 0H8.6a.6.6 0 0 1-1.2 0z" />
    </>,
  ),

  bandschlinge: motif(
    'Bandschlinge',
    <>
      <path d="M8 4c-3 4-3 12 0 16M16 4c3 4 3 12 0 16" />
      <path d="M8 4h8M8 20h8" />
      <path d="M10 9h4M10 15h4" />
    </>,
    <>
      <path d="M7.6 3.6h8.8l-.4 1.8H8zM7.6 20.4l.4-1.8h8l.4 1.8zM8.2 5.4C5.6 9.2 5.6 14.8 8.2 18.6l1.5-1C7.4 14.2 7.4 9.8 9.7 6.4zm7.6 0-1.5 1c2.3 3.4 2.3 7.8 0 11.2l1.5 1c2.6-3.8 2.6-9.4 0-13.2z" />
    </>,
  ),

  rettungsdecke: motif(
    'Rettungsdecke',
    <>
      <path d="M4 6l16 3-16 6z" />
      <path d="M8 7l8 5M8 12l8-4" strokeDasharray="1.5 1.5" />
    </>,
    <>
      <path d="M4 6l16 3-16 6z" />
      <path d="M7.5 7l9 4.5M7.5 12.5l9-4" stroke="#fff" strokeWidth="1" strokeDasharray="1.5 1.5" />
    </>,
  ),

  // ============================ Elektronik & Orga ============================

  notizbuch: motif(
    'Notizbuch',
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M12 7h4M12 11h4M12 15h4" />
    </>,
    <>
      <path d="M5 5a2 2 0 0 1 2-2h1v18H7a2 2 0 0 1-2-2zm4-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9zm3 4v1.6h4V7zm0 4v1.6h4V11zm0 4v1.6h4V15z" fillRule="evenodd" />
    </>,
  ),

  stift: motif(
    'Stift',
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19z" />
      <path d="M14 7l3 3" />
      <path d="M5 16l3 3" />
    </>,
    <>
      <path d="M3.6 20.4 5 16l9.6-9.6 3.6 3.6L8.6 19.6zM15.4 5l1.4-1.4a1.4 1.4 0 0 1 2 0l1.6 1.6a1.4 1.4 0 0 1 0 2L19 8.6z" />
    </>,
  ),

  kamera: motif(
    'Kamera',
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7l1.5-2h5L16 7" />
      <circle cx="12" cy="13" r="3.5" />
    </>,
    <>
      <path d="M9 4.6h6L16.5 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5zm3 5.9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fillRule="evenodd" />
    </>,
  ),

  // ============================ Gruppe & Lagerbau ============================

  fahne: motif(
    'Fahne',
    <>
      <path d="M6 3v18" />
      <path d="M6 4h11a1 1 0 0 1 .8 1.6L15 9l2.8 3.4A1 1 0 0 1 17 14H6" />
    </>,
    <>
      <rect x="5" y="3" width="2" height="18" rx="1" />
      <path d="M7 4h10.4a1 1 0 0 1 .8 1.6L15.4 9l2.8 3.4a1 1 0 0 1-.8 1.6H7z" />
    </>,
  ),

  gruppe: motif(
    'Gruppe',
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 20v-1a5 5 0 0 1 10 0v1" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20v-1a4 4 0 0 1 6-3.5" />
    </>,
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1z" />
      <circle cx="17.2" cy="8.6" r="2.6" />
      <path d="M15.6 14.4A6 6 0 0 1 22 19.4v.6h-5.2v-1a7 7 0 0 0-1.8-4.6z" />
    </>,
  ),

  schaukel: motif(
    'Schaukel',
    <>
      <path d="M4 4l4 2 8 0 4-2" transform="translate(0 0)" />
      <path d="M4 4v0M20 4v0" />
      <path d="M4 4l4 16M20 4l-4 16" />
      <path d="M9 12v5M15 12v5" />
      <rect x="8" y="17" width="8" height="2" rx="1" />
    </>,
    <>
      <path d="M3.4 3.1 12 6l8.6-2.9.6 1.8-8.6 3-.6-.2-.6.2L2.8 4.9z" />
      <path d="M9 11.5h1.4V17H9zm4.6 0H15V17h-1.4z" />
      <rect x="7.5" y="16.6" width="9" height="2.4" rx="1" />
      <path d="M4 4l3.4 13.6M20 4l-3.4 13.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>,
  ),

  seilbahn: motif(
    'Seilbahn',
    <>
      <path d="M3 5l18 4" />
      <path d="M9 7v3M15 8v3" />
      <rect x="7" y="10" width="10" height="5" rx="1" />
      <path d="M4 4v3M20 8v3" />
    </>,
    <>
      <path d="M2.8 4l18.4 4.1-.4 1.8L2.4 5.8z" />
      <path d="M8.6 6.6 9 9.6M15 8l.4 3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7" y="10" width="10" height="5.4" rx="1.2" />
    </>,
  ),

  lagerbock: motif(
    'Lagerbock',
    <>
      <path d="M4 20L10 4M20 20L14 4" />
      <path d="M4 20L20 4M20 20L4 4" />
      <circle cx="12" cy="8" r="1.5" />
      <path d="M12 9.5c0 3 0 4 2 5.5" />
    </>,
    <>
      <path d="M3.2 19.6 9.3 3.7l1.8.7-6.1 15.9zm17.6 0L14.7 3.7l-1.8.7 6.1 15.9z" />
      <path d="M4 4l16 15.6M20 4 4 19.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.6" />
    </>,
  ),

  // ============================ Umwelt ============================

  muelltrennung: motif(
    'Mülltrennung',
    <>
      <path d="M6 8h5l-.5 11a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1z" />
      <path d="M5 8h7M7.5 8V6h2v2" />
      <path d="M14 8h5l-.5 11a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" />
      <path d="M13 8h7M15.5 8V6h2v2" />
    </>,
    <>
      <path d="M5 8h7l-.6 11.1a1 1 0 0 1-1 .9H7.6a1 1 0 0 1-1-.9zm2.3-.2V6h2.4v1.8z" fillRule="evenodd" />
      <path d="M13 8h7l-.6 11.1a1 1 0 0 1-1 .9h-3.8a1 1 0 0 1-1-.9zm2.3-.2V6h2.4v1.8z" fillRule="evenodd" />
    </>,
  ),

  // ============================ Navigation (Bild 1 – Extras) ============================

  stern: motif(
    'Stern / Norden',
    <>
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </>,
    <>
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
    </>,
  ),

  sonne: motif(
    'Sonne',
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>,
    <>
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22M4.6 4.6l2.3 2.3M17.1 17.1l2.3 2.3M19.4 4.6l-2.3 2.3M6.9 17.1l-2.3 2.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  ),

  mond: motif(
    'Mond',
    <>
      <path d="M20 14a8 8 0 1 1-9.5-10 6.5 6.5 0 0 0 9.5 10z" />
    </>,
    <>
      <path d="M20.5 14.2A8.5 8.5 0 1 1 10 3.6a7 7 0 0 0 10.5 10.6z" />
    </>,
  ),

  baum: motif(
    'Baum',
    <>
      <path d="M12 3l4 6h-2.5l3 5h-3l2 4H8.5l2-4h-3l3-5H8z" />
      <path d="M12 18v3" />
    </>,
    <>
      <path d="M12 3l4 6h-2.5l3 5h-3l2 4h-2.7v3h-1.6v-3H8l2-4H7l3-5H8z" fillRule="evenodd" />
    </>,
  ),

  berg: motif(
    'Berg',
    <>
      <path d="M3 19L10 7l3 5 2-3 6 10z" />
      <path d="M8.5 10l1.5-3 1.5 2.5" />
    </>,
    <>
      <path d="M3 19 10 7l3 5 2-3 6 10zm5.6-6.4L10 10l1.2 2z" fill="none" />
      <path d="M2.6 19 10 6.6l2.9 4.8L15 8.2 21.4 19z" />
      <path d="M8.6 12.2 10 9.6l1.4 2.4-.9 1.5L10 12.4l-.9 1.3z" fill="#fff" />
    </>,
  ),

  wasser: motif(
    'Wasser',
    <>
      <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </>,
    <>
      <path d="M3 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0l-1 1.6c-1.6-1.6-3.2-1.6-5 0s-4 1.6-6 0-3.4-1.6-5 0zm0 5c2-2 4-2 6 0s4 2 6 0 4-2 6 0l-1 1.6c-1.6-1.6-3.2-1.6-5 0s-4 1.6-6 0-3.4-1.6-5 0zm0 5c2-2 4-2 6 0s4 2 6 0 4-2 6 0l-1 1.6c-1.6-1.6-3.2-1.6-5 0s-4 1.6-6 0-3.4-1.6-5 0z" />
    </>,
  ),

  spur: motif(
    'Pfad / Spur',
    <>
      <ellipse cx="8" cy="7" rx="2" ry="3" />
      <path d="M6 12.5c0-1 1-1.5 2-1.5s2 .5 2 1.5-1 1.5-2 1.5-2-.5-2-1.5z" />
      <ellipse cx="16" cy="14" rx="2" ry="3" />
      <path d="M14 19.5c0-1 1-1.5 2-1.5s2 .5 2 1.5-1 1.5-2 1.5-2-.5-2-1.5z" />
    </>,
    <>
      <ellipse cx="8" cy="7" rx="2.2" ry="3.2" />
      <ellipse cx="8" cy="12.4" rx="2.2" ry="1.8" />
      <ellipse cx="16" cy="14" rx="2.2" ry="3.2" />
      <ellipse cx="16" cy="19.4" rx="2.2" ry="1.8" />
    </>,
  ),

  nachricht: motif(
    'Nachricht',
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>,
    <>
      <path d="M3 8.2 12 14l9-5.8V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM4.4 6h15.2a2 2 0 0 1 1.9 1.3L12 13.6 2.5 7.3A2 2 0 0 1 4.4 6z" fillRule="evenodd" />
    </>,
  ),

  kalender: motif(
    'Kalender',
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
      <path d="M8 13h2M14 13h2M8 17h2M14 17h2" />
    </>,
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4zm0 4h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm3.5 1.5v2h2v-2zm5 0v2h2v-2zm-5 4v2h2v-2zm5 0v2h2v-2z" fillRule="evenodd" />
      <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  ),

  // ============================ Generisch / Fallback ============================

  paket: motif(
    'Paket / Kiste',
    <>
      <path d="M3 8l9-4 9 4-9 4z" />
      <path d="M3 8v8l9 4 9-4V8" />
      <path d="M12 12v8" />
    </>,
    <>
      <path d="M12 3.6 21.4 7.8 12 12 2.6 7.8z" />
      <path d="M2.4 9.2 11 13v8.4l-8.6-3.8zm19.2 0L13 13v8.4l8.6-3.8z" />
    </>,
  ),
};

export type MotifKey = keyof typeof MOTIFS;
