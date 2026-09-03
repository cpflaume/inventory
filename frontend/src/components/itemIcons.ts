// Automatische Gegenstands-Grafiken: ordnet jedem Gegenstand anhand seines
// Namens ein passendes Icon zu. Die Icons stammen aus dem hauseigenen
// Pfadfinder- & Zelten-Set (`icons/motifs.tsx`) – Inline-SVG in zwei Varianten
// (outline für große Ansichten & das Regal, filled für sehr kleine Listen),
// keine Bildassets, tree-shakeable (passt zur Lager-Philosophie, siehe
// warehouseArt.tsx/CLAUDE.md).
//
// Matching-Strategie (bewusst ohne schweres ML-Embedding, das ein MB-großes
// Modell in den Browser laden würde):
//   1. Kuratierte deutsche Synonym-/Wortstamm-Datenbank je Icon — das ist die
//      „Bedeutungs"-Schicht (Jurte→Zelt, Fäustel→Hammer, …).
//   2. Teilwort-Treffer für deutsche Komposita (z.B. „Jurtendach" enthält
//      „jurte", „Zelthering" enthält „hering").
//   3. Fuse.js als unscharfe Fallback-Suche gegen Tippfehler/Beugungen.
// Reicht nichts, greift ein generisches Fallback-Icon.

import Fuse from 'fuse.js';
import type { IconComponent, IconMotif } from './icons/base';
import { MOTIFS } from './icons/motifs';

export type IconVariant = 'outline' | 'filled';

export interface IconEntry {
  /** Stabile ID (für Tests/Debugging). */
  id: string;
  /** Deutsches Anzeige-Label des Motivs. */
  label: string;
  /** Motiv mit outline- und filled-Variante. */
  motif: IconMotif;
  /** Deutsche Such-/Synonymbegriffe (Wortstämme bevorzugt für Komposita). */
  keywords: string[];
}

/** Generisches Motiv, wenn nichts Passendes gefunden wird. */
export const FALLBACK_MOTIF: IconMotif = MOTIFS.paket;
/** Rückwärtskompatibel: outline-Fallback-Komponente. */
export const FALLBACK_ICON: IconComponent = FALLBACK_MOTIF.outline;

