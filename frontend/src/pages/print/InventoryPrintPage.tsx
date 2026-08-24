import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PrintSheet } from './PrintSheet';
import { ConditionMark, ItemMeta, OpenDefects } from './printBits';

/** Druckbare Bestandsliste eines Lagers, nach Aufräumort gruppiert — mit Details und offenen Mängeln. */
export default function InventoryPrintPage() {
  const { depotId = '' } = useParams();
  const { data } = useQuery({
    queryKey: ['inventory', depotId],
    queryFn: () => api.inventory(depotId),
  });

  if (!data) return <p className="p-6 text-moos-400">Lade …</p>;

  return (
    <PrintSheet title={`Bestandsliste · ${data.depotName}`} subtitle={`${data.totalItems} Teile insgesamt`}>
      <div className="space-y-5">
        {data.groups.map((g) => (
          <div key={g.locationId ?? g.locationLabel}>
            <h2 className="mb-1 font-semibold text-moos-700">{g.locationLabel}</h2>
            {g.items.length > 0 && (
              <table className="w-full text-left text-sm">
                <tbody>
                  {g.items.map((it) => (
                    <tr key={it.id} className="border-b border-moos-50 align-top">
                      <td className="py-1.5">
                        <ConditionMark flag={it.conditionFlag} />
                        <span className="font-medium text-moos-800">{it.name}</span>
                        <ItemMeta category={it.category} note={it.note} />
                      </td>
                      <td className="w-20 py-1.5 text-right text-moos-500">×{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <OpenDefects defects={g.openDefects} />
          </div>
        ))}
      </div>
    </PrintSheet>
  );
}
