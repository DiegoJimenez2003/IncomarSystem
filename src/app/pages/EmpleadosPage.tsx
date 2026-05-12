import { useState } from 'react';
import { Search, User, Mail, Phone, Briefcase } from 'lucide-react';
import { empleadosData } from '../data/mockData';

export function EmpleadosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const empleadosFiltrados = empleadosData.filter((empleado) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      empleado.nombre.toLowerCase().includes(searchLower) ||
      empleado.email.toLowerCase().includes(searchLower) ||
      empleado.cargo.toLowerCase().includes(searchLower) ||
      empleado.area.toLowerCase().includes(searchLower)
    );
  });

  const getAreaColor = (area: string) => {
    const colors = {
      Administración: 'bg-blue-100 text-blue-700',
      Operaciones: 'bg-green-100 text-green-700',
      Calidad: 'bg-purple-100 text-purple-700',
    };
    return colors[area as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Empleados</h1>
        <p className="text-gray-600">Directorio de trabajadores de la empresa</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, cargo o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empleadosFiltrados.map((empleado) => (
            <div
              key={empleado.id}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900">{empleado.nombre}</h3>
                  <p className="text-gray-600">{empleado.cargo}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm break-all">{empleado.email}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{empleado.telefono}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${getAreaColor(
                      empleado.area
                    )}`}
                  >
                    {empleado.area}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {empleadosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron empleados</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Resumen por Área</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-gray-700 mb-2">Administración</p>
            <p className="text-blue-700">
              {empleadosData.filter((e) => e.area === 'Administración').length} empleados
            </p>
          </div>
          <div className="p-5 bg-green-50 rounded-lg border border-green-100">
            <p className="text-gray-700 mb-2">Operaciones</p>
            <p className="text-green-700">
              {empleadosData.filter((e) => e.area === 'Operaciones').length} empleados
            </p>
          </div>
          <div className="p-5 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-gray-700 mb-2">Calidad</p>
            <p className="text-purple-700">
              {empleadosData.filter((e) => e.area === 'Calidad').length} empleados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
