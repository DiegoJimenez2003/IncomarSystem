import { useEffect, useState, useMemo } from 'react';
import {
  PackageCheck,
  Ship,
  Factory,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Warehouse,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Boxes
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

interface AlertaAntiguedadLote {
  loteId: string;
  codigoLote: string;
  camaraNombre: string;
  dias: number;
  kilos: number;
  tipoPac: string;
  nivel: 'alerta' | 'urgente' | 'peligro';
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

// Helper seguro para obtener todas las filas de Supabase paginadamente
async function fetchAllRows(tableName: string, selectQuery: string) {
  let allRows: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.warn(`[Dashboard] Advertencia al consultar ${tableName}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

function contarLotesDistintos(items: any[]) {
  return new Set(items.map((i) => i.lotes?.codigo_lote || i.codigo_lote).filter(Boolean)).size;
}

function sumarKilos(items: any[]) {
  return items.reduce((sum, i) => sum + (Number(i.kilos) || 0), 0);
}

function sumarCajas(items: any[]) {
  return items.reduce((sum, i) => sum + (Number(i.cajas) || 0), 0);
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // Tablas de referencia
  const [, setEstadosProductoMap] = useState<Map<string, EstadoProductoInfo>>(new Map());
  const [, setEstadosEmbarqueMap] = useState<Map<string, EstadoEmbarqueInfo>>(new Map());

  // Datos de inventario crudos para cálculo consolidado (Racks + Cámaras)
  const [detalleRacks, setDetalleRacks] = useState<any[]>([]);
  const [detalleCamaras, setDetalleCamaras] = useState<any[]>([]);

  // Datos agregados generales
  const [totalLotes, setTotalLotes] = useState(0);
  const [lotesActivos, setLotesActivos] = useState(0);
  const [lotesPorEstado, setLotesPorEstado] = useState<{ nombre: string; color: string; count: number }[]>([]);

  const [distribucionPACData, setDistribucionPACData] = useState<{ name: string; value: number; color: string }[]>([]);

  // Datos agregados de Cámaras
  const [resumenCamaras, setResumenCamaras] = useState({
    lotesPAC: 0,
    lotesNoPAC: 0,
    kilosPAC: 0,
    kilosNoPAC: 0,
    cajasPAC: 0,
    cajasNoPAC: 0,
  });

  const [alertasCamaras, setAlertasCamaras] = useState<AlertaAntiguedadLote[]>([]);

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

    try {
      const [
        estadosProductoData,
        estadosEmbarqueData,
        lotesData,
        detalleLoteData,
        detalleCamaraData,
        embarquesData,
        calidadData,
        procesosData,
        movimientosRes
      ] = await Promise.all([
        fetchAllRows('estados_producto', 'id, nombre, color'),
        fetchAllRows('estados_embarque', 'id, nombre, color'),
        fetchAllRows('lotes', '*'),
        fetchAllRows('detalle_lote', 'id, kilos, cajas'),
        fetchAllRows('detalle_camara', `
          id,
          kilos,
          cajas,
          fecha_ingreso,
          camaras ( id, nombre, tipo ),
          lotes ( id, codigo_lote, especies ( nombre ) )
        `),
        fetchAllRows('embarques', '*'),
        fetchAllRows('control_calidad', '*'),
        fetchAllRows('procesamientos', '*'),
        supabase
          .from('movimientos')
          .select(`
            id,
            fecha,
            cantidad_kg,
            cantidad_cajas,
            tipos_movimiento ( nombre ),
            lotes ( codigo_lote, especies ( nombre ) ),
            racks ( codigo )
          `)
          .order('fecha', { ascending: false })
          .limit(5)
      ]);

      // Guardar datos brutos de inventario
      setDetalleRacks(detalleLoteData);
      setDetalleCamaras(detalleCamaraData);

      // ------------------------------------------------------------
      // 1. Mappings de Estados
      // ------------------------------------------------------------
      const estProdMap = new Map<string, EstadoProductoInfo>(
        estadosProductoData.map((e: any) => [e.id, { nombre: e.nombre, color: e.color }])
      );
      const estEmbMap = new Map<string, EstadoEmbarqueInfo>(
        estadosEmbarqueData.map((e: any) => [e.id, { nombre: e.nombre, color: e.color }])
      );
      setEstadosProductoMap(estProdMap);
      setEstadosEmbarqueMap(estEmbMap);

      // ------------------------------------------------------------
      // 2. Conteo de Lotes y Estados
      // ------------------------------------------------------------
      setTotalLotes(lotesData.length);

      const conteoPorEstado = new Map<string, number>();
      let activos = 0;

      lotesData.forEach((l: any) => {
        const estadoId = l.estado_producto_id;
        if (estadoId) {
          conteoPorEstado.set(estadoId, (conteoPorEstado.get(estadoId) || 0) + 1);
        }

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
      // 3. Procesamiento de Cámaras (Detalle Cámara)
      // ------------------------------------------------------------
      const pacItems = detalleCamaraData.filter((d: any) => d.camaras?.tipo === 'PAC');
      const noPacItems = detalleCamaraData.filter((d: any) => d.camaras?.tipo === 'NO_PAC');

      const kilosPAC = sumarKilos(pacItems);
      const kilosNoPAC = sumarKilos(noPacItems);
      const cajasPAC = sumarCajas(pacItems);
      const cajasNoPAC = sumarCajas(noPacItems);

      const lotesPACCount = contarLotesDistintos(pacItems);
      const lotesNoPACCount = contarLotesDistintos(noPacItems);

      setResumenCamaras({
        lotesPAC: lotesPACCount,
        lotesNoPAC: lotesNoPACCount,
        kilosPAC,
        kilosNoPAC,
        cajasPAC,
        cajasNoPAC,
      });

      // Gráfico PAC vs NO PAC
      setDistribucionPACData([
        { name: 'Cámara PAC', value: kilosPAC, color: '#2563eb' },
        { name: 'Cámara NO PAC', value: kilosNoPAC, color: '#06b6d4' },
      ]);

      // ------------------------------------------------------------
      // 4. Alertas de Antigüedad en Cámaras
      // ------------------------------------------------------------
      const ahora = Date.now();
      const listaAlertas: AlertaAntiguedadLote[] = [];

      detalleCamaraData.forEach((item: any) => {
        if (item.fecha_ingreso) {
          const inicio = new Date(item.fecha_ingreso).getTime();
          const dias = Math.floor((ahora - inicio) / (1000 * 60 * 60 * 24));

          if (dias >= 5) {
            let nivel: 'alerta' | 'urgente' | 'peligro' = 'alerta';
            if (dias >= 15) nivel = 'peligro';
            else if (dias >= 10) nivel = 'urgente';

            listaAlertas.push({
              loteId: item.id,
              codigoLote: item.lotes?.codigo_lote || 'Sin Código',
              camaraNombre: item.camaras?.nombre || (item.camaras?.tipo === 'PAC' ? 'Cámara PAC' : 'Cámara NO PAC'),
              dias,
              kilos: Number(item.kilos) || 0,
              tipoPac: item.camaras?.tipo || 'NO_PAC',
              nivel
            });
          }
        }
      });

      setAlertasCamaras(listaAlertas.sort((a, b) => b.dias - a.dias));

      // ------------------------------------------------------------
      // 5. Embarques, Calidad y Procesamiento
      // ------------------------------------------------------------
      setEmbarquesActivos(embarquesData.length);
      setCalidadPendiente(calidadData.length);

      const hoyStr = new Date().toISOString().split('T')[0];
      const procesadosHoy = procesosData.filter((p: any) => {
        const f = p.fecha_proceso || p.fecha || p.created_at;
        return f && String(f).startsWith(hoyStr);
      }).length;
      setProductosProcesadosHoy(procesadosHoy);

      const rendimientos = procesosData
        .filter((p: any) => Number(p.kilos_entrada) > 0)
        .map((p: any) => (Number(p.kilos_salida) / Number(p.kilos_entrada)) * 100);

      setRendimientoPromedio(
        rendimientos.length ? rendimientos.reduce((sum, r) => sum + r, 0) / rendimientos.length : 0
      );

      // ------------------------------------------------------------
      // 6. Movimientos Recientes
      // ------------------------------------------------------------
      if (movimientosRes.data) {
        setMovimientosRecientes(
          movimientosRes.data.map((m: any) => ({
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
      }

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // Cálculo Unificado del Inventario Total (useMemo)
  // ------------------------------------------------------------
  const { totalKilos, kilosRacks, kilosCamaras, totalCajas, cajasRacks, cajasCamaras } = useMemo(() => {
    const kRacks = sumarKilos(detalleRacks);
    const kCamaras = sumarKilos(detalleCamaras);

    const cRacks = sumarCajas(detalleRacks);
    const cCamaras = sumarCajas(detalleCamaras);

    return {
      totalKilos: kRacks + kCamaras,
      kilosRacks: kRacks,
      kilosCamaras: kCamaras,
      totalCajas: cRacks + cCamaras,
      cajasRacks: cRacks,
      cajasCamaras: cCamaras
    };
  }, [detalleRacks, detalleCamaras]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  function tipoBadgeClass(tipo: string) {
    const n = (tipo || '').toLowerCase();
    if (n.includes('entrada')) return 'bg-green-100 text-green-700';
    if (n.includes('salida')) return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 mb-2 font-bold text-2xl">Dashboard</h1>
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
        <h1 className="text-gray-900 mb-2 font-bold text-2xl">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema de trazabilidad</p>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <PackageCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Lotes Activos</p>
            <p className="text-gray-900 text-2xl font-bold">{lotesActivos}</p>
            <p className="text-xs text-gray-500 mt-1">de {totalLotes} totales</p>
          </div>
        </div>

        {/* Tarjeta con Total Consolidado (Racks + Cámaras) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Inventario Total en Stock</p>
            <p className="text-gray-900 text-2xl font-bold">{totalKilos.toLocaleString('es-CL')} kg</p>
            <p className="text-xs text-gray-500 mt-1">
              Racks: {kilosRacks.toLocaleString('es-CL')} kg · Cámaras: {kilosCamaras.toLocaleString('es-CL')} kg
            </p>
          </div>
        </div>

        {/* Tarjeta de Total Cajas Consolidado */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Boxes className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Total Cajas en Stock</p>
            <p className="text-gray-900 text-2xl font-bold">{totalCajas.toLocaleString('es-CL')}</p>
            <p className="text-xs text-gray-500 mt-1">
              Racks: {cajasRacks.toLocaleString('es-CL')} · Cámaras: {cajasCamaras.toLocaleString('es-CL')}
            </p>
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
            <p className="text-gray-900 text-2xl font-bold">{calidadPendiente}</p>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </div>
        </div>
      </div>

      {/* Bloque Informativo de Cámaras */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Warehouse className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-semibold text-lg">Distribución de Lotes en Cámaras</h2>
            <p className="text-xs text-gray-500">Resumen de stock en cámara PAC y cámara NO PAC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Cámara PAC</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {resumenCamaras.lotesPAC} <span className="text-sm font-normal text-blue-700">{resumenCamaras.lotesPAC === 1 ? 'lote' : 'lotes'}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                {resumenCamaras.kilosPAC.toLocaleString('es-CL')} kg
                {resumenCamaras.cajasPAC > 0 ? ` · ${resumenCamaras.cajasPAC.toLocaleString('es-CL')} cajas` : ''}
              </p>
            </div>
            <div className="p-3 bg-blue-200 text-blue-800 rounded-full font-bold text-lg">
              PAC
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Cámara NO PAC</p>
              <p className="text-2xl font-bold text-cyan-900 mt-1">
                {resumenCamaras.lotesNoPAC} <span className="text-sm font-normal text-cyan-700">{resumenCamaras.lotesNoPAC === 1 ? 'lote' : 'lotes'}</span>
              </p>
              <p className="text-xs text-cyan-600 mt-1 font-medium">
                {resumenCamaras.kilosNoPAC.toLocaleString('es-CL')} kg
                {resumenCamaras.cajasNoPAC > 0 ? ` · ${resumenCamaras.cajasNoPAC.toLocaleString('es-CL')} cajas` : ''}
              </p>
            </div>
            <div className="p-3 bg-cyan-200 text-cyan-800 rounded-full font-bold text-lg">
              NO PAC
            </div>
          </div>
        </div>
      </div>

      {/* Procesamiento y Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-gray-900 font-semibold">Procesamiento Hoy</h2>
          </div>
          <p className="text-gray-900 mb-2 font-medium">{productosProcesadosHoy} lotes procesados</p>
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
          <h2 className="text-gray-900 font-semibold mb-4">Distribución Inventario Total PAC vs NO PAC</h2>
          {distribucionPACData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribucionPACData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toLocaleString('es-CL')} kg`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionPACData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('es-CL')} kg`, 'Volumen']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Sin datos de inventario para mostrar</p>
          )}
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 font-semibold mb-4">Movimientos Recientes</h2>
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
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${tipoBadgeClass(movimiento.tipo)}`}>
                        {movimiento.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.loteCodigo}</td>
                    <td className="py-3 px-4 text-gray-600">{movimiento.productoNombre}</td>
                    <td className="py-3 px-4 text-gray-600">{movimiento.rackCodigo || '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.cajas ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{movimiento.kilos.toLocaleString('es-CL')} kg</td>
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

      {/* Lotes por Estado y Sección de Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-gray-900 font-semibold mb-4">Lotes por Estado</h2>
          {lotesPorEstado.length > 0 ? (
            <div className="space-y-3">
              {lotesPorEstado.map((estado) => {
                const percentage = totalLotes > 0 ? (estado.count / totalLotes) * 100 : 0;
                return (
                  <div key={estado.nombre}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{estado.nombre}</span>
                      <span className="text-sm text-gray-900 font-medium">{estado.count}</span>
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

        {/* Panel de Alertas por Antigüedad en Cámara */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900 font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Alertas de Antigüedad en Cámara
              </h2>
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                {alertasCamaras.length} en riesgo
              </span>
            </div>

            {alertasCamaras.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {alertasCamaras.map((alerta) => {
                  let badgeBg = 'bg-yellow-50 border-yellow-200 text-yellow-800';
                  let badgeIcon = <Clock className="w-4 h-4 text-yellow-600" />;
                  let labelTexto = 'Alerta';

                  if (alerta.nivel === 'urgente') {
                    badgeBg = 'bg-orange-50 border-orange-200 text-orange-800';
                    badgeIcon = <AlertTriangle className="w-4 h-4 text-orange-600" />;
                    labelTexto = 'Urgente';
                  } else if (alerta.nivel === 'peligro') {
                    badgeBg = 'bg-red-50 border-red-200 text-red-800';
                    badgeIcon = <ShieldAlert className="w-4 h-4 text-red-600" />;
                    labelTexto = 'Peligro';
                  }

                  return (
                    <div
                      key={`${alerta.loteId}-${alerta.camaraNombre}`}
                      className={`p-3 rounded-lg border flex items-center justify-between ${badgeBg}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{badgeIcon}</div>
                        <div>
                          <p className="text-sm font-semibold">
                            Lote {alerta.codigoLote} <span className="font-normal text-xs text-gray-600">({alerta.camaraNombre})</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {alerta.kilos.toLocaleString('es-CL')} kg | Cámara: {alerta.tipoPac}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-wider block">{labelTexto}</span>
                        <span className="text-sm font-bold">{alerta.dias} días</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <ClipboardCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">Sin alertas de permanencia</p>
                  <p className="text-xs text-gray-600 mt-0.5">Todos los lotes en cámara tienen menos de 5 días almacenados.</p>
                </div>
              </div>
            )}
          </div>

          {calidadPendiente > 0 && (
            <div className="mt-4 pt-3 border-t flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900 font-medium">{calidadPendiente} observaciones de calidad pendientes</p>
                <p className="text-xs text-gray-600">Requieren atención inmediata por parte del equipo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}