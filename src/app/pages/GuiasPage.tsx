import { useState } from 'react';
import { Search, Plus, FileSignature, Edit2, Trash2 } from 'lucide-react';
import { guiasData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function GuiasPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const guiasFiltradas = guiasData.filter(
    (guia) =>
      guia.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.barco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleEditar = (id: string) => {
    alert('Editar guía ' + id + ' (funcionalidad de demostración)');
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta guía?')) {
      alert('Guía eliminada (funcionalidad de demostración)');
    }
  };

  const canManage = user?.rol === 'administrador' || user?.rol === 'supervisor' || user?.rol === 'secretaria';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Guías de Despacho</h1>
          <p className="text-gray-600">Registro de guías asociadas a lotes</p>
        </div>

        {canManage && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nueva Guía
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de guía, lote o barco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Nº Guía</th>
                <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 text-gray-700">Barco</th>
                <th className="text-left py-3 px-4 text-gray-700">Origen</th>
                <th className="text-left py-3 px-4 text-gray-700">Destino</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
                {canManage && <th className="text-left py-3 px-4 text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {guiasFiltradas.map((guia) => (
                <tr key={guia.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileSignature className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{guia.numero}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{guia.loteCodigo}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.barco}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.origen}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.destino}</td>
                  <td className="py-3 px-4 text-gray-900">{guia.kilos.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(guia.fecha)}</td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditar(guia.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(guia.id)}
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

        {guiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron guías</p>
          </div>
        )}
      </div>
    </div>
  );
}
