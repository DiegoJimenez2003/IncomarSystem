import { useState } from 'react';
import { Search, Plus, Ship, Edit2, Trash2 } from 'lucide-react';
import { embarquesData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function EmbarquesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const embarquesFiltrados = embarquesData.filter((embarque) => {
    const matchesSearch =
      embarque.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      embarque.destino.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filtroEstado === 'todos' || embarque.estado === filtroEstado;

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
      preparando: 'bg-yellow-100 text-yellow-700',
      despachado: 'bg-blue-100 text-blue-700',
      en_transito: 'bg-purple-100 text-purple-700',
      entregado: 'bg-green-100 text-green-700',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const handleEditar = (id: string) => {
    alert('Editar embarque ' + id + ' (funcionalidad de demostración)');
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este embarque?')) {
      alert('Embarque eliminado (funcionalidad de demostración)');
    }
  };

  const canManage = user?.rol === 'administrador' || user?.rol === 'supervisor' || user?.rol === 'secretaria';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Embarques</h1>
          <p className="text-gray-600">Registro y seguimiento de despachos</p>
        </div>

        {canManage && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Embarque
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o destino..."
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
            <option value="preparando">Preparando</option>
            <option value="despachado">Despachado</option>
            <option value="en_transito">En Tránsito</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Código</th>
                <th className="text-left py-3 px-4 text-gray-700">Destino</th>
                <th className="text-left py-3 px-4 text-gray-700">Transporte</th>
                <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-700">Responsable</th>
                <th className="text-left py-3 px-4 text-gray-700">Estado</th>
                {canManage && <th className="text-left py-3 px-4 text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {embarquesFiltrados.map((embarque) => (
                <tr key={embarque.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{embarque.codigo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{embarque.destino}</td>
                  <td className="py-3 px-4 text-gray-600">{embarque.transporte}</td>
                  <td className="py-3 px-4 text-gray-900">{embarque.cajasTotal}</td>
                  <td className="py-3 px-4 text-gray-900">{embarque.kilosTotal.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(embarque.fecha)}</td>
                  <td className="py-3 px-4 text-gray-600">{embarque.responsable}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(embarque.estado)}`}>
                      {embarque.estado.replace('_', ' ').charAt(0).toUpperCase() +
                        embarque.estado.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditar(embarque.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(embarque.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {embarquesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Ship className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron embarques</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Preparando</p>
          <p className="text-yellow-700">{embarquesData.filter((e) => e.estado === 'preparando').length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Despachados</p>
          <p className="text-blue-700">{embarquesData.filter((e) => e.estado === 'despachado').length}</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-gray-700 mb-2">En Tránsito</p>
          <p className="text-purple-700">{embarquesData.filter((e) => e.estado === 'en_transito').length}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Entregados</p>
          <p className="text-green-700">{embarquesData.filter((e) => e.estado === 'entregado').length}</p>
        </div>
      </div>
    </div>
  );
}
