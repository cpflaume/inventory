import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PrintSheet } from './PrintSheet';
import { ConditionMark, ItemMeta, OpenDefects } from './printBits';

/** Beipackzettel einer Kiste: Inhalt (mit Details) und offene Mängel zum An-die-Box-heften. */
export default function BoxLabelPrintPage() {
  const { depotId = '', locationId = '' } = useParams();
  const { data } = useQuery({
    queryKey: ['box-contents', depotId, locationId],
    queryFn: () => api.boxContents(depotId, locationId),
  });

  if (!data) return <p className="p-6 text-moos-400">Lade …</p>;

  return (
    <PrintSheet title={`📦 ${data.label}`} subtitle="Beipackzettel — Inhalt dieser Kiste">
      {data.items.length === 0 ? (
        <p className="text-moos-400">Diese Kiste ist leer.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-moos-200 text-moos-500">
              <th className="py-2">Inhalt</th>
              <th className="w-20 py-2 text-right">Menge</th>
              <th className="w-16 py-2 text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id} className="border-b border-moos-50 align-top">
                <td className="py-2">
                  <ConditionMark flag={it.conditionFlag} />
                  <span className="font-medium text-moos-800">{it.name}</span>
                  <ItemMeta category={it.category} note={it.note} />
                </td>
                <td className="py-2 text-right font-medium">{it.quantity}</td>
                <td className="py-2 text-center text-moos-300">☐</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <OpenDefects defects={data.openDefects} />
    </PrintSheet>
  );
}
