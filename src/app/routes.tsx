import { createBrowserRouter, Navigate } from 'react-router';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },

          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
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