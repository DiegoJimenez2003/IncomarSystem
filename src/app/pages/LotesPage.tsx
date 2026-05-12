import { useState } from 'react';
import { Search, Plus, Eye, Edit2, PackageCheck } from 'lucide-react';
import { lotesData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function LotesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const lotesFiltrados = lotesData.filter((lote) => {
    const matchesSearch =
      lote.loteOrigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.loteInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filtroEstado === 'todos' || lote.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activo: 'bg-blue-100 text-blue-700',
      procesando: 'bg-yellow-100 text-yellow-700',
      procesado: 'bg-green-100 text-green-700',
      despachado: 'bg-gray-100 text-gray-700',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const canRegister = user?.rol === 'administrador' || user?.rol === 'supervisor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Lotes</h1>
          <p className="text-gray-600">Control y trazabilidad de lotes de producción</p>
        </div>

        {canRegister && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Lote
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote origen, lote interno o producto..."
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
            <option value="activo">Activo</option>
            <option value="procesando">Procesando</option>
            <option value="procesado">Procesado</option>
            <option value="despachado">Despachado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Lote Origen</th>
                <th className="text-left py-3 px-4 text-gray-700">Lote Interno</th>
                <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-gray-700">Planta</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha Llegada</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos Entrada</th>
                <th className="text-left py-3 px-4 text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{lote.loteOrigen}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{lote.loteInterno}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{lote.productoNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{lote.plantaNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(lote.fechaLlegada)}</td>
                  <td className="py-3 px-4 text-gray-900">{lote.kilosEntrada.toLocaleString()} kg</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(lote.estado)}`}>
                      {lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canRegister && (
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lotesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron lotes</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Lotes</p>
          <p className="text-gray-900">{lotesData.length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Activos</p>
          <p className="text-blue-700">{lotesData.filter((l) => l.estado === 'activo').length}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Procesando</p>
          <p className="text-yellow-700">{lotesData.filter((l) => l.estado === 'procesando').length}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Procesados</p>
          <p className="text-green-700">{lotesData.filter((l) => l.estado === 'procesado').length}</p>
        </div>
      </div>
    </div>
  );
}
