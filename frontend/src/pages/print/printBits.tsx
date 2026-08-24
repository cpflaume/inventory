import type { ConditionFlag, DefectSummary } from '../../api/types';

const CONDITION: Record<ConditionFlag, { emoji: string; label: string }> = {
  GREEN: { emoji: '🟢', label: 'einsatzbereit' },
  YELLOW: { emoji: '🟡', label: 'kleine Macke' },
  RED: { emoji: '🔴', label: 'defekt' },
};

const SEVERITY: Record<DefectSummary['severity'], { emoji: string; label: string }> = {
  MACKE: { emoji: '🩹', label: 'Macke' },
  DEFEKT: { emoji: '💥', label: 'Defekt' },
};

/** Zustands-Ampel als Emoji — für GREEN bewusst nichts, um die Liste ruhig zu halten. */
export function ConditionMark({ flag }: { flag: ConditionFlag }) {
  if (flag === 'GREEN') return null;
  const c = CONDITION[flag];
  return (
    <span className="mr-1" title={c.label} aria-label={c.label}>
      {c.emoji}
    </span>
  );
}

/** Sekundärzeile eines Gegenstands: Kategorie · Notiz (nur was gesetzt ist). */
export function ItemMeta({ category, note }: { category?: string | null; note?: string | null }) {
  const meta = [category, note].filter(Boolean).join(' · ');
  if (!meta) return null;
  return <span className="block text-xs text-moos-500">{meta}</span>;
}

/** Offene-Mängel-Block für eine Kiste bzw. eine Bestands-Gruppe. */
export function OpenDefects({ defects, heading = true }: { defects: DefectSummary[]; heading?: boolean }) {
  if (defects.length === 0) return null;
  return (
    <div className="mt-2">
      {heading && (
        <h3 className="mb-1 text-sm font-semibold text-lagerfeuer-700">
          ⚠️ Offene Mängel ({defects.length})
        </h3>
      )}
      <ul className="space-y-1">
        {defects.map((d) => {
          const sev = SEVERITY[d.severity];
          return (
            <li key={d.id} className="flex items-baseline gap-2 text-sm">
              <span title={sev.label}>{sev.emoji}</span>
              <span className="min-w-0">
                <span className="font-medium text-moos-800">{d.title}</span>
                {d.description && <span className="text-moos-500"> — {d.description}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
