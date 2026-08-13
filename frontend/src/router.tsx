import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import DepotListPage from './pages/DepotListPage';
import WarehousePage from './pages/WarehousePage';
import MaterialPage from './pages/MaterialPage';
import KitsPage from './pages/KitsPage';
import DefectReportPage from './pages/DefectReportPage';
import InventoryPrintPage from './pages/print/InventoryPrintPage';
import BoxLabelPrintPage from './pages/print/BoxLabelPrintPage';
import KitPrintPage from './pages/print/KitPrintPage';

export const router = createBrowserRouter([
  { path: '/', element: <DepotListPage /> },
  {
    path: '/lager/:depotId',
    element: <Layout />,
    children: [
      { index: true, element: <WarehousePage /> },
      { path: 'material', element: <MaterialPage /> },
      { path: 'bausaetze', element: <KitsPage /> },
      { path: 'mangel', element: <DefectReportPage /> },
    ],
  },
  // Druckansichten ohne Layout-Chrome (eigene @media print Seiten).
  { path: '/lager/:depotId/druck/bestand', element: <InventoryPrintPage /> },
  { path: '/lager/:depotId/druck/kiste/:locationId', element: <BoxLabelPrintPage /> },
  { path: '/lager/:depotId/druck/bausatz/:kitId', element: <KitPrintPage /> },
]);
