import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  FileText,
  Users,
  Fish,
  PackageCheck,
  FileSignature,
  Warehouse,
  Building2,
  Factory,
  ClipboardCheck,
  Ship,
  Route,
  Tag,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import logo from '../../assets/logo_sin_nombre.png';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Lotes',
      path: '/lotes',
      icon: PackageCheck,
    },
    {
      name: 'Guías',
      path: '/guias',
      icon: FileSignature,
    },
    {
      name: 'Procesamiento',
      path: '/procesamiento',
      icon: Factory,
    },
    {
      name: 'Inventario',
      path: '/inventario',
      icon: Package,
    },
    {
      name: 'Racks',
      path: '/racks',
      icon: Warehouse,
    },
    {
      name: 'Movimientos',
      path: '/movimientos',
      icon: ArrowRightLeft,
    },
    {
      name: 'Control Calidad',
      path: '/calidad',
      icon: ClipboardCheck,
    },
    {
      name: 'Estados Producto',
      path: '/estados',
      icon: Tag,
    },
    {
      name: 'Embarques',
      path: '/embarques',
      icon: Ship,
    },
    {
      name: 'Trazabilidad',
      path: '/trazabilidad',
      icon: Route,
    },
    {
      name: 'Reportes',
      path: '/reportes',
      icon: FileText,
    },
    {
      name: 'Productos',
      path: '/productos',
      icon: Fish,
    },
    {
      name: 'Plantas',
      path: '/plantas',
      icon: Building2,
    },
    {
      name: 'Usuarios',
      path: '/usuarios',
      icon: Users,
    },
  ];

  const filteredNavItems = navItems;

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 md:w-20'
      } overflow-hidden border-r border-gray-800`}
    >
      <div className="flex flex-col h-full">
        
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="Incomar"
              className="w-16 h-16 object-contain"
            />
          </div>

          {isOpen && (
            <div>
              <h1 className="text-white font-bold text-lg">
                INCOMAR
              </h1>

              <p className="text-xs text-gray-400">
                Gestión Pesquera
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />

                    {isOpen && (
                      <span className="text-sm">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {isOpen && (
          <div className="p-4 border-t border-gray-800">
            
            <div className="mb-2">
              <p className="text-sm text-white font-medium">
                {user?.nombre}
              </p>

              <p className="text-xs text-gray-400">
                {user?.email}
              </p>
            </div>

            <div className="text-xs text-gray-500">
              Sistema de Trazabilidad
            </div>

            <div className="text-xs text-gray-400 mt-1">
              Versión 1.0.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}