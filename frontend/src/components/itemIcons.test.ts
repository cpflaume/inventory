import { describe, expect, it } from 'vitest';
import { ICON_CATALOG, FALLBACK_ICON, iconForItem, matchIconEntry, normalizeTerm } from './itemIcons';

describe('itemIcons – automatische Grafik-Zuordnung', () => {
  it('trifft exakte Namen', () => {
    expect(matchIconEntry('Hammer')?.id).toBe('hammer');
    expect(matchIconEntry('Kompass')?.id).toBe('kompass');
    expect(matchIconEntry('Schlafsack')?.id).toBe('schlafsack');
  });

  it('erkennt deutsche Komposita per Teilwort', () => {
    // „Jurtendach" enthält den Wortstamm „jurte".
    expect(matchIconEntry('Jurtendach')?.id).toBe('jurte');
    // „Zelthering" → spezifischerer Stamm „hering" gewinnt gegen „zelt".
    expect(matchIconEntry('Zelthering')?.id).toBe('hering');
    expect(matchIconEntry('Gaskocher')?.id).toBe('kocher');
  });

  it('matcht Synonyme / andere Begriffe (Bedeutungs-Schicht)', () => {
    expect(matchIconEntry('Fäustel')?.id).toBe('hammer');
    expect(matchIconEntry('Tipi')?.id).toBe('jurte');
    expect(matchIconEntry('Beil')?.id).toBe('axt');
    expect(matchIconEntry('Feldflasche')?.id).toBe('feldflasche');
  });

  it('ist robust gegen Umlaute, Groß-/Kleinschreibung und ß', () => {
    expect(matchIconEntry('GASKOCHER')?.id).toBe('kocher');
    expect(matchIconEntry('taschenlampe')?.id).toBe('taschenlampe');
    expect(normalizeTerm('Fäustel')).toBe('faustel');
    expect(normalizeTerm('Straße')).toBe('strasse');
  });

  it('toleriert kleine Tippfehler (unscharfe Suche)', () => {
    expect(matchIconEntry('Kompas')?.id).toBe('kompass');
    expect(matchIconEntry('Schlaffsack')?.id).toBe('schlafsack');
  });

  it('liefert Fallback-Icon bei unbekannten Namen', () => {
    expect(matchIconEntry('Xylophon-Quark-9000')).toBeNull();
    expect(iconForItem('Xylophon-Quark-9000').Icon).toBe(FALLBACK_ICON);
    expect(iconForItem('Xylophon-Quark-9000').label).toBeNull();
  });

  it('hat eine große, konsistente Icon-Datenbank', () => {
    expect(ICON_CATALOG.length).toBeGreaterThanOrEqual(100);
    // eindeutige IDs
    const ids = new Set(ICON_CATALOG.map((e) => e.id));
    expect(ids.size).toBe(ICON_CATALOG.length);
    // jedes Motiv hat mindestens einen Suchbegriff
    for (const e of ICON_CATALOG) expect(e.keywords.length).toBeGreaterThan(0);
  });
});
