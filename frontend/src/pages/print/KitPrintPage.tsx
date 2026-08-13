import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PrintSheet } from './PrintSheet';

/** Stückliste eines Bausatzes: "was gehört zu diesem Zelt". */
export default function KitPrintPage() {
  const { depotId = '', kitId = '' } = useParams();
  const { data: kit } = useQuery({
    queryKey: ['kit', depotId, kitId],
    queryFn: () => api.getKit(depotId, kitId),
  });

  if (!kit) return <p className="p-6 text-moos-400">Lade …</p>;

  return (
    <PrintSheet title={kit.name} subtitle={kit.description ?? 'Stückliste — was gehört zu diesem Zelt'}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-moos-200 text-moos-500">
            <th className="py-2">Teil</th>
            <th className="py-2 text-right">Soll-Menge</th>
            <th className="w-16 py-2 text-center">✓</th>
          </tr>
        </thead>
        <tbody>
          {kit.positions.map((p) => (
            <tr key={p.id} className="border-b border-moos-50">
              <td className="py-2">{p.label}</td>
              <td className="py-2 text-right font-medium">{p.targetQuantity}</td>
              <td className="py-2 text-center text-moos-300">☐</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PrintSheet>
  );
}
