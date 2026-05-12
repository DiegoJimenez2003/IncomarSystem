import { useState } from 'react';
import { Search, Plus, Building2, MapPin } from 'lucide-react';
import { plantasData } from '../data/incomarData';

export function PlantasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const plantasFiltradas = plantasData.filter((planta) =>
    planta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    planta.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Plantas</h1>
          <p className="text-gray-600">Centros de procesamiento</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nueva Planta
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar planta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plantasFiltradas.map((planta) => (
            <div key={planta.id} className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">{planta.nombre}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{planta.ubicacion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      planta.tipo === 'PAC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {planta.tipo}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      planta.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {planta.activa ? 'Activa' : 'Inactiva'}
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
