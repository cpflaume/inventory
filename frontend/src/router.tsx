import { createBrowserRouter, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import DepotListPage from './pages/DepotListPage';
import WarehousePage from './pages/WarehousePage';
import MaterialPage from './pages/MaterialPage';
import KitsPage from './pages/KitsPage';
import DefectReportPage from './pages/DefectReportPage';
import InventoryPrintPage from './pages/print/InventoryPrintPage';
import BoxLabelPrintPage from './pages/print/BoxLabelPrintPage';
import KitPrintPage from './pages/print/KitPrintPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OidcCallbackPage from './pages/OidcCallbackPage';
import AdminPage from './pages/AdminPage';
import ErrorPage from './pages/ErrorPage';
import { RequireAdmin, RequireAuth } from './auth/guards';

export const router = createBrowserRouter([
  {
    // Pathless Wurzel-Route: fängt abgestürzte Routen zentral über die
    // freundliche Fehlerseite ab (statt der Whitelabel-Standardseite).
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      // Öffentlich
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/callback', element: <OidcCallbackPage /> },

      // Angemeldet
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <DepotListPage /> },
          {
            element: <RequireAdmin />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
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
          // Druckansichten ohne Layout-Chrome.
          { path: '/lager/:depotId/druck/bestand', element: <InventoryPrintPage /> },
          { path: '/lager/:depotId/druck/kiste/:locationId', element: <BoxLabelPrintPage /> },
          { path: '/lager/:depotId/druck/bausatz/:kitId', element: <KitPrintPage /> },
        ],
      },

      // Unbekannter Pfad → gleiche Fehlerseite als 404.
      { path: '*', element: <ErrorPage /> },
    ],
  },
]);
