import { useState } from 'react';
import { Search, Plus, Fish } from 'lucide-react';
import { productosData } from '../data/incomarData';

export function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const productosFiltrados = productosData.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Productos</h1>
          <p className="text-gray-600">Catálogo de productos pesqueros</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Fish className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-gray-900">{producto.nombre}</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="text-gray-900 capitalize">{producto.tipo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Exportable:</span>
                  <span className={producto.exportable ? 'text-green-700' : 'text-gray-700'}>
                    {producto.exportable ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      producto.tipoPac === 'PAC'
                        ? 'bg-blue-100 text-blue-700'
                        : producto.tipoPac === 'NO_PAC'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {producto.tipoPac === 'AMBOS' ? 'PAC / NO PAC' : producto.tipoPac}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
