import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PrintSheet } from './PrintSheet';

/** Druckbare Bestandsliste eines Lagers, nach Aufräumort gruppiert. */
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
          <div key={g.locationLabel}>
            <h2 className="mb-1 font-semibold text-moos-700">{g.locationLabel}</h2>
            <table className="w-full text-left text-sm">
              <tbody>
                {g.items.map((it) => (
                  <tr key={it.id} className="border-b border-moos-50">
                    <td className="py-1.5">{it.name}</td>
                    <td className="w-20 py-1.5 text-right text-moos-500">×{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </PrintSheet>
  );
}
