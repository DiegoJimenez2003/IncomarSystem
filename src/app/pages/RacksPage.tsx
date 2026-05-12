import { useState } from 'react';
import { Search, Plus, Warehouse, AlertCircle } from 'lucide-react';
import { racksData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function RacksPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const racksFiltrados = racksData.filter((rack) => {
    const matchesSearch =
      rack.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rack.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filtroEstado === 'todos' || rack.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      disponible: 'bg-green-100 text-green-700',
      parcial: 'bg-yellow-100 text-yellow-700',
      lleno: 'bg-red-100 text-red-700',
      mantenimiento: 'bg-gray-100 text-gray-700',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'PAC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const canManage = user?.rol === 'administrador' || user?.rol === 'supervisor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Racks</h1>
          <p className="text-gray-600">Control de ubicaciones de almacenamiento</p>
        </div>

        {canManage && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Rack
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="parcial">Parcial</option>
            <option value="lleno">Lleno</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {racksFiltrados.map((rack) => {
            const porcentajeOcupacion = (rack.capacidadActual / rack.capacidadMaxima) * 100;
            const estaLleno = porcentajeOcupacion >= 100;

            return (
              <div
                key={rack.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  estaLleno
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Warehouse className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900">{rack.codigo}</h3>
                      <p className="text-xs text-gray-600">{rack.ubicacion}</p>
                    </div>
                  </div>
                  {estaLleno && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Ocupación</span>
                      <span className="text-gray-900">
                        {rack.capacidadActual}/{rack.capacidadMaxima} cajas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          porcentajeOcupacion >= 100
                            ? 'bg-red-600'
                            : porcentajeOcupacion >= 70
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{porcentajeOcupacion.toFixed(0)}%</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`flex-1 px-3 py-1 rounded-lg text-center text-xs ${getTipoBadge(rack.tipo)}`}>
                      {rack.tipo}
                    </span>
                    <span className={`flex-1 px-3 py-1 rounded-lg text-center text-xs ${getEstadoBadge(rack.estado)}`}>
                      {rack.estado.charAt(0).toUpperCase() + rack.estado.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {racksFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron racks</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Disponibles</p>
          <p className="text-green-700">{racksData.filter((r) => r.estado === 'disponible').length}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Parciales</p>
          <p className="text-yellow-700">{racksData.filter((r) => r.estado === 'parcial').length}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-100">
          <p className="text-gray-700 mb-2">Llenos</p>
          <p className="text-red-700">{racksData.filter((r) => r.estado === 'lleno').length}</p>
        </div>
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <p className="text-gray-700 mb-2">Mantenimiento</p>
          <p className="text-gray-700">{racksData.filter((r) => r.estado === 'mantenimiento').length}</p>
        </div>
      </div>
    </div>
  );
}
