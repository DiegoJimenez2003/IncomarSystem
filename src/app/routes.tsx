import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LotesPage } from './pages/LotesPage';
import { GuiasPage } from './pages/GuiasPage';
import { ProcesamientoPage } from './pages/ProcesamientoPage';
import { InventarioPage } from './pages/InventarioPage';
import { RacksPage } from './pages/RacksPage';
import { MovimientosPage } from './pages/MovimientosPage';
import { CalidadPage } from './pages/CalidadPage';
import { EstadosProductoPage } from './pages/EstadosProductoPage';
import { EmbarquesPage } from './pages/EmbarquesPage';
import { TrazabilidadPage } from './pages/TrazabilidadPage';
import { ReportesPage } from './pages/ReportesPage';
import { ProductosPage } from './pages/ProductosPage';
import { PlantasPage } from './pages/PlantasPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'lotes',
            element: <LotesPage />,
          },
          {
            path: 'guias',
            element: <GuiasPage />,
          },
          {
            path: 'procesamiento',
            element: <ProcesamientoPage />,
          },
          {
            path: 'inventario',
            element: <InventarioPage />,
          },
          {
            path: 'racks',
            element: <RacksPage />,
          },
          {
            path: 'movimientos',
            element: <MovimientosPage />,
          },
          {
            path: 'calidad',
            element: <CalidadPage />,
          },
          {
            path: 'estados',
            element: <EstadosProductoPage />,
          },
          {
            path: 'embarques',
            element: <EmbarquesPage />,
          },
          {
            path: 'trazabilidad',
            element: <TrazabilidadPage />,
          },
          {
            path: 'reportes',
            element: <ReportesPage />,
          },
          {
            path: 'productos',
            element: <ProductosPage />,
          },
          {
            path: 'plantas',
            element: <PlantasPage />,
          },
          {
            path: 'usuarios',
            element: <UsuariosPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
