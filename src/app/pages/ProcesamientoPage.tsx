import { useState } from 'react';
import { Search, Plus, Factory, TrendingUp } from 'lucide-react';
import { procesosData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function ProcesamientoPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const procesosFiltrados = procesosData.filter(
    (proceso) =>
      proceso.loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proceso.formato.toLowerCase().includes(searchTerm.toLowerCase())
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

  const canRegister = user?.rol === 'administrador' || user?.rol === 'supervisor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Procesamiento Productivo</h1>
          <p className="text-gray-600">Registro de procesos y rendimientos</p>
        </div>

        {canRegister && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Proceso
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote o formato..."
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
                <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-700">Kg Entrada</th>
                <th className="text-left py-3 px-4 text-gray-700">Kg Salida</th>
                <th className="text-left py-3 px-4 text-gray-700">Merma</th>
                <th className="text-left py-3 px-4 text-gray-700">Rendimiento</th>
                <th className="text-left py-3 px-4 text-gray-700">Formato</th>
                <th className="text-left py-3 px-4 text-gray-700">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {procesosFiltrados.map((proceso) => (
                <tr key={proceso.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{proceso.loteCodigo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(proceso.fecha)}</td>
                  <td className="py-3 px-4 text-gray-900">{proceso.kilosEntrada.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-900">{proceso.kilosSalida.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-red-600">{proceso.merma.toLocaleString()} kg</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${proceso.rendimiento >= 85 ? 'text-green-600' : 'text-yellow-600'}`} />
                      <span className={`${proceso.rendimiento >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {proceso.rendimiento.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{proceso.formato}</td>
                  <td className="py-3 px-4 text-gray-600">{proceso.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {procesosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron procesos</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Rendimiento Promedio</p>
          <p className="text-gray-900">
            {(procesosData.reduce((sum, p) => sum + p.rendimiento, 0) / procesosData.length).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Procesado</p>
          <p className="text-gray-900">
            {procesosData.reduce((sum, p) => sum + p.kilosEntrada, 0).toLocaleString()} kg
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Merma</p>
          <p className="text-red-700">
            {procesosData.reduce((sum, p) => sum + p.merma, 0).toLocaleString()} kg
          </p>
        </div>
      </div>
    </div>
  );
}
