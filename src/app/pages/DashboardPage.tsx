import { useEffect, useState } from 'react';
import {
  PackageCheck,
  Ship,
  Factory,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../../utils/supabase';

// ==========================================================================
// Tipos
// ==========================================================================

interface MovimientoReciente {
  id: string;
  tipo: string;
  loteCodigo: string;
  productoNombre: string;
  rackCodigo: string | null;
  cajas: number | null;
  kilos: number;
  fecha: string;
}

interface EstadoProductoInfo {
  nombre: string;
  color: string;
}

interface EstadoEmbarqueInfo {
  nombre: string;
  color: string;
}

// ==========================================================================
// Utilidades
// ==========================================================================

const colorBg: Record<string, string> = {
  gray: 'bg-gray-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-600',
  red: 'bg-red-600',
  purple: 'bg-purple-600',
  indigo: 'bg-indigo-600',
  orange: 'bg-orange-600',
};

function barColor(color?: string) {
  return colorBg[color || 'gray'] || colorBg.gray;
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // Tablas de referencia
  const [estadosProductoMap, setEstadosProductoMap] = useState<Map<string, EstadoProductoInfo>>(new Map());
  const [estadosEmbarqueMap, setEstadosEmbarqueMap] = useState<Map<string, EstadoEmbarqueInfo>>(new Map());

  // Datos agregados
  const [totalLotes, setTotalLotes] = useState(0);
  const [lotesActivos, setLotesActivos] = useState(0);
  const [lotesPorEstado, setLotesPorEstado] = useState<{ nombre: string; color: string; count: number }[]>([]);

  const [totalKilosInventario, setTotalKilosInventario] = useState(0);
  const [totalCajasInventario, setTotalCajasInventario] = useState(0);
  const [distribucionPACData, setDistribucionPACData] = useState<{ name: string; value: number; color: string }[]>([]);

  const [embarquesActivos, setEmbarquesActivos] = useState(0);
  const [calidadPendiente, setCalidadPendiente] = useState(0);

  const [productosProcesadosHoy, setProductosProcesadosHoy] = useState(0);
  const [rendimientoPromedio, setRendimientoPromedio] = useState(0);

  const [movimientosRecientes, setMovimientosRecientes] = useState<MovimientoReciente[]>([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    setLoading(true);

    const [
      estadosProductoRes,
      estadosEmbarqueRes,
      lotesRes,
      detalleLoteRes,
      productosRes,
      embarquesRes,
      calidadRes,
      procesosRes,
      movimientosRes,
    ] = await Promise.all([
      supabase.from('estados_producto').select('id, nombre, color'),
      supabase.from('estados_embarque').select('id, nombre, color'),
      supabase.from('lotes').select('id, estado_producto_id'),
      supabase.from('detalle_lote').select('lote_id, kilos, cajas, lotes(especie_id)'),
      supabase.from('productos').select('especie_id, tipo_pac'),
      supabase.from('embarques').select('id, estado_embarque_id'),
      supabase.from('control_calidad').select('id, estado_producto_id'),
      supabase.from('procesamientos').select('id, fecha_proceso, kilos_entrada, kilos_salida'),
      supabase
        .from('movimientos')
        .select(
          `
          id,
          fecha,
          cantidad_kg,
          cantidad_cajas,
          tipos_movimiento ( nombre ),
          lotes ( codigo_lote, especies ( nombre ) ),
          racks ( codigo )
        `
        )
        .order('fecha', { ascending: false })
        .limit(5),
    ]);

    // ------------------------------------------------------------
    // Tablas de referencia
    // ------------------------------------------------------------
    const estProdMap = new Map<string, EstadoProductoInfo>(
      (estadosProductoRes.data || []).map((e: any) => [e.id, { nombre: e.nombre, color: e.color }])
    );
    const estEmbMap = new Map<string, EstadoEmbarqueInfo>(
      (estadosEmbarqueRes.data || []).map((e: any) => [e.id, { nombre: e.nombre, color: e.color }])
    );
    setEstadosProductoMap(estProdMap);
    setEstadosEmbarqueMap(estEmbMap);

    // ------------------------------------------------------------
    // Lotes por estado + total + activos
    // AJUSTAR: "activo" se define acá como cualquier estado que NO
    // contenga las palabras "despach" o "cerrad" (es decir, lotes que
    // aún están en el flujo interno). Cambiar el filtro si tus nombres
    // de estados_producto son distintos.
    // ------------------------------------------------------------
    const lotes = lotesRes.data || [];
    setTotalLotes(lotes.length);

    const conteoPorEstado = new Map<string, number>();
    let activos = 0;
    lotes.forEach((l: any) => {
      const estadoId = l.estado_producto_id;
      conteoPorEstado.set(estadoId, (conteoPorEstado.get(estadoId) || 0) + 1);

      const nombreEstado = estadoId ? estProdMap.get(estadoId)?.nombre?.toLowerCase() || '' : '';
      if (!nombreEstado.includes('despach') && !nombreEstado.includes('cerrad')) {
        activos += 1;
      }
    });
    setLotesActivos(activos);

    const distribucionEstados = Array.from(estProdMap.entries()).map(([id, info]) => ({
      nombre: info.nombre,
      color: info.color,
      count: conteoPorEstado.get(id) || 0,
    }));
    setLotesPorEstado(distribucionEstados);

    // ------------------------------------------------------------
    // Inventario total + distribución PAC / NO PAC
    // El tipo PAC / NO_PAC / AMBOS es un atributo del producto
    // (tabla `productos`, ligada a `especies`), no del rack. Un lote
    // "AMBOS" se cuenta en las dos categorías porque puede terminar
    // exportado o vendido localmente indistintamente.
    // ------------------------------------------------------------
    const detalleLote = (detalleLoteRes.data || []) as any[];
    const kilosTotal = detalleLote.reduce((sum, d) => sum + (Number(d.kilos) || 0), 0);
    const cajasTotal = detalleLote.reduce((sum, d) => sum + (Number(d.cajas) || 0), 0);
    setTotalKilosInventario(kilosTotal);
    setTotalCajasInventario(cajasTotal);

    const tipoPacPorEspecie = new Map<string, string>(
      (productosRes.data || []).map((p: any) => [p.especie_id, p.tipo_pac])
    );

    let kilosPAC = 0;
    let kilosNoPAC = 0;
    detalleLote.forEach((d) => {
      const especieId = d.lotes?.especie_id;
      const tipoPac = especieId ? tipoPacPorEspecie.get(especieId) : undefined;
      const kilos = Number(d.kilos) || 0;

      if (tipoPac === 'PAC' || tipoPac === 'AMBOS') kilosPAC += kilos;
      if (tipoPac === 'NO_PAC' || tipoPac === 'AMBOS') kilosNoPAC += kilos;
    });

    setDistribucionPACData([
      { name: 'PAC (Exportación)', value: kilosPAC, color: '#3b82f6' },
      { name: 'NO PAC (Nacional)', value: kilosNoPAC, color: '#10b981' },
    ]);

    // ------------------------------------------------------------
    // Embarques activos
    // AJUSTAR: cuenta embarques cuyo estado contiene "despach" o
    // "transit". Cambiar según los nombres reales en estados_embarque.
    // ------------------------------------------------------------
    const embarques = embarquesRes.data || [];
    const activosEmbarque = embarques.filter((e: any) => {
      const nombre = e.estado_embarque_id ? estEmbMap.get(e.estado_embarque_id)?.nombre?.toLowerCase() || '' : '';
      return nombre.includes('despach') || nombre.includes('transit');
    }).length;
    setEmbarquesActivos(activosEmbarque);

    // ------------------------------------------------------------
    // Calidad pendiente
    // AJUSTAR: cuenta controles cuyo estado de producto asociado
    // contiene "observ" o "rechaz".
    // ------------------------------------------------------------
    const calidad = calidadRes.data || [];
    const pendientes = calidad.filter((c: any) => {
      const nombre = c.estado_producto_id ? estProdMap.get(c.estado_producto_id)?.nombre?.toLowerCase() || '' : '';
      return nombre.includes('observ') || nombre.includes('rechaz');
    }).length;
    setCalidadPendiente(pendientes);

    // ------------------------------------------------------------
    // Procesamiento de hoy + rendimiento promedio
    // ------------------------------------------------------------
    const procesos = procesosRes.data || [];
    const hoy = new Date();
    const procesadosHoy = procesos.filter((p: any) => {
      if (!p.fecha_proceso) return false;
      return new Date(p.fecha_proceso).toDateString() === hoy.toDateString();
    }).length;
    setProductosProcesadosHoy(procesadosHoy);

    const rendimientos = procesos
      .filter((p: any) => p.kilos_entrada)
      .map((p: any) => (Number(p.kilos_salida) / Number(p.kilos_entrada)) * 100);
    const rendimientoProm = rendimientos.length
      ? rendimientos.reduce((sum, r) => sum + r, 0) / rendimientos.length
      : 0;
    setRendimientoPromedio(rendimientoProm);

    // ------------------------------------------------------------
    // Movimientos recientes
    // ------------------------------------------------------------
    const movimientos = (movimientosRes.data || []) as any[];
    setMovimientosRecientes(
      movimientos.map((m) => ({
        id: m.id,
        tipo: m.tipos_movimiento?.nombre || 'Movimiento',
        loteCodigo: m.lotes?.codigo_lote || '-',
        productoNombre: m.lotes?.especies?.nombre || '-',
        rackCodigo: m.racks?.codigo || null,
        cajas: m.cantidad_cajas,
        kilos: Number(m.cantidad_kg) || 0,
        fecha: m.fecha,
      }))
    );

    setLoading(false);
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  function tipoBadgeClass(tipo: string) {
    const n = tipo.toLowerCase();
    if (n.includes('entrada')) return 'bg-green-100 text-green-700';
    if (n.includes('salida')) return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen general del sistema de trazabilidad</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

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
          </div>
          <div>
            <p className="text-gray-600 mb-1">Lotes Activos</p>
            <p className="text-gray-900">{lotesActivos}</p>
            <p className="text-xs text-gray-500 mt-1">de {totalLotes} totales</p>
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
            <p className="text-xs text-gray-500 mt-1">{totalCajasInventario.toLocaleString()} cajas</p>
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
            <p className="text-gray-900">{embarquesActivos}</p>
            <p className="text-xs text-gray-500 mt-1">En tránsito o despachados</p>
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
          {distribucionPACData.some((d) => d.value > 0) ? (
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
          ) : (
            <p className="text-gray-500 text-center py-12">Sin datos de inventario para mostrar</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Movimientos Recientes</h2>
        {movimientosRecientes.length > 0 ? (
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
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${tipoBadgeClass(movimiento.tipo)}`}>
                        {movimiento.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.loteCodigo}</td>
                    <td className="py-3 px-4 text-gray-600">{movimiento.productoNombre}</td>
                    <td className="py-3 px-4 text-gray-600">{movimiento.rackCodigo || '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.cajas ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.kilos.toLocaleString()} kg</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(movimiento.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Sin movimientos registrados todavía</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 mb-4">Lotes por Estado</h2>
          {lotesPorEstado.length > 0 ? (
            <div className="space-y-3">
              {lotesPorEstado.map((estado) => {
                const percentage = totalLotes > 0 ? (estado.count / totalLotes) * 100 : 0;
                return (
                  <div key={estado.nombre}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{estado.nombre}</span>
                      <span className="text-sm text-gray-900">{estado.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${barColor(estado.color)}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Sin estados de producto registrados</p>
          )}
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