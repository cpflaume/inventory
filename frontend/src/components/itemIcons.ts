// Automatische Gegenstands-Grafiken: ordnet jedem Gegenstand anhand seines
// Namens ein passendes Icon zu. Die Icons kommen als Inline-SVG aus
// `lucide-react` (tree-shakeable, keine Bildassets — passt zur Lager-Philosophie,
// siehe warehouseArt.tsx/CLAUDE.md).
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
import {
  Anchor,
  Apple,
  Award,
  Backpack,
  Bandage,
  BatteryCharging,
  Bed,
  BedDouble,
  Bell,
  Binoculars,
  Bird,
  Book,
  BookOpen,
  Brush,
  Bug,
  Camera,
  Caravan,
  Carrot,
  Clipboard,
  ClipboardList,
  Cloud,
  CloudRain,
  Clover,
  Coffee,
  Compass,
  CookingPot,
  Cross,
  CupSoda,
  Dices,
  Dog,
  Droplet,
  Droplets,
  Drum,
  Drumstick,
  Egg,
  Feather,
  Fence,
  FireExtinguisher,
  Fish,
  Flag,
  Flame,
  FlameKindling,
  Flashlight,
  Flower,
  Footprints,
  Fuel,
  Gamepad,
  Glasses,
  Guitar,
  Ham,
  Hammer,
  HardHat,
  Key,
  Lamp,
  Layers,
  Leaf,
  LifeBuoy,
  Lock,
  Map as MapIcon,
  MapPin,
  Medal,
  Megaphone,
  Milk,
  Moon,
  Mountain,
  Navigation,
  Notebook,
  Nut,
  Package,
  Pencil,
  Phone,
  Pickaxe,
  Pill,
  Pin,
  Radio,
  Route,
  Ruler,
  Sailboat,
  Salad,
  Sandwich,
  Satellite,
  Scissors,
  Scroll,
  Shield,
  Shirt,
  ShowerHead,
  Shovel,
  Signpost,
  Snowflake,
  Soup,
  Sprout,
  Stethoscope,
  Sun,
  Telescope,
  Tent,
  TentTree,
  Thermometer,
  Ticket,
  Toilet,
  Trash2,
  TreePine,
  Trees,
  Trophy,
  Umbrella,
  Utensils,
  UtensilsCrossed,
  Watch,
  Waves,
  Wheat,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface IconEntry {
  /** Stabile ID (für Tests/Debugging). */
  id: string;
  /** Deutsches Anzeige-Label des Motivs. */
  label: string;
  Icon: LucideIcon;
  /** Deutsche Such-/Synonymbegriffe (Wortstämme bevorzugt für Komposita). */
  keywords: string[];
}

/** Generisches Icon, wenn nichts Passendes gefunden wird. */
export const FALLBACK_ICON: LucideIcon = Package;

// Die Datenbank: >100 Motive rund um Pfadfinder & Zelten. Bewusst Wortstämme
// als Keywords (jurte statt jurtendach), damit Komposita per Teilwort greifen.
export const ICON_CATALOG: IconEntry[] = [
  // --- Zelt & Unterkunft ---
  { id: 'zelt', label: 'Zelt', Icon: Tent, keywords: ['zelt', 'hauszelt', 'kuppelzelt', 'igluzelt', 'steilwandzelt', 'wurfzelt', 'gruppenzelt', 'mannschaftszelt', 'zeltstange', 'gestange', 'zeltgestange'] },
  { id: 'jurte', label: 'Jurte / Kohte', Icon: TentTree, keywords: ['jurte', 'kohte', 'kote', 'tipi', 'tepee', 'schwarzzelt', 'jurtendach', 'kohtenbahn', 'jurtenwand', 'wolldecke jurte'] },
  { id: 'plane', label: 'Plane / Tarp', Icon: Layers, keywords: ['plane', 'zeltplane', 'abdeckplane', 'tarp', 'persenning', 'bodenplane', 'zeltboden', 'unterlegplane', 'regenplane'] },
  { id: 'hering', label: 'Hering / Zeltnagel', Icon: Pin, keywords: ['hering', 'heringe', 'zeltnagel', 'zeltnagel', 'zelthering', 'erdnagel', 'bodennagel', 'zelthering'] },
  { id: 'abspannung', label: 'Abspannung', Icon: Anchor, keywords: ['abspannung', 'spannleine', 'zeltleine', 'sturmleine', 'abspannleine', 'spanner', 'leinenspanner'] },

  // --- Seil, Bund & Aufbau ---
  { id: 'seil', label: 'Seil', Icon: Anchor, keywords: ['seil', 'seile', 'tau', 'reepschnur', 'leine', 'kordel', 'schnur', 'bundseil', 'kletterseil', 'statikseil'] },
  { id: 'bundstock', label: 'Stange / Bundstock', Icon: Fence, keywords: ['stange', 'stangen', 'bundstock', 'bundstocke', 'holzstange', 'zeltstock', 'jurtenstange', 'spiere', 'pfahl'] },
  { id: 'karabiner', label: 'Karabiner', Icon: Key, keywords: ['karabiner', 'schaekel', 'haken', 'karabinerhaken', 'stahlkarabiner'] },
  { id: 'werkzeug', label: 'Werkzeug', Icon: Wrench, keywords: ['werkzeug', 'werkzeugkasten', 'schraubenschlussel', 'zange', 'kombizange', 'schraubendreher', 'saege', 'saege', 'fuchsschwanz', 'feile', 'schraubstock'] },
  { id: 'hammer', label: 'Hammer', Icon: Hammer, keywords: ['hammer', 'faustel', 'faeustel', 'schlegel', 'vorschlaghammer', 'gummihammer', 'holzhammer', 'klopfer'] },
  { id: 'axt', label: 'Axt / Beil', Icon: Pickaxe, keywords: ['axt', 'beil', 'handbeil', 'spaltaxt', 'holzaxt', 'hacke', 'spalthammer', 'kappbeil'] },
  { id: 'spaten', label: 'Spaten / Schaufel', Icon: Shovel, keywords: ['spaten', 'schaufel', 'klappspaten', 'feldspaten', 'grabewerkzeug', 'sappe', 'latrinenschaufel'] },
  { id: 'messer', label: 'Messer', Icon: Scissors, keywords: ['messer', 'taschenmesser', 'fahrtenmesser', 'klappmesser', 'kuchenmesser', 'schnitzmesser', 'opinel'] },
  { id: 'schere', label: 'Schere', Icon: Scissors, keywords: ['schere', 'scheren', 'stoffschere', 'gartenschere', 'astschere'] },
  { id: 'meterstab', label: 'Maßband / Meterstab', Icon: Ruler, keywords: ['massband', 'meterstab', 'zollstock', 'bandmass', 'lineal', 'gliedermassstab'] },
  { id: 'draht', label: 'Draht / Kette', Icon: Nut, keywords: ['draht', 'kette', 'ketten', 'bindedraht', 'spanndraht', 'schraube', 'schrauben', 'nagel', 'naegel', 'muttern', 'kleinteile'] },

  // --- Feuer & Licht ---
  { id: 'lagerfeuer', label: 'Lagerfeuer', Icon: Flame, keywords: ['feuer', 'lagerfeuer', 'feuerstelle', 'flamme', 'glut', 'kohle', 'holzkohle', 'brennholz', 'feuerholz', 'feuerschale'] },
  { id: 'feuerstahl', label: 'Feuerstahl / Zunder', Icon: FlameKindling, keywords: ['feuerstahl', 'feuerzeug', 'zunder', 'zundholz', 'streichholz', 'streichholzer', 'anzunder', 'zundwolle', 'magnesium', 'feuerstein'] },
  { id: 'brennstoff', label: 'Brennstoff / Gas', Icon: Fuel, keywords: ['brennstoff', 'benzin', 'petroleum', 'spiritus', 'gaskartusche', 'gasflasche', 'brennpaste', 'kraftstoff', 'kanister'] },
  { id: 'feuerlöscher', label: 'Feuerlöscher', Icon: FireExtinguisher, keywords: ['feuerloscher', 'loschdecke', 'brandschutz', 'loschmittel'] },
  { id: 'taschenlampe', label: 'Taschenlampe', Icon: Flashlight, keywords: ['taschenlampe', 'lampe', 'stirnlampe', 'kopflampe', 'handlampe', 'led lampe'] },
  { id: 'laterne', label: 'Laterne / Licht', Icon: Lamp, keywords: ['laterne', 'sturmlaterne', 'petroleumlampe', 'campinglampe', 'gaslampe', 'kerze', 'kerzen', 'teelicht', 'windlicht', 'lampion'] },
  { id: 'batterie', label: 'Batterie / Akku', Icon: BatteryCharging, keywords: ['batterie', 'batterien', 'akku', 'akkus', 'powerbank', 'ladegerat', 'aa', 'aaa', 'knopfzelle'] },
  { id: 'strom', label: 'Strom / Kabel', Icon: Zap, keywords: ['strom', 'kabel', 'verlangerungskabel', 'kabeltrommel', 'stecker', 'steckdose', 'generator', 'aggregat', 'mehrfachsteckdose'] },

  // --- Kochen & Küche ---
  { id: 'topf', label: 'Kochtopf', Icon: CookingPot, keywords: ['topf', 'kochtopf', 'kessel', 'gulaschkanone', 'feldkuche', 'dutch oven', 'dopf', 'bratentopf'] },
  { id: 'kocher', label: 'Kocher', Icon: Flame, keywords: ['kocher', 'gaskocher', 'campingkocher', 'spirituskocher', 'hobokocher', 'trangia', 'gasgrill', 'kochstelle'] },
  { id: 'pfanne', label: 'Pfanne', Icon: UtensilsCrossed, keywords: ['pfanne', 'bratpfanne', 'stielpfanne', 'grillpfanne', 'wok'] },
  { id: 'geschirr', label: 'Geschirr / Besteck', Icon: Utensils, keywords: ['geschirr', 'teller', 'besteck', 'gabel', 'loffel', 'messer besteck', 'essgeschirr', 'menageschale', 'napf', 'schussel', 'schale'] },
  { id: 'becher', label: 'Becher / Tasse', Icon: Coffee, keywords: ['becher', 'tasse', 'kaffeebecher', 'emaillebecher', 'kaffee', 'tee', 'thermoskanne', 'kanne', 'teekanne'] },
  { id: 'trinkflasche', label: 'Trinkflasche', Icon: CupSoda, keywords: ['trinkflasche', 'feldflasche', 'flasche', 'nalgene', 'trinkblase', 'trinksystem', 'wasserflasche'] },
  { id: 'kanister', label: 'Wasserkanister', Icon: Droplets, keywords: ['wasserkanister', 'wassersack', 'faltkanister', 'wasserbehalter', 'trinkwasser', 'wasserkanne'] },
  { id: 'kuehlbox', label: 'Kühlbox', Icon: Package, keywords: ['kuhlbox', 'kuhltasche', 'kuhlakku', 'thermobox', 'eisbox'] },
  { id: 'spuelmittel', label: 'Spülzeug', Icon: Droplet, keywords: ['spulmittel', 'spulzeug', 'spulbecken', 'spulschussel', 'geschirrtuch', 'schwamm', 'burste', 'spulburste'] },

  // --- Lebensmittel ---
  { id: 'brot', label: 'Brot', Icon: Sandwich, keywords: ['brot', 'brote', 'stockbrot', 'brotchen', 'toast', 'knackebrot', 'zwieback'] },
  { id: 'fleisch', label: 'Fleisch / Wurst', Icon: Ham, keywords: ['fleisch', 'wurst', 'wurstchen', 'grillfleisch', 'speck', 'schinken', 'salami', 'hackfleisch'] },
  { id: 'grillgut', label: 'Grillgut', Icon: Drumstick, keywords: ['grillgut', 'grill', 'grillkohle', 'grillrost', 'huhnchen', 'haxe', 'spiess'] },
  { id: 'fisch', label: 'Fisch', Icon: Fish, keywords: ['fisch', 'forelle', 'raucherfisch', 'raucherlachs'] },
  { id: 'gemuese', label: 'Gemüse', Icon: Carrot, keywords: ['gemuse', 'karotte', 'mohre', 'kartoffel', 'zwiebel', 'salatgemuse', 'paprika', 'gurke'] },
  { id: 'salat', label: 'Salat', Icon: Salad, keywords: ['salat', 'blattsalat', 'rohkost', 'salatschussel'] },
  { id: 'obst', label: 'Obst', Icon: Apple, keywords: ['obst', 'apfel', 'apfel', 'banane', 'birne', 'fruchte', 'trockenobst'] },
  { id: 'getreide', label: 'Getreide / Nudeln', Icon: Wheat, keywords: ['getreide', 'nudeln', 'reis', 'mehl', 'haferflocken', 'muesli', 'spaghetti', 'grundnahrung'] },
  { id: 'ei', label: 'Eier', Icon: Egg, keywords: ['eier', 'fruhstucksei', 'ruhrei'] },
  { id: 'milch', label: 'Milch', Icon: Milk, keywords: ['milch', 'h milch', 'kondensmilch', 'sahne', 'joghurt'] },
  { id: 'suppe', label: 'Suppe / Eintopf', Icon: Soup, keywords: ['suppe', 'eintopf', 'bruhe', 'suppenkelle', 'chili'] },

  // --- Wasser & Hygiene ---
  { id: 'dusche', label: 'Dusche', Icon: ShowerHead, keywords: ['dusche', 'campingdusche', 'solardusche', 'duschzelt', 'waschgelegenheit'] },
  { id: 'toilette', label: 'Toilette', Icon: Toilet, keywords: ['toilette', 'klo', 'campingtoilette', 'chemietoilette', 'latrine', 'toilettenpapier', 'klopapier'] },
  { id: 'seife', label: 'Seife / Waschzeug', Icon: Droplet, keywords: ['seife', 'waschzeug', 'kulturbeutel', 'zahnburste', 'zahnpasta', 'shampoo', 'handtuch', 'waschlappen', 'duschgel'] },
  { id: 'muell', label: 'Müll / Entsorgung', Icon: Trash2, keywords: ['mull', 'mulleimer', 'mullsack', 'mulltute', 'abfall', 'mullbeutel'] },

  // --- Schlafen ---
  { id: 'schlafsack', label: 'Schlafsack', Icon: Bed, keywords: ['schlafsack', 'schlafsacke', 'daunenschlafsack', 'sommerschlafsack', 'huttenschlafsack', 'inlett'] },
  { id: 'isomatte', label: 'Isomatte', Icon: BedDouble, keywords: ['isomatte', 'schlafmatte', 'luftmatratze', 'thermomatte', 'feldbett', 'liege', 'matte', 'karrimatte'] },
  { id: 'decke', label: 'Wolldecke', Icon: Layers, keywords: ['decke', 'wolldecke', 'kuscheldecke', 'kissen', 'kopfkissen', 'picknickdecke'] },
  { id: 'nacht', label: 'Nachtruhe', Icon: Moon, keywords: ['nachtruhe', 'schlafmaske', 'ohrstopsel', 'ohropax'] },

  // --- Kleidung ---
  { id: 'kluft', label: 'Kluft / Kleidung', Icon: Shirt, keywords: ['kluft', 'kleidung', 'hemd', 'jacke', 'pullover', 'hose', 'wechselkleidung', 't shirt', 'fahrtenhemd'] },
  { id: 'halstuch', label: 'Halstuch', Icon: Flag, keywords: ['halstuch', 'halstucher', 'tuch', 'knoten halstuch', 'stammestuch'] },
  { id: 'regenjacke', label: 'Regenkleidung', Icon: Umbrella, keywords: ['regenjacke', 'regenkleidung', 'regenhose', 'regenponcho', 'poncho', 'matschhose', 'regenschutz'] },
  { id: 'schuhe', label: 'Schuhe / Stiefel', Icon: Footprints, keywords: ['schuhe', 'stiefel', 'wanderschuhe', 'wanderstiefel', 'gummistiefel', 'sandalen', 'gamaschen'] },
  { id: 'helm', label: 'Helm', Icon: HardHat, keywords: ['helm', 'schutzhelm', 'kletterhelm', 'bauhelm', 'kopfschutz'] },
  { id: 'handschuhe', label: 'Handschuhe', Icon: Shield, keywords: ['handschuhe', 'arbeitshandschuhe', 'lederhandschuhe', 'topflappen', 'grillhandschuh'] },
  { id: 'brille', label: 'Brille', Icon: Glasses, keywords: ['brille', 'sonnenbrille', 'schutzbrille', 'lesebrille'] },
  { id: 'muetze', label: 'Mütze / Hut', Icon: HardHat, keywords: ['mutze', 'hut', 'kappe', 'basecap', 'sonnenhut', 'strickmutze'] },

  // --- Erste Hilfe ---
  { id: 'erstehilfe', label: 'Erste Hilfe', Icon: Cross, keywords: ['erste hilfe', 'erstehilfe', 'verbandskasten', 'sanitatskasten', 'sani', 'notfall', 'verbandtasche'] },
  { id: 'pflaster', label: 'Pflaster / Verband', Icon: Bandage, keywords: ['pflaster', 'verband', 'binde', 'mullbinde', 'kompresse', 'blasenpflaster', 'tape'] },
  { id: 'medikament', label: 'Medikamente', Icon: Pill, keywords: ['medikament', 'tabletten', 'schmerzmittel', 'salbe', 'desinfektion', 'wunddesinfektion', 'zeckenzange', 'apotheke'] },
  { id: 'fieber', label: 'Fieberthermometer', Icon: Stethoscope, keywords: ['fieberthermometer', 'thermometer klinisch', 'blutdruck'] },

  // --- Navigation & Orientierung ---
  { id: 'kompass', label: 'Kompass', Icon: Compass, keywords: ['kompass', 'peilkompass', 'orientierung', 'nordung'] },
  { id: 'karte', label: 'Landkarte', Icon: MapIcon, keywords: ['karte', 'landkarte', 'wanderkarte', 'topografische karte', 'stadtplan', 'kartenmaterial'] },
  { id: 'gps', label: 'GPS / Ortung', Icon: MapPin, keywords: ['gps', 'gps gerat', 'ortung', 'wegpunkt', 'geocaching', 'tracker'] },
  { id: 'wegweiser', label: 'Wegweiser', Icon: Signpost, keywords: ['wegweiser', 'schild', 'wegmarkierung', 'markierung', 'wegzeichen'] },
  { id: 'route', label: 'Route / Tour', Icon: Route, keywords: ['route', 'tour', 'wanderung', 'strecke', 'etappe', 'roadbook'] },
  { id: 'fernglas', label: 'Fernglas', Icon: Binoculars, keywords: ['fernglas', 'fernglaser', 'monokular', 'spektiv'] },
  { id: 'navigation', label: 'Navigation', Icon: Navigation, keywords: ['navigation', 'navi', 'peilung', 'winkel'] },

  // --- Gepäck & Transport ---
  { id: 'rucksack', label: 'Rucksack', Icon: Backpack, keywords: ['rucksack', 'tourenrucksack', 'trekkingrucksack', 'kraxe', 'tagesrucksack', 'daypack'] },
  { id: 'seesack', label: 'Seesack / Tasche', Icon: Package, keywords: ['seesack', 'reisetasche', 'sporttasche', 'packsack', 'duffel', 'tragetasche', 'beutel'] },
  { id: 'kiste', label: 'Kiste / Box', Icon: Package, keywords: ['kiste', 'box', 'transportkiste', 'materialkiste', 'eurobox', 'aufbewahrungsbox', 'stapelbox'] },
  { id: 'anhaenger', label: 'Anhänger / Wagen', Icon: Caravan, keywords: ['anhanger', 'hanger', 'bollerwagen', 'handwagen', 'transportwagen', 'karre', 'sackkarre'] },
  { id: 'boot', label: 'Boot / Kanu', Icon: Sailboat, keywords: ['boot', 'kanu', 'kajak', 'kanadier', 'paddelboot', 'schlauchboot', 'floss'] },
  { id: 'paddel', label: 'Paddel', Icon: Anchor, keywords: ['paddel', 'ruder', 'stechpaddel', 'doppelpaddel'] },
  { id: 'schwimmweste', label: 'Schwimmweste', Icon: LifeBuoy, keywords: ['schwimmweste', 'rettungsweste', 'schwimmhilfe', 'rettungsring', 'auftriebshilfe'] },

  // --- Programm, Spiel & Musik ---
  { id: 'spiel', label: 'Spiel', Icon: Gamepad, keywords: ['spiel', 'spiele', 'gelandespiel', 'brettspiel', 'kartenspiel', 'ballspiel'] },
  { id: 'wuerfel', label: 'Würfel', Icon: Dices, keywords: ['wurfel', 'wurfelspiel', 'kniffel'] },
  { id: 'ball', label: 'Ball', Icon: Trophy, keywords: ['ball', 'fussball', 'volleyball', 'frisbee', 'wikinger schach', 'kubb'] },
  { id: 'gitarre', label: 'Gitarre', Icon: Guitar, keywords: ['gitarre', 'klampfe', 'ukulele', 'saiteninstrument'] },
  { id: 'trommel', label: 'Trommel', Icon: Drum, keywords: ['trommel', 'djembe', 'cajon', 'percussion'] },
  { id: 'liederbuch', label: 'Liederbuch', Icon: BookOpen, keywords: ['liederbuch', 'lieder', 'songbook', 'gesangbuch', 'ei gude'] },
  { id: 'musik', label: 'Musik / Lautsprecher', Icon: Megaphone, keywords: ['lautsprecher', 'box musik', 'megafon', 'megaphon', 'flustertute', 'verstarker'] },

  // --- Fahne, Auszeichnung & Zeremonie ---
  { id: 'fahne', label: 'Fahne / Wimpel', Icon: Flag, keywords: ['fahne', 'flagge', 'wimpel', 'banner', 'stander', 'stammesfahne'] },
  { id: 'abzeichen', label: 'Abzeichen', Icon: Award, keywords: ['abzeichen', 'aufnaher', 'patch', 'button', 'anstecker', 'orden'] },
  { id: 'pokal', label: 'Pokal / Preis', Icon: Trophy, keywords: ['pokal', 'preis', 'siegespreis', 'trophae'] },
  { id: 'medaille', label: 'Medaille', Icon: Medal, keywords: ['medaille', 'auszeichnung', 'ehrenzeichen'] },

  // --- Schreiben & Orga ---
  { id: 'buch', label: 'Buch', Icon: Book, keywords: ['buch', 'bucher', 'handbuch', 'nachschlagewerk', 'pfadfinderbuch'] },
  { id: 'notizbuch', label: 'Notizbuch', Icon: Notebook, keywords: ['notizbuch', 'block', 'notizblock', 'tagebuch', 'fahrtenbuch', 'kladde'] },
  { id: 'stift', label: 'Stift', Icon: Pencil, keywords: ['stift', 'stifte', 'kugelschreiber', 'bleistift', 'filzstift', 'edding', 'marker'] },
  { id: 'liste', label: 'Liste / Packliste', Icon: ClipboardList, keywords: ['liste', 'packliste', 'checkliste', 'inventarliste', 'teilnehmerliste'] },
  { id: 'klemmbrett', label: 'Klemmbrett', Icon: Clipboard, keywords: ['klemmbrett', 'klemmbretter', 'schreibunterlage'] },
  { id: 'urkunde', label: 'Urkunde / Dokument', Icon: Scroll, keywords: ['urkunde', 'dokument', 'formular', 'anmeldung', 'papier', 'unterlagen'] },

  // --- Elektronik & Kommunikation ---
  { id: 'funk', label: 'Funkgerät', Icon: Radio, keywords: ['funk', 'funkgerat', 'walkie talkie', 'sprechfunk', 'cb funk'] },
  { id: 'handy', label: 'Handy / Smartphone', Icon: Phone, keywords: ['handy', 'smartphone', 'telefon', 'mobiltelefon'] },
  { id: 'kamera', label: 'Kamera', Icon: Camera, keywords: ['kamera', 'fotoapparat', 'fotokamera', 'gopro', 'actioncam'] },
  { id: 'satellit', label: 'Satelliten-Telefon', Icon: Satellite, keywords: ['satellitentelefon', 'satphone', 'notfunk', 'notsender', 'plb'] },

  // --- Wetter & Natur ---
  { id: 'sonne', label: 'Sonnenschutz', Icon: Sun, keywords: ['sonnenschutz', 'sonnencreme', 'sonnenmilch', 'sonnenschirm', 'lsf'] },
  { id: 'regen', label: 'Regen', Icon: CloudRain, keywords: ['regen', 'regenschirm', 'schirm', 'regenwetter'] },
  { id: 'schnee', label: 'Schnee / Kälte', Icon: Snowflake, keywords: ['schnee', 'kalte', 'frost', 'eis', 'winterausrustung'] },
  { id: 'wind', label: 'Wind', Icon: Wind, keywords: ['wind', 'sturm', 'windschutz', 'windsack'] },
  { id: 'wolke', label: 'Wetter', Icon: Cloud, keywords: ['wetter', 'wolke', 'wetterstation', 'barometer'] },
  { id: 'thermometer', label: 'Thermometer', Icon: Thermometer, keywords: ['thermometer', 'temperatur', 'aussenthermometer'] },
  { id: 'baum', label: 'Baum / Wald', Icon: TreePine, keywords: ['baum', 'wald', 'tanne', 'nadelbaum', 'forst'] },
  { id: 'laubbaum', label: 'Laub / Bäume', Icon: Trees, keywords: ['baume', 'laubbaum', 'hain', 'geholz'] },
  { id: 'blatt', label: 'Blatt / Laub', Icon: Leaf, keywords: ['blatt', 'laub', 'blatter', 'zweig'] },
  { id: 'pflanze', label: 'Pflanze / Kräuter', Icon: Sprout, keywords: ['pflanze', 'kraut', 'krauter', 'setzling', 'keimling'] },
  { id: 'blume', label: 'Blume', Icon: Flower, keywords: ['blume', 'blumen', 'wiese', 'blute'] },
  { id: 'klee', label: 'Lilie / Klee', Icon: Clover, keywords: ['klee', 'kleeblatt', 'lilie', 'pfadfinderlilie', 'wappen'] },
  { id: 'berg', label: 'Berg', Icon: Mountain, keywords: ['berg', 'gebirge', 'gipfel', 'alpen', 'huette', 'wanderberg'] },
  { id: 'wasser', label: 'Wasser / See', Icon: Waves, keywords: ['wasser', 'see', 'fluss', 'bach', 'teich', 'gewasser', 'baden'] },
  { id: 'vogel', label: 'Vogel', Icon: Bird, keywords: ['vogel', 'vogel', 'meise', 'greifvogel'] },
  { id: 'hund', label: 'Hund / Tier', Icon: Dog, keywords: ['hund', 'tier', 'haustier', 'wachhund'] },
  { id: 'insekt', label: 'Insekten / Mücken', Icon: Bug, keywords: ['insekt', 'mucke', 'mucken', 'muckenschutz', 'muckenspray', 'zecke', 'insektenschutz', 'autan'] },
  { id: 'feder', label: 'Feder', Icon: Feather, keywords: ['feder', 'federn', 'schmuckfeder'] },

  // --- Sonstiges Material ---
  { id: 'schloss', label: 'Schloss', Icon: Lock, keywords: ['schloss', 'vorhangeschloss', 'zahlenschloss', 'fahrradschloss'] },
  { id: 'schluessel', label: 'Schlüssel', Icon: Key, keywords: ['schlussel', 'schlusselbund', 'zundschlussel'] },
  { id: 'glocke', label: 'Glocke', Icon: Bell, keywords: ['glocke', 'schelle', 'klingel', 'signalglocke'] },
  { id: 'ticket', label: 'Ticket / Karten', Icon: Ticket, keywords: ['ticket', 'eintrittskarte', 'fahrkarte', 'bahnticket', 'gutschein'] },
  { id: 'pinsel', label: 'Pinsel / Farbe', Icon: Brush, keywords: ['pinsel', 'farbe', 'malerpinsel', 'lack', 'sprayfarbe', 'kreide'] },
  { id: 'uhr', label: 'Uhr', Icon: Watch, keywords: ['uhr', 'armbanduhr', 'wecker', 'stoppuhr', 'taschenuhr'] },
  { id: 'teleskop', label: 'Teleskop', Icon: Telescope, keywords: ['teleskop', 'fernrohr', 'sternenkucker', 'astronomie'] },
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
 * ausreichend passt — Aufrufer nutzen dann {@link FALLBACK_ICON}). Ergebnisse
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

/** Wie {@link matchIconEntry}, aber immer mit Icon (Fallback statt `null`). */
export function iconForItem(rawName: string): { Icon: LucideIcon; label: string | null } {
  const entry = matchIconEntry(rawName);
  return entry ? { Icon: entry.Icon, label: entry.label } : { Icon: FALLBACK_ICON, label: null };
}
