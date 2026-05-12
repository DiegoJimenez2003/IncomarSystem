import { useState } from 'react';
import { Search, Plus, ClipboardCheck, CheckCircle, XCircle, AlertCircle, Tag } from 'lucide-react';
import { calidadData, estadosProductoData, lotesData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function CalidadPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const calidadFiltrada = calidadData.filter((control) => {
    const matchesSearch =
      control.loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filtroEstado === 'todos' || control.estado === filtroEstado;

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

  const getEstadoIcon = (estado: string) => {
    if (estado === 'aprobado') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (estado === 'rechazado') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      aprobado: 'bg-green-100 text-green-700',
      rechazado: 'bg-red-100 text-red-700',
      observado: 'bg-yellow-100 text-yellow-700',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const canRegister = user?.rol === 'administrador' || user?.rol === 'calidad';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Control de Calidad</h1>
          <p className="text-gray-600">Inspecciones y validaciones de producto</p>
        </div>

        {canRegister && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Control
          </button>
        )}
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

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="aprobado">Aprobado</option>
            <option value="observado">Observado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>

        <div className="space-y-4">
          {calidadFiltrada.map((control) => (
            <div
              key={control.id}
              className={`p-5 rounded-xl border-2 ${
                control.estado === 'rechazado'
                  ? 'border-red-200 bg-red-50'
                  : control.estado === 'observado'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getEstadoIcon(control.estado)}
                  <div>
                    <h3 className="text-gray-900">Lote {control.loteCodigo} - {control.productoNombre}</h3>
                    <p className="text-sm text-gray-600">{formatDate(control.fecha)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(control.estado)}`}>
                  {control.estado.charAt(0).toUpperCase() + control.estado.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Inspector</p>
                  <p className="text-sm text-gray-900">{control.inspector}</p>
                </div>
                {control.temperatura && (
                  <div>
                    <p className="text-xs text-gray-600">Temperatura</p>
                    <p className="text-sm text-gray-900">{control.temperatura}°C</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Aspecto</p>
                  <p className="text-sm text-gray-900">{control.aspecto}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Olor</p>
                  <p className="text-sm text-gray-900">{control.olor}</p>
                </div>
              </div>

              {control.observaciones && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-900">{control.observaciones}</p>
                </div>
              )}

              {control.incidencias && (
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-xs text-red-700 mb-1">Incidencias:</p>
                  <p className="text-sm text-red-900">{control.incidencias}</p>
                </div>
              )}

              {(() => {
                const lote = lotesData.find(l => l.id === control.loteId);
                const estadoProducto = lote?.estadoProductoId ? estadosProductoData.find(e => e.id === lote.estadoProductoId) : null;

                if (estadoProducto) {
                  const getColorClass = (color: string) => {
                    const colors = {
                      red: 'bg-red-100 text-red-700 border-red-200',
                      green: 'bg-green-100 text-green-700 border-green-200',
                      blue: 'bg-blue-100 text-blue-700 border-blue-200',
                      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                      gray: 'bg-gray-100 text-gray-700 border-gray-200',
                    };
                    return colors[color as keyof typeof colors] || colors.gray;
                  };

                  return (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Estado Producto:</span>
                      <span className={`px-2 py-1 rounded text-xs border ${getColorClass(estadoProducto.color)}`}>
                        {estadoProducto.nombre}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ))}
        </div>

        {calidadFiltrada.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron controles</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Aprobados</p>
          <p className="text-green-700">{calidadData.filter((c) => c.estado === 'aprobado').length}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Con Observaciones</p>
          <p className="text-yellow-700">{calidadData.filter((c) => c.estado === 'observado').length}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-100">
          <p className="text-gray-700 mb-2">Rechazados</p>
          <p className="text-red-700">{calidadData.filter((c) => c.estado === 'rechazado').length}</p>
        </div>
      </div>
    </div>
  );
}