// Die Datenbank: >100 Motive rund um Pfadfinder & Zelten. Bewusst Wortstämme
// als Keywords (jurte statt jurtendach), damit Komposita per Teilwort greifen.
export const ICON_CATALOG: IconEntry[] = [
  // --- Pfadfinder ---
  { id: 'lilie', label: 'Lilie', motif: MOTIFS.lilie, keywords: ['lilie', 'pfadfinderlilie', 'fleur de lis', 'scout', 'emblem', 'abzeichen', 'symbol pfadfinder'] },
  { id: 'halstuch', label: 'Halstuch', motif: MOTIFS.halstuch, keywords: ['halstuch', 'halstucher', 'tuch', 'scouttuch', 'gruppentuch', 'stammestuch', 'pfadfindertuch'] },
  { id: 'kluft', label: 'Kluft', motif: MOTIFS.kluft, keywords: ['kluft', 'pfadfinderhemd', 'pfadfinderkluft', 'hemd', 'uniform', 'fahrtenhemd', 'scouthemd'] },
  { id: 'wimpel', label: 'Wimpel', motif: MOTIFS.wimpel, keywords: ['wimpel', 'gruppenwimpel', 'stander', 'standarte', 'pfadfinderwimpel'] },
  { id: 'kompass', label: 'Kompass', motif: MOTIFS.kompass, keywords: ['kompass', 'navigation', 'orientierung', 'richtung', 'himmelsrichtung', 'marschkompass', 'peilkompass', 'nordung'] },
  { id: 'karte', label: 'Landkarte', motif: MOTIFS.karte, keywords: ['karte', 'landkarte', 'wanderkarte', 'gelandekarte', 'orientierungskarte', 'topografische karte', 'routenkarte', 'kartenmaterial', 'stadtplan'] },
  { id: 'wegweiser', label: 'Wegweiser', motif: MOTIFS.wegweiser, keywords: ['wegweiser', 'richtungsweiser', 'wegschild', 'schild', 'abzweigung', 'wegmarkierung', 'wegzeichen', 'markierung'] },
  { id: 'lagerfeuer', label: 'Lagerfeuer', motif: MOTIFS.lagerfeuer, keywords: ['feuer', 'lagerfeuer', 'campfire', 'feuerstelle', 'lager', 'feuerplatz', 'flamme', 'glut', 'brennholz', 'feuerholz'] },
  { id: 'zelt', label: 'Zelt', motif: MOTIFS.zelt, keywords: ['zelt', 'campingzelt', 'schlafzelt', 'trekkingzelt', 'lagerzelt', 'unterkunft', 'zelten', 'hauszelt', 'kuppelzelt', 'igluzelt', 'wurfzelt', 'gruppenzelt', 'mannschaftszelt'] },
  { id: 'kothe', label: 'Kothe', motif: MOTIFS.kothe, keywords: ['kothe', 'kohte', 'kote', 'kohten', 'schwarzzelt', 'viereckzelt', 'kohtenbahn'] },
  { id: 'jurte', label: 'Jurte', motif: MOTIFS.jurte, keywords: ['jurte', 'jurtenzelt', 'pfadfinderjurte', 'grosszelt', 'rundzelt', 'tipi', 'tepee', 'jurtendach', 'jurtenwand'] },
  { id: 'rucksack', label: 'Rucksack', motif: MOTIFS.rucksack, keywords: ['rucksack', 'wanderrucksack', 'trekkingrucksack', 'backpack', 'gepack', 'tagesrucksack', 'tourenrucksack', 'daypack', 'kraxe'] },
  { id: 'affe', label: 'Rucksack „Affe“', motif: MOTIFS.affe, keywords: ['affe', 'affenrucksack', 'militarrucksack', 'schweizer rucksack', 'rollrucksack', 'packrolle'] },

  // --- Schlafen & Zelt-Zubehör ---
  { id: 'schlafsack', label: 'Schlafsack', motif: MOTIFS.schlafsack, keywords: ['schlafsack', 'schlafsacke', 'daunenschlafsack', 'sommerschlafsack', 'huttenschlafsack', 'inlett', 'zeltschlafsack'] },
  { id: 'isomatte', label: 'Isomatte', motif: MOTIFS.isomatte, keywords: ['isomatte', 'schlafmatte', 'campingmatte', 'luftmatratze', 'unterlage', 'schlafunterlage', 'matte', 'thermomatte', 'karrimatte'] },
  { id: 'plane', label: 'Plane / Tarp', motif: MOTIFS.plane, keywords: ['plane', 'zeltplane', 'abdeckplane', 'tarp', 'lagerplane', 'wetterschutz', 'regenplane', 'bodenplane', 'zeltboden', 'persenning'] },
  { id: 'hering', label: 'Hering / Zeltnagel', motif: MOTIFS.hering, keywords: ['hering', 'heringe', 'zelthering', 'erdnagel', 'bodenanker', 'zeltbefestigung', 'zeltnagel', 'bodennagel'] },
  { id: 'abspannseil', label: 'Abspannseil', motif: MOTIFS.abspannseil, keywords: ['abspannseil', 'spannseil', 'zeltleine', 'abspannung', 'spannleine', 'sturmleine', 'leinenspanner', 'spanner'] },
  { id: 'zeltstange', label: 'Zeltstange', motif: MOTIFS.zeltstange, keywords: ['zeltstange', 'zeltstock', 'stange', 'gestange', 'zeltaufbau', 'holzstange', 'kohtenstange', 'bundstock', 'spiere', 'pfahl'] },
  { id: 'hammer', label: 'Hammer', motif: MOTIFS.hammer, keywords: ['hammer', 'zelthammer', 'schlosserhammer', 'campinghammer', 'faustel', 'faeustel', 'schlegel', 'vorschlaghammer', 'gummihammer', 'holzhammer', 'klopfer'] },

  // --- Feuer & Licht ---
  { id: 'kocher', label: 'Kocher', motif: MOTIFS.kocher, keywords: ['gaskocher', 'campingkocher', 'kocher', 'outdoorkocher', 'brenner', 'kochstelle', 'spirituskocher', 'hobokocher', 'trangia'] },
  { id: 'hockerkocher', label: 'Hockerkocher', motif: MOTIFS.hockerkocher, keywords: ['hockerkocher', 'kastenkocher', 'vierkocher'] },
  { id: 'laterne', label: 'Laterne', motif: MOTIFS.laterne, keywords: ['laterne', 'campinglaterne', 'lagerlaterne', 'gaslaterne', 'licht', 'beleuchtung', 'lampe', 'sturmlaterne', 'petroleumlampe', 'windlicht'] },
  { id: 'stirnlampe', label: 'Stirnlampe', motif: MOTIFS.stirnlampe, keywords: ['stirnlampe', 'kopflampe', 'headlamp'] },
  { id: 'taschenlampe', label: 'Taschenlampe', motif: MOTIFS.taschenlampe, keywords: ['taschenlampe', 'handlampe', 'outdoorlampe', 'notlicht', 'led lampe'] },
  { id: 'feuerstahl', label: 'Feuerstahl', motif: MOTIFS.feuerstahl, keywords: ['feuerstahl', 'feuerstarter', 'funken', 'zunder', 'feuerstein', 'magnesium'] },
  { id: 'streichhoelzer', label: 'Streichhölzer', motif: MOTIFS.streichhoelzer, keywords: ['streichholzer', 'zundholzer', 'streichholz', 'zundholz', 'zunden'] },
  { id: 'feueranzuender', label: 'Feueranzünder', motif: MOTIFS.feueranzuender, keywords: ['feueranzunder', 'anzunder', 'zundhilfe', 'kaminanzunder', 'brennhilfe', 'grillanzunder'] },
  { id: 'feuerkorb', label: 'Feuerkorb', motif: MOTIFS.feuerkorb, keywords: ['feuerkorb', 'feuerschale'] },

  // --- Werkzeug ---
  { id: 'axt', label: 'Beil / Axt', motif: MOTIFS.axt, keywords: ['axt', 'beil', 'handbeil', 'spaltbeil', 'holzarbeiten', 'spaltaxt', 'holzaxt', 'hacke', 'kappbeil'] },
  { id: 'saege', label: 'Säge', motif: MOTIFS.saege, keywords: ['sage', 'saege', 'handsage', 'klappsage', 'holzsage', 'astsage', 'fuchsschwanz'] },
  { id: 'messer', label: 'Messer', motif: MOTIFS.messer, keywords: ['messer', 'taschenmesser', 'fahrtenmesser', 'outdoormesser', 'schnitzmesser', 'klappmesser', 'opinel'] },
  { id: 'spaten', label: 'Spaten', motif: MOTIFS.spaten, keywords: ['spaten', 'schaufel', 'klappspaten', 'feldspaten', 'graben', 'latrinenschaufel', 'sappe', 'grabewerkzeug'] },

  // --- Kochen & Küche ---
  { id: 'feldflasche', label: 'Feldflasche', motif: MOTIFS.feldflasche, keywords: ['feldflasche', 'outdoorflasche'] },
  { id: 'trinkflasche', label: 'Trinkflasche', motif: MOTIFS.trinkflasche, keywords: ['trinkflasche', 'wasserflasche', 'flasche', 'trinkgefass', 'getrank', 'nalgene', 'trinkblase', 'trinksystem'] },
  { id: 'tasse', label: 'Tasse', motif: MOTIFS.tasse, keywords: ['tasse', 'becher', 'campingbecher', 'trinkbecher', 'henkeltasse', 'kaffeebecher', 'emaillebecher', 'kaffee', 'tee', 'kanne'] },
  { id: 'topf', label: 'Kochtopf', motif: MOTIFS.topf, keywords: ['topf', 'kochtopf', 'campingtopf', 'lagertopf', 'kochgeschirr', 'gulaschkanone', 'feldkuche'] },
  { id: 'pfanne', label: 'Pfanne', motif: MOTIFS.pfanne, keywords: ['pfanne', 'campingpfanne', 'bratpfanne', 'lagerpfanne', 'braten', 'stielpfanne', 'wok'] },
  { id: 'kessel', label: 'Kessel', motif: MOTIFS.kessel, keywords: ['kessel', 'kochkessel', 'lagerkessel', 'wasserkessel', 'campingkessel', 'teekessel'] },
  { id: 'wasserkanister', label: 'Wasserkanister', motif: MOTIFS.wasserkanister, keywords: ['wasserkanister', 'trinkwasser', 'wasservorrat', 'wasserbehalter', 'wasserkanne', 'wassersack', 'faltkanister'] },
  { id: 'kanister', label: 'Kanister', motif: MOTIFS.kanister, keywords: ['kanister', 'behalter', 'vorratskanister', 'transportkanister', 'benzinkanister'] },
  { id: 'gasflasche', label: 'Gasflasche', motif: MOTIFS.gasflasche, keywords: ['gasflasche', 'propangasflasche', 'gas', 'propan', 'brenngas', 'campinggas'] },
  { id: 'gaskartusche', label: 'Gaskartusche', motif: MOTIFS.gaskartusche, keywords: ['gaskartusche', 'kartusche', 'kocherkartusche', 'brennstoff'] },
  { id: 'dutchoven', label: 'Dutch Oven', motif: MOTIFS.dutchoven, keywords: ['dutch oven', 'dutchoven', 'feuertopf', 'gusseisentopf', 'lagerkuche', 'dopf'] },
  { id: 'grillrost', label: 'Grillrost', motif: MOTIFS.grillrost, keywords: ['grillrost', 'grill', 'lagergrill', 'grillen', 'rost', 'grillkohle'] },
  { id: 'kohlezange', label: 'Kohlezange', motif: MOTIFS.kohlezange, keywords: ['kohlezange', 'grillzange', 'feuerzange', 'zange', 'glut'] },
  { id: 'topfheber', label: 'Topfheber', motif: MOTIFS.topfheber, keywords: ['topfheber', 'deckelheber', 'topfzange'] },
  { id: 'schoepfkelle', label: 'Schöpfkelle', motif: MOTIFS.schoepfkelle, keywords: ['schopfkelle', 'kelle', 'suppenkelle', 'kochloffel', 'schaumloffel'] },
  { id: 'schneidebrett', label: 'Schneidebrett', motif: MOTIFS.schneidebrett, keywords: ['schneidebrett', 'brett', 'kuchenbrett', 'hackbrett'] },
  { id: 'besteck', label: 'Besteck', motif: MOTIFS.besteck, keywords: ['besteck', 'gabel', 'loffel', 'campingbesteck', 'essbesteck', 'geschirr', 'teller', 'essgeschirr', 'napf', 'schussel'] },

  // --- Hygiene & Sauberkeit ---
  { id: 'muellsack', label: 'Müllsack', motif: MOTIFS.muellsack, keywords: ['mullsack', 'mullbeutel', 'abfall', 'abfallbeutel', 'mull', 'mulltute'] },
  { id: 'seife', label: 'Seife', motif: MOTIFS.seife, keywords: ['seife', 'handseife', 'waschseife', 'hygiene', 'waschen', 'korperpflege', 'reinigung', 'duschgel', 'shampoo'] },
  { id: 'handtuch', label: 'Handtuch', motif: MOTIFS.handtuch, keywords: ['handtuch', 'duschtuch', 'abtrocknen', 'badetuch'] },
  { id: 'muelltrennung', label: 'Mülltrennung', motif: MOTIFS.muelltrennung, keywords: ['mulltrennung', 'recycling', 'abfalltrennung', 'nachhaltigkeit', 'umwelt', 'entsorgung', 'wertstoff'] },

  // --- Erste Hilfe & Sicherheit ---
  { id: 'erstehilfe', label: 'Erste Hilfe', motif: MOTIFS.erstehilfe, keywords: ['erste hilfe', 'erstehilfe', 'verbandskasten', 'sanitatskasten', 'sani', 'notfall', 'verbandtasche', 'sanitatsmaterial'] },
  { id: 'pflaster', label: 'Pflaster', motif: MOTIFS.pflaster, keywords: ['pflaster', 'heftpflaster', 'wundpflaster', 'blasenpflaster', 'tape'] },
  { id: 'desinfektion', label: 'Desinfektion', motif: MOTIFS.desinfektion, keywords: ['desinfektionsmittel', 'desinfektion', 'wunddesinfektion', 'handedesinfektion'] },
  { id: 'verband', label: 'Verband', motif: MOTIFS.verband, keywords: ['verband', 'verbandpackchen', 'mullbinde', 'wundverband', 'binde', 'kompresse'] },
  { id: 'rettungsdecke', label: 'Rettungsdecke', motif: MOTIFS.rettungsdecke, keywords: ['rettungsdecke', 'notfalldecke', 'warmedecke', 'rettung', 'unterkuhlung'] },
  { id: 'notfallpfeife', label: 'Notfallpfeife', motif: MOTIFS.notfallpfeife, keywords: ['notfallpfeife', 'signalpfeife', 'pfeife', 'notsignal', 'trillerpfeife'] },
  { id: 'signalhorn', label: 'Signalhorn', motif: MOTIFS.signalhorn, keywords: ['signalhorn', 'horn', 'signal', 'alarm', 'drucklufthorn'] },
  { id: 'mueckenschutz', label: 'Mückenschutz', motif: MOTIFS.mueckenschutz, keywords: ['muckenschutz', 'insektenschutz', 'moskitoschutz', 'mucken', 'repellent', 'autan', 'muckenspray', 'zeckenschutz'] },

  // --- Elektronik & Kommunikation ---
  { id: 'funkgeraet', label: 'Funkgerät', motif: MOTIFS.funkgeraet, keywords: ['funkgerat', 'walkie talkie', 'funk', 'sprechfunk', 'cb funk'] },
  { id: 'powerbank', label: 'Powerbank', motif: MOTIFS.powerbank, keywords: ['powerbank', 'akku', 'ladegerat', 'usb', 'stromversorgung', 'batterie', 'akkupack'] },
  { id: 'solarpanel', label: 'Solarpanel', motif: MOTIFS.solarpanel, keywords: ['solarpanel', 'solarladegerat', 'solarzelle', 'sonnenenergie', 'solarmodul', 'solarstrom'] },
  { id: 'kamera', label: 'Kamera', motif: MOTIFS.kamera, keywords: ['kamera', 'fotoapparat', 'fotografieren', 'fotokamera', 'gopro', 'actioncam', 'bilder'] },

  // --- Navigation & Beobachtung ---
  { id: 'lupe', label: 'Lupe', motif: MOTIFS.lupe, keywords: ['lupe', 'vergrosserungsglas', 'vergroserung', 'forschen'] },
  { id: 'fernglas', label: 'Fernglas', motif: MOTIFS.fernglas, keywords: ['fernglas', 'binokular', 'feldstecher', 'monokular', 'spektiv'] },
  { id: 'uhr', label: 'Uhr', motif: MOTIFS.uhr, keywords: ['uhr', 'armbanduhr', 'zeit', 'uhrzeit', 'wecker', 'stoppuhr', 'taschenuhr'] },
  { id: 'sonnenbrille', label: 'Sonnenbrille', motif: MOTIFS.sonnenbrille, keywords: ['sonnenbrille', 'brille', 'sonnenschutz brille', 'schutzbrille', 'uv brille'] },
  { id: 'stern', label: 'Stern / Norden', motif: MOTIFS.stern, keywords: ['stern', 'norden', 'kompassrose', 'nordstern', 'polarstern'] },
  { id: 'sonne', label: 'Sonne', motif: MOTIFS.sonne, keywords: ['sonne', 'sonnig', 'sonnencreme', 'sonnenmilch', 'sonnenschein', 'sonnenschutz'] },
  { id: 'mond', label: 'Mond', motif: MOTIFS.mond, keywords: ['mond', 'nacht', 'nachtruhe', 'halbmond', 'mondlicht'] },
  { id: 'baum', label: 'Baum / Wald', motif: MOTIFS.baum, keywords: ['baum', 'wald', 'tanne', 'nadelbaum', 'forst', 'baume', 'geholz'] },
  { id: 'berg', label: 'Berg', motif: MOTIFS.berg, keywords: ['berg', 'gebirge', 'gipfel', 'alpen', 'wanderberg', 'huette'] },
  { id: 'wasser', label: 'Wasser / See', motif: MOTIFS.wasser, keywords: ['wasser', 'see', 'fluss', 'bach', 'teich', 'gewasser', 'baden', 'welle'] },
  { id: 'spur', label: 'Pfad / Spur', motif: MOTIFS.spur, keywords: ['pfad', 'spur', 'fussspur', 'fahrte', 'trittsiegel', 'weg'] },

  // --- Kleidung ---
  { id: 'regenjacke', label: 'Regenjacke', motif: MOTIFS.regenjacke, keywords: ['regenjacke', 'wetterschutz jacke', 'regenbekleidung', 'outdoorjacke', 'jacke', 'wasserschutz', 'funktionsjacke', 'hardshell', 'matschjacke'] },
  { id: 'regenponcho', label: 'Regenponcho', motif: MOTIFS.regenponcho, keywords: ['regenponcho', 'poncho', 'regenumhang', 'regencape'] },
  { id: 'fleecejacke', label: 'Fleecejacke', motif: MOTIFS.fleecejacke, keywords: ['fleece', 'fleecejacke', 'pullover', 'softshell', 'walkjacke'] },
  { id: 'tshirt', label: 'T-Shirt', motif: MOTIFS.tshirt, keywords: ['t shirt', 'shirt', 'oberbekleidung', 'freizeitshirt', 'gruppenshirt', 'leibchen', 'trikot'] },
  { id: 'hose', label: 'Hose', motif: MOTIFS.hose, keywords: ['hose', 'outdoorhose', 'wanderhose', 'trekkinghose', 'zipphose', 'matschhose', 'buxe'] },
  { id: 'guertel', label: 'Gürtel', motif: MOTIFS.guertel, keywords: ['gurtel', 'koppel', 'huftgurtel', 'leibriemen'] },
  { id: 'hut', label: 'Hut', motif: MOTIFS.hut, keywords: ['hut', 'sonnenhut', 'kopfbedeckung', 'schlapphut', 'cowboyhut'] },
  { id: 'muetze', label: 'Mütze', motif: MOTIFS.muetze, keywords: ['mutze', 'strickmutze', 'wintermutze', 'beanie', 'kappe', 'basecap'] },
  { id: 'handschuhe', label: 'Handschuhe', motif: MOTIFS.handschuhe, keywords: ['handschuhe', 'arbeitshandschuhe', 'schutzhandschuhe', 'arbeitsschutz', 'lederhandschuhe', 'fausthandschuhe', 'faustlinge'] },
  { id: 'stiefel', label: 'Stiefel', motif: MOTIFS.stiefel, keywords: ['stiefel', 'wanderstiefel', 'trekkingstiefel', 'wanderschuhe', 'schuhe', 'bergstiefel'] },
  { id: 'gummistiefel', label: 'Gummistiefel', motif: MOTIFS.gummistiefel, keywords: ['gummistiefel', 'regenstiefel', 'matschstiefel', 'wasserschuhe'] },
  { id: 'sandalen', label: 'Sandalen', motif: MOTIFS.sandalen, keywords: ['sandalen', 'outdoorsandalen', 'sommerschuhe', 'badeschuhe', 'trekkingsandalen'] },

  // --- Seil & Verbindung ---
  { id: 'seil', label: 'Seil', motif: MOTIFS.seil, keywords: ['seil', 'kletterseil', 'arbeitsseil', 'tau', 'statikseil', 'bundseil', 'reepschnur'] },
  { id: 'schnur', label: 'Schnur', motif: MOTIFS.schnur, keywords: ['schnur', 'kordel', 'paketschnur', 'bindeschnur', 'garn', 'leine'] },
  { id: 'knoten', label: 'Knoten', motif: MOTIFS.knoten, keywords: ['knoten', 'seilknoten', 'pfadfinderknoten', 'knotenkunde', 'seiltechnik', 'knupfen', 'binden'] },
  { id: 'karabiner', label: 'Karabiner', motif: MOTIFS.karabiner, keywords: ['karabiner', 'karabinerhaken', 'haken', 'sicherung', 'stahlkarabiner', 'schakel'] },
  { id: 'bandschlinge', label: 'Bandschlinge', motif: MOTIFS.bandschlinge, keywords: ['bandschlinge', 'schlinge', 'rundschlinge', 'gurtband', 'gurt'] },

  // --- Schreiben & Orga ---
  { id: 'notizbuch', label: 'Notizbuch', motif: MOTIFS.notizbuch, keywords: ['notizbuch', 'notizen', 'tagebuch', 'fahrtenbuch', 'lagerbuch', 'kladde', 'block', 'notizblock', 'buch'] },
  { id: 'stift', label: 'Stift', motif: MOTIFS.stift, keywords: ['stift', 'kugelschreiber', 'schreibstift', 'bleistift', 'filzstift', 'edding', 'marker', 'kuli'] },
  { id: 'kalender', label: 'Kalender', motif: MOTIFS.kalender, keywords: ['kalender', 'termin', 'datum', 'zeitplan', 'planung'] },
  { id: 'nachricht', label: 'Nachricht', motif: MOTIFS.nachricht, keywords: ['nachricht', 'nachrichten', 'brief', 'mail', 'email', 'post', 'umschlag', 'kontakt'] },

  // --- Gruppe, Lagerbau & Programm ---
  { id: 'fahne', label: 'Fahne', motif: MOTIFS.fahne, keywords: ['fahne', 'flagge', 'gruppenfahne', 'lagerfahne', 'banner', 'stammesfahne'] },
  { id: 'gruppe', label: 'Gruppe', motif: MOTIFS.gruppe, keywords: ['gruppe', 'team', 'pfadfindergruppe', 'gemeinschaft', 'stammesgruppe', 'teilnehmer', 'personen', 'sippe', 'meute', 'trupp'] },
  { id: 'schaukel', label: 'Schaukel', motif: MOTIFS.schaukel, keywords: ['schaukel', 'spielgerat', 'schaukeln'] },
  { id: 'seilbahn', label: 'Seilbahn', motif: MOTIFS.seilbahn, keywords: ['seilbahn', 'flying fox', 'seilrutsche', 'zipline', 'kletterelement'] },
  { id: 'lagerbock', label: 'Lagerbock', motif: MOTIFS.lagerbock, keywords: ['lagerbock', 'kochbock', 'dreibein', 'holzbau', 'lagerbau', 'gestell'] },

  // --- Gepäck & Transport ---
  { id: 'kiste', label: 'Kiste / Box', motif: MOTIFS.paket, keywords: ['kiste', 'box', 'transportkiste', 'materialkiste', 'eurobox', 'aufbewahrungsbox', 'stapelbox', 'seesack', 'tasche', 'packsack'] },
];

