import { useState } from 'react';
import { Search, Package, Warehouse } from 'lucide-react';
import { inventarioData, racksData } from '../data/incomarData';

export function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRack, setFiltroRack] = useState<string>('todos');

  const inventarioFiltrado = inventarioData.filter((item) => {
    const matchesSearch =
      item.loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rackCodigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRack = filtroRack === 'todos' || item.rackId === filtroRack;

    return matchesSearch && matchesRack;
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const totalKilos = inventarioFiltrado.reduce((sum, item) => sum + item.kilos, 0);
  const totalCajas = inventarioFiltrado.reduce((sum, item) => sum + item.cajas, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Inventario</h1>
          <p className="text-gray-600">Stock actual en racks de almacenamiento (soporta movimientos parciales)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Kilos</p>
          <p className="text-gray-900">{totalKilos.toLocaleString()} kg</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Cajas</p>
          <p className="text-gray-900">{totalCajas}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Lotes en Stock</p>
          <p className="text-gray-900">{new Set(inventarioData.map(i => i.loteId)).size}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote, producto o rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroRack}
            onChange={(e) => setFiltroRack(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los racks</option>
            {racksData.map((rack) => (
              <option key={rack.id} value={rack.id}>
                {rack.codigo} - {rack.ubicacion}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-gray-700">Rack</th>
                <th className="text-left py-3 px-4 text-gray-700">Tipo Parte</th>
                <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {inventarioFiltrado.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{item.loteCodigo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{item.productoNombre}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-900">{item.rackCodigo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.tipoParte || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{item.cajas}</td>
                  <td className="py-3 px-4 text-gray-900">{item.kilos.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(item.fechaIngreso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inventarioFiltrado.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron items en inventario</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Inventario por Rack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {racksData.map((rack) => {
            const itemsEnRack = inventarioData.filter((i) => i.rackId === rack.id);
            const kilosEnRack = itemsEnRack.reduce((sum, i) => sum + i.kilos, 0);
            const cajasEnRack = itemsEnRack.reduce((sum, i) => sum + i.cajas, 0);

            return (
              <div key={rack.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="w-5 h-5 text-purple-600" />
                  <h3 className="text-gray-900">{rack.codigo}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cajas:</span>
                    <span className="text-gray-900">{cajasEnRack}/{rack.capacidadMaxima}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kilos:</span>
                    <span className="text-gray-900">{kilosEnRack.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lotes:</span>
                    <span className="text-gray-900">{new Set(itemsEnRack.map(i => i.loteId)).size}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
