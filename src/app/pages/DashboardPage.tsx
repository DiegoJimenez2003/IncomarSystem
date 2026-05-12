import {
  PackageCheck,
  Ship,
  Factory,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  lotesData,
  inventarioData,
  embarquesData,
  calidadData,
  procesosData,
  movimientosData,
} from '../data/incomarData';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function DashboardPage() {
  const lotesActivos = lotesData.filter(
    (l) => l.estado === 'activo' || l.estado === 'procesando'
  ).length;

  const totalKilosInventario = inventarioData.reduce((sum, item) => sum + item.kilos, 0);
  const totalCajasInventario = inventarioData.reduce((sum, item) => sum + item.cajas, 0);

  const embarquesRecientes = embarquesData.filter(
    (e) => e.estado === 'despachado' || e.estado === 'en_transito'
  ).length;

  const calidadPendiente = calidadData.filter((c) => c.estado === 'observado').length;

  const productosProcesadosHoy = procesosData.filter((p) => {
    const fecha = new Date(p.fecha);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }).length;

  const rendimientoPromedio =
    procesosData.reduce((sum, p) => sum + p.rendimiento, 0) / procesosData.length || 0;

  const distribucionPACData = [
    {
      name: 'PAC (Exportación)',
      value: inventarioData.filter((i) =>
        i.rackCodigo.includes('PAC')
      ).reduce((sum, i) => sum + i.kilos, 0),
      color: '#3b82f6',
    },
    {
      name: 'NO PAC (Nacional)',
      value: inventarioData.filter((i) =>
        i.rackCodigo.includes('NOPAC')
      ).reduce((sum, i) => sum + i.kilos, 0),
      color: '#10b981',
    },
  ];

  const movimientosRecientes = movimientosData
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema de trazabilidad</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <PackageCheck className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-blue-600">↑</span>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Lotes Activos</p>
            <p className="text-gray-900">{lotesActivos}</p>
            <p className="text-xs text-gray-500 mt-1">En proceso</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Inventario Total</p>
            <p className="text-gray-900">{totalKilosInventario.toLocaleString()} kg</p>
            <p className="text-xs text-gray-500 mt-1">{totalCajasInventario} cajas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Ship className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Embarques Activos</p>
            <p className="text-gray-900">{embarquesRecientes}</p>
            <p className="text-xs text-gray-500 mt-1">En tránsito</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${calidadPendiente > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <ClipboardCheck className={`w-6 h-6 ${calidadPendiente > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            {calidadPendiente > 0 && <AlertCircle className="w-5 h-5 text-red-500" />}
          </div>
          <div>
            <p className="text-gray-600 mb-1">Observaciones Calidad</p>
            <p className="text-gray-900">{calidadPendiente}</p>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-gray-900">Procesamiento Hoy</h2>
          </div>
          <p className="text-gray-900 mb-2">{productosProcesadosHoy} lotes procesados</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(rendimientoPromedio, 100)}%` }}
              />
            </div>
            <span>{rendimientoPromedio.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Rendimiento promedio</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Distribución PAC / NO PAC</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={distribucionPACData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toLocaleString()} kg`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {distribucionPACData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Movimientos Recientes</h2>
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
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientosRecientes.map((movimiento) => (
                <tr key={movimiento.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${
                        movimiento.tipo === 'entrada'
                          ? 'bg-green-100 text-green-700'
                          : movimiento.tipo === 'salida'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.loteCodigo}</td>
                  <td className="py-3 px-4 text-gray-600">{movimiento.productoNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{movimiento.rackCodigo || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.cajas}</td>
                  <td className="py-3 px-4 text-gray-900">{movimiento.kilos} kg</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(movimiento.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Lotes por Estado</h2>
          <div className="space-y-3">
            {['activo', 'procesando', 'procesado', 'despachado'].map((estado) => {
              const count = lotesData.filter((l) => l.estado === estado).length;
              const percentage = (count / lotesData.length) * 100;
              return (
                <div key={estado}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 capitalize">{estado}</span>
                    <span className="text-sm text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        estado === 'activo'
                          ? 'bg-blue-600'
                          : estado === 'procesando'
                          ? 'bg-yellow-600'
                          : estado === 'procesado'
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Alertas y Notificaciones</h2>
          <div className="space-y-3">
            {calidadPendiente > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">{calidadPendiente} observaciones de calidad pendientes</p>
                  <p className="text-xs text-gray-600 mt-1">Requieren atención inmediata</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <ClipboardCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">Sistema operando correctamente</p>
                <p className="text-xs text-gray-600 mt-1">Todos los procesos funcionando normalmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