// --- Normalisierung & Index --------------------------------------------------

/** Kleinschreibung, ß→ss, Umlaute/Diakritika falten, Sonderzeichen zu Leerraum. */
export function normalizeTerm(input: string): string {
  return input
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface IndexedTerm {
  term: string;
  entry: IconEntry;
}

const INDEX: IndexedTerm[] = ICON_CATALOG.flatMap((entry) => {
  const terms = new Set<string>([normalizeTerm(entry.label), ...entry.keywords.map(normalizeTerm)]);
  return [...terms].filter(Boolean).map((term) => ({ term, entry }));
});

const fuse = new Fuse(INDEX, {
  keys: ['term'],
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.34,
  minMatchCharLength: 3,
});

const cache = new Map<string, IconEntry | null>();

/**
 * Ordnet einem Gegenstandsnamen das beste Icon zu (oder `null`, wenn nichts
 * ausreichend passt — Aufrufer nutzen dann {@link FALLBACK_MOTIF}). Ergebnisse
 * werden pro Name gecached, da Listen häufig neu rendern.
 */
export function matchIconEntry(rawName: string): IconEntry | null {
  const name = normalizeTerm(rawName);
  if (!name) return null;
  if (cache.has(name)) return cache.get(name) ?? null;

  // 1. Teilwort-/Exakttreffer — längster Wortstamm gewinnt (spezifischer).
  let best: { entry: IconEntry; score: number } | null = null;
  for (const { term, entry } of INDEX) {
    if (term.length < 3) continue;
    let score = 0;
    if (name === term) score = 1000 + term.length;
    else if (name.includes(term)) score = 500 + term.length * 10;
    else if (term.includes(name) && name.length >= 4) score = 250 + name.length * 10;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  if (best && best.score >= 250) {
    cache.set(name, best.entry);
    return best.entry;
  }

  // 2. Unscharfe Suche je Wort gegen Tippfehler/Beugungen.
  let fuzzy: { entry: IconEntry; score: number } | null = null;
  for (const token of name.split(' ')) {
    if (token.length < 3) continue;
    const [hit] = fuse.search(token, { limit: 1 });
    if (hit && hit.score != null && hit.score <= 0.34) {
      const s = 1 - hit.score;
      if (!fuzzy || s > fuzzy.score) fuzzy = { entry: hit.item.entry, score: s };
    }
  }
  cache.set(name, fuzzy?.entry ?? null);
  return fuzzy?.entry ?? null;
}

/**
 * Wie {@link matchIconEntry}, aber immer mit Icon-Komponente (Fallback statt
 * `null`). `variant` wählt outline (Standard, große Ansichten/Regal) oder
 * filled (sehr kleine Listen).
 */
export function iconForItem(
  rawName: string,
  variant: IconVariant = 'outline',
): { Icon: IconComponent; label: string | null } {
  const entry = matchIconEntry(rawName);
  const motif = entry?.motif ?? FALLBACK_MOTIF;
  return { Icon: motif[variant], label: entry?.label ?? null };
}
