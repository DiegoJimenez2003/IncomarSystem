import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Search, Filter, Info } from 'lucide-react';
import { movimientosData } from '../data/incomarData';

export function MovimientosPage() {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const movimientosFiltrados = movimientosData
    .filter((m) => {
      const matchesTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      const matchesSearch =
        m.loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTipo && matchesSearch;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'entrada') return <ArrowDownCircle className="w-5 h-5" />;
    if (tipo === 'salida') return <ArrowUpCircle className="w-5 h-5" />;
    return <ArrowLeftRight className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Movimientos</h1>
          <p className="text-gray-600">Historial de entradas, salidas y transferencias (soporte para movimientos parciales)</p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>Movimientos Parciales:</strong> El sistema permite salidas parciales de racks. Por ejemplo, de un rack con 98 cajas se pueden retirar 10, 20 o cualquier cantidad sin necesidad de vaciar el rack completo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownCircle className="w-6 h-6 text-green-600" />
            <p className="text-gray-700">Entradas</p>
          </div>
          <p className="text-green-700">
            {movimientosData.filter((m) => m.tipo === 'entrada').reduce((sum, m) => sum + m.kilos, 0).toLocaleString()} kg
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="w-6 h-6 text-red-600" />
            <p className="text-gray-700">Salidas</p>
          </div>
          <p className="text-red-700">
            {movimientosData.filter((m) => m.tipo === 'salida').reduce((sum, m) => sum + m.kilos, 0).toLocaleString()} kg
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            <p className="text-gray-700">Total Movimientos</p>
          </div>
          <p className="text-blue-700">{movimientosData.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="transferencia">Transferencias</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-gray-700">Rack</th>
                <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Responsable</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((movimiento) => (
                <tr key={movimiento.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div
                      className={`flex items-center gap-2 ${
                        movimiento.tipo === 'entrada'
                          ? 'text-green-600'
                          : movimiento.tipo === 'salida'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {getTipoIcon(movimiento.tipo)}
                      <span className="capitalize">{movimiento.tipo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.loteCodigo}</td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.productoNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{movimiento.rackCodigo || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.cajas}</td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.kilos.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{movimiento.responsable}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(movimiento.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movimientosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron movimientos</p>
          </div>
        )}
      </div>
    </div>
  );
}
