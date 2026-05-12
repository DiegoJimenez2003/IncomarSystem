import { useState } from 'react';
import { Search, Plus, User, Mail, Shield } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

const usuariosData: Usuario[] = [
  { id: '1', nombre: 'Carlos Administrador', email: 'admin@incomar.cl', rol: 'administrador', activo: true },
  { id: '2', nombre: 'Juan Supervisor', email: 'supervisor@incomar.cl', rol: 'supervisor', activo: true },
  { id: '3', nombre: 'María Calidad', email: 'calidad@incomar.cl', rol: 'calidad', activo: true },
  { id: '4', nombre: 'Ana Secretaria', email: 'secretaria@incomar.cl', rol: 'secretaria', activo: true },
];

export function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const usuariosFiltrados = usuariosData.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolColor = (rol: string) => {
    const colors = {
      administrador: 'bg-red-100 text-red-700',
      supervisor: 'bg-blue-100 text-blue-700',
      calidad: 'bg-green-100 text-green-700',
      secretaria: 'bg-purple-100 text-purple-700',
    };
    return colors[rol as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getRolNombre = (rol: string) => {
    const nombres = {
      administrador: 'Administrador',
      supervisor: 'Supervisor/Bodega',
      calidad: 'Control de Calidad',
      secretaria: 'Secretaria',
    };
    return nombres[rol as keyof typeof nombres] || rol;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administración de accesos y permisos</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuariosFiltrados.map((usuario) => (
            <div key={usuario.id} className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900">{usuario.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">{usuario.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className={`px-3 py-1 rounded-full text-xs ${getRolColor(usuario.rol)}`}>
                    {getRolNombre(usuario.rol)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      usuario.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-5 rounded-xl border border-red-100">
          <p className="text-gray-700 mb-2">Administradores</p>
          <p className="text-red-700">{usuariosData.filter((u) => u.rol === 'administrador').length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Supervisores</p>
          <p className="text-blue-700">{usuariosData.filter((u) => u.rol === 'supervisor').length}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Control Calidad</p>
          <p className="text-green-700">{usuariosData.filter((u) => u.rol === 'calidad').length}</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-gray-700 mb-2">Secretarias</p>
          <p className="text-purple-700">{usuariosData.filter((u) => u.rol === 'secretaria').length}</p>
        </div>
      </div>
    </div>
  );
}
