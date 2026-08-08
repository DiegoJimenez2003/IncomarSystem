import { createBrowserRouter, Navigate } from 'react-router';

// ======================================================
// PÁGINAS PRINCIPALES
// ======================================================

import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';

// ======================================================
// PÁGINAS DEL SISTEMA
// ======================================================

import { LotesPage } from './pages/LotesPage';
import { GuiasPage } from './pages/GuiasPage';
import { ProcesamientoPage } from './pages/ProcesamientoPage';
import { InventarioPage } from './pages/InventarioPage';
import { RacksPage } from './pages/RacksPage';
import { MovimientosPage } from './pages/MovimientosPage';
import { CalidadPage } from './pages/CalidadPage';
import { EstadosProductoPage } from './pages/EstadosProductoPage';
import { DocumentosPage } from './pages/DocumentosPage';
import { EmbarquesPage } from './pages/EmbarquesPage';
import { TrazabilidadPage } from './pages/TrazabilidadPage';
import { ProductosPage } from './pages/ProductosPage';
import { PlantasPage } from './pages/PlantasPage';
import { UsuariosPage } from './pages/UsuariosPage';

// ======================================================
// COMPONENTES DE ESTRUCTURA
// ======================================================

import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// ======================================================
// CONFIGURACIÓN DE RUTAS PRINCIPALES
// ======================================================

export const router = createBrowserRouter([

  // ======================================================
  // RUTA LOGIN
  // Página pública sin autenticación
  // ======================================================

  {
    path: '/login',
    element: <LoginPage />,
  },

  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // ======================================================
  // RUTAS PROTEGIDAS
  // Solo accesibles con sesión iniciada
  // ======================================================

  {
    element: <ProtectedRoute />,

    children: [
      {
        element: <MainLayout />,

        children: [

          // ======================================================
          // REDIRECCIÓN PRINCIPAL
          // ======================================================

          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },

          // ======================================================
          // DASHBOARD
          // ======================================================

          {
            path: '/dashboard',
            element: <DashboardPage />,
          },

          // ======================================================
          // MÓDULO LOTES
          // ======================================================

          {
            path: '/lotes',
            element: <LotesPage />,
          },

          // ======================================================
          // MÓDULO GUÍAS
          // ======================================================

          {
            path: '/guias',
            element: <GuiasPage />,
          },

          // ======================================================
          // MÓDULO PROCESAMIENTO
          // ======================================================

          {
            path: '/procesamiento',
            element: <ProcesamientoPage />,
          },

          // ======================================================
          // MÓDULO INVENTARIO
          // ======================================================

          {
            path: '/inventario',
            element: <InventarioPage />,
          },

          // ======================================================
          // MÓDULO RACKS
          // ======================================================

          {
            path: '/racks',
            element: <RacksPage />,
          },

          // ======================================================
          // MÓDULO MOVIMIENTOS
          // ======================================================

          {
            path: '/movimientos',
            element: <MovimientosPage />,
          },

          // ======================================================
          // MÓDULO CONTROL CALIDAD
          // ======================================================

          {
            path: '/calidad',
            element: <CalidadPage />,
          },

          // ======================================================
          // MÓDULO ESTADOS PRODUCTO
          // ======================================================

          {
            path: '/estados',
            element: <EstadosProductoPage />,
          },

          // ======================================================
          // MÓDULO DOCUMENTOS
          // ======================================================

          {
            path: '/documentos',
            element: <DocumentosPage />,
          },

          // ======================================================
          // MÓDULO EMBARQUES
          // ======================================================

          {
            path: '/embarques',
            element: <EmbarquesPage />,
          },

          // ======================================================
          // MÓDULO TRAZABILIDAD
          // ======================================================

          {
            path: '/trazabilidad',
            element: <TrazabilidadPage />,
          },


          // ======================================================
          // MÓDULO PRODUCTOS
          // ======================================================

          {
            path: '/productos',
            element: <ProductosPage />,
          },

          // ======================================================
          // MÓDULO PLANTAS
          // ======================================================

          {
            path: '/plantas',
            element: <PlantasPage />,
          },

          // ======================================================
          // MÓDULO USUARIOS
          // ======================================================

          {
            path: '/usuarios',
            element: <UsuariosPage />,
          },
        ],
      },
    ],
  },

  // ======================================================
  // RUTA NO ENCONTRADA
  // ======================================================

  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);