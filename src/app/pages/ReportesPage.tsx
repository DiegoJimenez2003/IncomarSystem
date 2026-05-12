import { FileText, Download, Calendar } from 'lucide-react';
import {
  lotesData,
  inventarioData,
  movimientosData,
  procesosData,
} from '../data/incomarData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ReportesPage() {
  const generateReport = (tipo: string) => {
    alert(`Reporte ${tipo} generado. En una implementación real, esto generaría un PDF.`);
  };

  const totalEntradas = movimientosData
    .filter((m) => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.kilos, 0);

  const totalSalidas = movimientosData
    .filter((m) => m.tipo === 'salida')
    .reduce((sum, m) => sum + m.kilos, 0);

  const totalInventario = inventarioData.reduce((sum, item) => sum + item.kilos, 0);

  const inventarioPAC = inventarioData
    .filter((i) => i.rackCodigo.includes('PAC'))
    .reduce((sum, i) => sum + i.kilos, 0);

  const inventarioNOPAC = inventarioData
    .filter((i) => i.rackCodigo.includes('NOPAC'))
    .reduce((sum, i) => sum + i.kilos, 0);

  const lotesPorEstado = lotesData.reduce((acc, lote) => {
    if (!acc[lote.estado]) {
      acc[lote.estado] = 0;
    }
    acc[lote.estado]++;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(lotesPorEstado).map(([estado, cantidad]) => ({
    estado: estado.charAt(0).toUpperCase() + estado.slice(1),
    cantidad,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Reportes</h1>
        <p className="text-gray-600">Generación y análisis de informes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Inventario General</h3>
              <p className="text-xs text-gray-600">Stock actual por lotes y racks</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('Inventario')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Trazabilidad por Lote</h3>
              <p className="text-xs text-gray-600">Historial completo de lotes</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('Trazabilidad')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Movimientos</h3>
              <p className="text-xs text-gray-600">Entradas, salidas y transferencias</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('Movimientos')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-gray-900">PAC / NO PAC</h3>
              <p className="text-xs text-gray-600">Separación por tipo de mercado</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('PAC/NO PAC')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Procesamiento</h3>
              <p className="text-xs text-gray-600">Rendimientos y merma</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('Procesamiento')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Control de Calidad</h3>
              <p className="text-xs text-gray-600">Inspecciones y observaciones</p>
            </div>
          </div>
          <button
            onClick={() => generateReport('Calidad')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Generar PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Estadísticas del Período</h2>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Últimos 7 días</option>
              <option>Último mes</option>
              <option>Últimos 3 meses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-gray-700 mb-2">Total Entradas</p>
            <p className="text-green-700">{totalEntradas.toLocaleString()} kg</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
            <p className="text-gray-700 mb-2">Total Salidas</p>
            <p className="text-red-700">{totalSalidas.toLocaleString()} kg</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <p className="text-gray-700 mb-2">Inventario Total</p>
            <p className="text-blue-700">{totalInventario.toLocaleString()} kg</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <p className="text-gray-700 mb-2">Lotes Activos</p>
            <p className="text-purple-700">{lotesData.filter(l => l.estado === 'activo' || l.estado === 'procesando').length}</p>
          </div>
        </div>

        <div>
          <h3 className="text-gray-900 mb-4">Lotes por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="estado" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad de Lotes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Distribución PAC / NO PAC</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">PAC (Exportación)</span>
                <span className="text-blue-700">{inventarioPAC.toLocaleString()} kg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(inventarioPAC / totalInventario) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">NO PAC (Nacional)</span>
                <span className="text-green-700">{inventarioNOPAC.toLocaleString()} kg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(inventarioNOPAC / totalInventario) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Rendimiento Procesamiento</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Rendimiento Promedio</span>
                <span className="text-green-700">
                  {(procesosData.reduce((sum, p) => sum + p.rendimiento, 0) / procesosData.length).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{
                    width: `${procesosData.reduce((sum, p) => sum + p.rendimiento, 0) / procesosData.length}%`,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Procesado</p>
                <p className="text-green-700">
                  {procesosData.reduce((sum, p) => sum + p.kilosEntrada, 0).toLocaleString()} kg
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Merma</p>
                <p className="text-red-700">
                  {procesosData.reduce((sum, p) => sum + p.merma, 0).toLocaleString()} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
