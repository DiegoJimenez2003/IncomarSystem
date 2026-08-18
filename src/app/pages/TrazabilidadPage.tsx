import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Route,
  PackageCheck,
  FileSignature,
  Factory,
  ClipboardCheck,
  Ship,
  Package,
  ArrowRight,
  MapPin,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Truck,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import type { JSX } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIncomar from '../../assets/logo_sin_nombre.png';
import { FileDown } from 'lucide-react'; // sumar a los imports de lucide-react ya existentes

// ==========================================================================
// Tipos
// ==========================================================================

interface LoteResultado {
  id: string;
  codigo_lote: string;
  especie_id: string | null;
  fecha_produccion: string | null;
}

interface LoteDetalle {
  id: string;
  codigo_lote: string;
  especie_id: string | null;
  planta_id: string | null;
  turno_id: string | null;
  estado_producto_id: string | null;
  fecha_produccion: string | null;
  fecha_vencimiento: string | null;
  kilos_netos: number | null;
  cantidad_cajas: number | null;
  temperatura: number | null;
  observaciones: string | null;
}

interface GuiaRow {
  id: string;
  numero_guia: string;
  lote_origen: string;
  barco: string;
  origen: string;
  destino: string;
  kilos: number;
  fecha_guia: string;
}

interface ProcesoRow {
  id: string;
  fecha_proceso: string;
  kilos_entrada: number;
  kilos_salida: number;
  observaciones: string | null;
}

interface CalidadRow {
  id: string;
  fecha: string;
  temperatura: number | null;
  observacion: string | null;
  usuario_id: string | null;
  estado_producto_id: string | null;
}

interface InventarioRow {
  id: string;
  rack_id: string | null;
  kilos: number;
  cajas: number | null;
  fecha_ingreso: string;
}

interface MovimientoRow {
  id: string;
  tipo_movimiento_id: string | null;
  rack_id: string | null;
  usuario_id: string | null;
  cantidad_kg: number;
  cantidad_cajas: number | null;
  descripcion: string | null;
  fecha: string;
}

interface EmbarqueRow {
  id: string;
  codigo_embarque: string;
  cliente: string | null;
  destino: string | null;
  transporte: string | null;
  fecha_embarque: string | null;
  observaciones: string | null;
  estado_embarque_id: string | null;
  creado_por: string | null;
  kilos: number;
  cajas: number | null;
}

interface TimelineEvent {
  id: string;
  fecha: string | null;
  kind: 'entrada' | 'salida' | 'movimiento' | 'asignacion' | 'calidad' | 'embarque';
  titulo: string;
  lineas: string[];
}

// ==========================================================================
// Utilidades
// ==========================================================================

const badgeColorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  orange: 'bg-orange-100 text-orange-700',
};

function badgeClass(color?: string | null) {
  return badgeColorClasses[color || 'gray'] || badgeColorClasses.gray;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return '-';
  }
}

// Formatea kg/cajas sin mostrar "0 cajas" cuando cajas es null
function formatCantidad(kg: number | null | undefined, cajas: number | null | undefined) {
  const kgTxt = `${(kg ?? 0).toLocaleString()} kg`;
  if (cajas === null || cajas === undefined) return kgTxt;
  return `${kgTxt}, ${cajas.toLocaleString()} cajas`;
}

function estadoCalidadCardClass(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes('aprob') || n.includes('liber')) return 'bg-green-50';
  if (n.includes('rechaz') || n.includes('bloque')) return 'bg-red-50';
  return 'bg-yellow-50';
}

function tipoMovimientoBadge(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes('entrada')) return 'bg-green-100 text-green-700';
  if (n.includes('salida')) return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
}

const timelineStyles: Record<TimelineEvent['kind'], { dot: string; icon: JSX.Element }> = {
  entrada: { dot: 'bg-green-500', icon: <ArrowDownCircle className="w-4 h-4 text-white" /> },
  salida: { dot: 'bg-red-500', icon: <ArrowUpCircle className="w-4 h-4 text-white" /> },
  movimiento: { dot: 'bg-blue-500', icon: <Package className="w-4 h-4 text-white" /> },
  asignacion: { dot: 'bg-yellow-500', icon: <Boxes className="w-4 h-4 text-white" /> },
  calidad: { dot: 'bg-purple-500', icon: <ClipboardCheck className="w-4 h-4 text-white" /> },
  embarque: { dot: 'bg-indigo-500', icon: <Truck className="w-4 h-4 text-white" /> },
};

// ==========================================================================
// Componente
// ==========================================================================

export function TrazabilidadPage() {
  // Búsqueda
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<LoteResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loteSeleccionado, setLoteSeleccionado] = useState<string | null>(null);

  // Tablas de referencia (dimensión, se cargan una sola vez)
  const [especiesMap, setEspeciesMap] = useState<Map<string, string>>(new Map());
  const [plantasMap, setPlantasMap] = useState<Map<string, string>>(new Map());
  const [estadosProductoMap, setEstadosProductoMap] = useState<Map<string, { nombre: string; color: string }>>(new Map());
  const [estadosEmbarqueMap, setEstadosEmbarqueMap] = useState<Map<string, { nombre: string; color: string }>>(new Map());
  const [tiposMovimientoMap, setTiposMovimientoMap] = useState<Map<string, string>>(new Map());
  const [racksMap, setRacksMap] = useState<Map<string, { codigo: string; ubicacion: string | null }>>(new Map());
  const [usuariosMap, setUsuariosMap] = useState<Map<string, string>>(new Map());
  const [refLoaded, setRefLoaded] = useState(false);
  const [erroresRef, setErroresRef] = useState<string[]>([]);

  // Detalle del lote elegido
  const [lote, setLote] = useState<LoteDetalle | null>(null);
  const [guiasLote, setGuiasLote] = useState<GuiaRow[]>([]);
  const [procesosLote, setProcesosLote] = useState<ProcesoRow[]>([]);
  const [calidadLote, setCalidadLote] = useState<CalidadRow[]>([]);
  const [inventarioLote, setInventarioLote] = useState<InventarioRow[]>([]);
  const [movimientosLote, setMovimientosLote] = useState<MovimientoRow[]>([]);
  const [embarquesLote, setEmbarquesLote] = useState<EmbarqueRow[]>([]);

  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([]);

  // ------------------------------------------------------------------
  // Carga de tablas de referencia (una sola vez)
  // ------------------------------------------------------------------
  useEffect(() => {
    async function cargarReferencia() {
      const errores: string[] = [];
      try {
        const [
          especiesRes,
          plantasRes,
          estadosProductoRes,
          estadosEmbarqueRes,
          tiposMovimientoRes,
          racksRes,
          usuariosRes,
        ] = await Promise.all([
          supabase.from('especies').select('id, nombre'),
          supabase.from('plantas').select('id, nombre'),
          supabase.from('estados_producto').select('id, nombre, color'),
          supabase.from('estados_embarque').select('id, nombre, color'),
          supabase.from('tipos_movimiento').select('id, nombre'),
          supabase.from('racks').select('id, codigo, ubicacion'),
          supabase.from('usuarios').select('id, nombre'),
        ]);

        if (especiesRes.error) errores.push(`especies: ${especiesRes.error.message}`);
        if (plantasRes.error) errores.push(`plantas: ${plantasRes.error.message}`);
        if (estadosProductoRes.error) errores.push(`estados_producto: ${estadosProductoRes.error.message}`);
        if (estadosEmbarqueRes.error) errores.push(`estados_embarque: ${estadosEmbarqueRes.error.message}`);
        if (tiposMovimientoRes.error) errores.push(`tipos_movimiento: ${tiposMovimientoRes.error.message}`);
        if (racksRes.error) errores.push(`racks: ${racksRes.error.message}`);
        if (usuariosRes.error) errores.push(`usuarios: ${usuariosRes.error.message}`);

        setEspeciesMap(new Map((especiesRes.data || []).map((e: any) => [e.id, e.nombre])));
        setPlantasMap(new Map((plantasRes.data || []).map((p: any) => [p.id, p.nombre])));
        setEstadosProductoMap(
          new Map((estadosProductoRes.data || []).map((e: any) => [e.id, { nombre: e.nombre, color: e.color }]))
        );
        setEstadosEmbarqueMap(
          new Map((estadosEmbarqueRes.data || []).map((e: any) => [e.id, { nombre: e.nombre, color: e.color }]))
        );
        setTiposMovimientoMap(new Map((tiposMovimientoRes.data || []).map((t: any) => [t.id, t.nombre])));
        setRacksMap(
          new Map((racksRes.data || []).map((r: any) => [r.id, { codigo: r.codigo, ubicacion: r.ubicacion }]))
        );
        setUsuariosMap(new Map((usuariosRes.data || []).map((u: any) => [u.id, u.nombre])));
      } catch (err: any) {
        errores.push(`Error inesperado cargando datos de referencia: ${err.message || err}`);
      } finally {
        setErroresRef(errores);
        setRefLoaded(true);
      }
    }

    cargarReferencia();
  }, []);

  // ------------------------------------------------------------------
  // Búsqueda de lote por código (con debounce, sin cargar todo)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!textoBusqueda.trim()) {
      setResultadosBusqueda([]);
      setMostrarResultados(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const { data, error } = await supabase
          .from('lotes')
          .select('id, codigo_lote, especie_id, fecha_produccion')
          .ilike('codigo_lote', `%${textoBusqueda.trim()}%`)
          .order('fecha_produccion', { ascending: false })
          .limit(15);

        if (error) {
          setErroresDetalle([`Error buscando lotes: ${error.message}`]);
          setResultadosBusqueda([]);
        } else {
          setResultadosBusqueda(data || []);
        }
        setMostrarResultados(true);
      } catch (err: any) {
        setErroresDetalle([`Error inesperado buscando lotes: ${err.message || err}`]);
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [textoBusqueda]);

  // ------------------------------------------------------------------
  // Carga de todo el detalle del lote seleccionado
  // ------------------------------------------------------------------
  const cargarDetalle = useCallback(async (loteId: string) => {
    setCargandoDetalle(true);
    const errores: string[] = [];

    try {
      const [loteRes, guiasRes, procesosRes, calidadRes, detalleLoteRes, movimientosRes, embarqueDetalleRes] =
        await Promise.all([
          supabase.from('lotes').select('*').eq('id', loteId).single(),
          supabase.from('guias').select('*').eq('lote_id', loteId).order('fecha_guia', { ascending: true }),
          supabase.from('procesamientos').select('*').eq('lote_id', loteId).order('fecha_proceso', { ascending: true }),
          supabase.from('control_calidad').select('*').eq('lote_id', loteId).order('fecha', { ascending: true }),
          supabase.from('detalle_lote').select('*').eq('lote_id', loteId).order('fecha_ingreso', { ascending: true }),
          supabase.from('movimientos').select('*').eq('lote_id', loteId).order('fecha', { ascending: true }),
          supabase.from('embarque_detalle').select('*').eq('lote_id', loteId),
        ]);

      if (loteRes.error) errores.push(`lotes: ${loteRes.error.message}`);
      if (guiasRes.error) errores.push(`guias: ${guiasRes.error.message}`);
      if (procesosRes.error) errores.push(`procesamientos: ${procesosRes.error.message}`);
      if (calidadRes.error) errores.push(`control_calidad: ${calidadRes.error.message}`);
      if (detalleLoteRes.error) errores.push(`detalle_lote: ${detalleLoteRes.error.message}`);
      if (movimientosRes.error) errores.push(`movimientos: ${movimientosRes.error.message}`);
      if (embarqueDetalleRes.error) errores.push(`embarque_detalle: ${embarqueDetalleRes.error.message}`);

      setLote(loteRes.data || null);
      setGuiasLote(guiasRes.data || []);
      setProcesosLote(procesosRes.data || []);
      setCalidadLote(calidadRes.data || []);
      // Solo asignaciones con cantidades disponibles (una fila agotada se elimina en el sistema)
      setInventarioLote((detalleLoteRes.data || []).filter((d: any) => (d.kilos ?? 0) > 0));
      setMovimientosLote(movimientosRes.data || []);

      // Embarques a partir de embarque_detalle (una fila = lo que ESTE lote aportó a ese embarque)
      const detalleEmbarques = embarqueDetalleRes.data || [];
      const embarqueIds = detalleEmbarques.map((d: any) => d.embarque_id).filter(Boolean);

      if (embarqueIds.length > 0) {
        const embarquesRes = await supabase.from('embarques').select('*').in('id', embarqueIds);
        if (embarquesRes.error) {
          errores.push(`embarques: ${embarquesRes.error.message}`);
          setEmbarquesLote([]);
        } else {
          const embarquesPorId = new Map((embarquesRes.data || []).map((e: any) => [e.id, e]));
          const armados: EmbarqueRow[] = detalleEmbarques
            .map((d: any) => {
              const e = embarquesPorId.get(d.embarque_id);
              if (!e) return null;
              return {
                id: e.id,
                codigo_embarque: e.codigo_embarque,
                cliente: e.cliente,
                destino: e.destino,
                transporte: e.transporte,
                fecha_embarque: e.fecha_embarque,
                observaciones: e.observaciones,
                estado_embarque_id: e.estado_embarque_id,
                creado_por: e.creado_por,
                kilos: d.kilos,
                cajas: d.cajas,
              } as EmbarqueRow;
            })
            .filter(Boolean) as EmbarqueRow[];
          setEmbarquesLote(armados);
        }
      } else {
        setEmbarquesLote([]);
      }
    } catch (err: any) {
      errores.push(`Error inesperado cargando trazabilidad: ${err.message || err}`);
    } finally {
      setErroresDetalle(errores);
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    if (!loteSeleccionado) {
      setLote(null);
      setGuiasLote([]);
      setProcesosLote([]);
      setCalidadLote([]);
      setInventarioLote([]);
      setMovimientosLote([]);
      setEmbarquesLote([]);
      return;
    }
    cargarDetalle(loteSeleccionado);
  }, [loteSeleccionado, cargarDetalle]);

  // ------------------------------------------------------------------
  // Tiempo real: refresca la trazabilidad si cambia algo relevante
  // para el lote seleccionado
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!loteSeleccionado) return;

    const channel = supabase
      .channel(`trazabilidad-lote-${loteSeleccionado}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movimientos', filter: `lote_id=eq.${loteSeleccionado}` },
        () => cargarDetalle(loteSeleccionado)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'detalle_lote', filter: `lote_id=eq.${loteSeleccionado}` },
        () => cargarDetalle(loteSeleccionado)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'control_calidad', filter: `lote_id=eq.${loteSeleccionado}` },
        () => cargarDetalle(loteSeleccionado)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'embarque_detalle', filter: `lote_id=eq.${loteSeleccionado}` },
        () => cargarDetalle(loteSeleccionado)
      )
      // embarques no tiene lote_id propio; si cambia el estado de un embarque ya vinculado, refrescamos igual
      .on('postgres_changes', { event: '*', schema: 'public', table: 'embarques' }, () =>
        cargarDetalle(loteSeleccionado)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loteSeleccionado, cargarDetalle]);

  // ------------------------------------------------------------------
  // Derivados: resumen, stock actual, timeline
  // ------------------------------------------------------------------
  const productoNombre = lote?.especie_id ? especiesMap.get(lote.especie_id) || 'Sin especie' : '-';
  const plantaNombre = lote?.planta_id ? plantasMap.get(lote.planta_id) || 'Sin planta' : '-';
  const estadoProductoInfo = lote?.estado_producto_id ? estadosProductoMap.get(lote.estado_producto_id) : undefined;
  const loteOrigen = guiasLote[0]?.lote_origen || null;
  const fechaIngreso = guiasLote[0]?.fecha_guia || lote?.fecha_produccion || null;

  const kilosOriginales = lote?.kilos_netos ?? 0;
  const cajasOriginales = lote?.cantidad_cajas ?? null;
  const kilosAlmacenados = inventarioLote.reduce((sum, i) => sum + (i.kilos || 0), 0);
  const cajasAlmacenadas = inventarioLote.some((i) => i.cajas !== null)
    ? inventarioLote.reduce((sum, i) => sum + (i.cajas || 0), 0)
    : null;
  const kilosEnviados = embarquesLote.reduce((sum, e) => sum + (e.kilos || 0), 0);
  const cajasEnviadas = embarquesLote.some((e) => e.cajas !== null)
    ? embarquesLote.reduce((sum, e) => sum + (e.cajas || 0), 0)
    : null;

  // Racks donde el lote está o estuvo: unión de detalle_lote actual + racks vistos en movimientos
  const racksInvolucrados = new Set<string>();
  inventarioLote.forEach((i) => i.rack_id && racksInvolucrados.add(i.rack_id));
  movimientosLote.forEach((m) => m.rack_id && racksInvolucrados.add(m.rack_id));

  // Línea de tiempo combinando todas las fuentes de eventos
  const timeline: TimelineEvent[] = [];

  movimientosLote.forEach((mov) => {
    const tipoNombre = mov.tipo_movimiento_id ? tiposMovimientoMap.get(mov.tipo_movimiento_id) || 'Movimiento' : 'Movimiento';
    const n = tipoNombre.toLowerCase();
    const kind: TimelineEvent['kind'] = n.includes('entrada') ? 'entrada' : n.includes('salida') ? 'salida' : 'movimiento';
    const rack = mov.rack_id ? racksMap.get(mov.rack_id)?.codigo : null;
    const usuario = mov.usuario_id ? usuariosMap.get(mov.usuario_id) : null;
    timeline.push({
      id: `mov-${mov.id}`,
      fecha: mov.fecha,
      kind,
      titulo: tipoNombre,
      lineas: [
        formatCantidad(mov.cantidad_kg, mov.cantidad_cajas),
        rack ? `Rack: ${rack}` : null,
        usuario ? `Usuario: ${usuario}` : null,
        mov.descripcion ? `Descripción: ${mov.descripcion}` : null,
      ].filter(Boolean) as string[],
    });
  });

  inventarioLote.forEach((d) => {
    const rackInfo = d.rack_id ? racksMap.get(d.rack_id) : null;
    timeline.push({
      id: `det-${d.id}`,
      fecha: d.fecha_ingreso,
      kind: 'asignacion',
      titulo: 'Asignación a Rack',
      lineas: [
        rackInfo ? `Rack: ${rackInfo.codigo}${rackInfo.ubicacion ? ` (${rackInfo.ubicacion})` : ''}` : 'Rack sin registrar',
        formatCantidad(d.kilos, d.cajas),
      ],
    });
  });

  calidadLote.forEach((c) => {
    const estadoInfo = c.estado_producto_id ? estadosProductoMap.get(c.estado_producto_id) : undefined;
    const inspector = c.usuario_id ? usuariosMap.get(c.usuario_id) : null;
    timeline.push({
      id: `cal-${c.id}`,
      fecha: c.fecha,
      kind: 'calidad',
      titulo: 'Control de Calidad',
      lineas: [
        estadoInfo ? `Estado: ${estadoInfo.nombre}` : 'Sin estado registrado',
        inspector ? `Inspector: ${inspector}` : null,
        c.temperatura !== null ? `Temperatura: ${c.temperatura} °C` : null,
        c.observacion ? `Obs: ${c.observacion}` : null,
      ].filter(Boolean) as string[],
    });
  });

  embarquesLote.forEach((e) => {
    const estadoInfo = e.estado_embarque_id ? estadosEmbarqueMap.get(e.estado_embarque_id) : undefined;
    timeline.push({
      id: `emb-${e.id}`,
      fecha: e.fecha_embarque,
      kind: 'embarque',
      titulo: `Embarque ${e.codigo_embarque}`,
      lineas: [
        e.cliente ? `Cliente: ${e.cliente}` : null,
        e.destino ? `Destino: ${e.destino}` : null,
        formatCantidad(e.kilos, e.cajas),
        estadoInfo ? `Estado: ${estadoInfo.nombre}` : null,
      ].filter(Boolean) as string[],
    });
  });

  timeline.sort((a, b) => {
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });

    const exportarPDF = () => {
    if (!lote) return;
  
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  
    // ======================================================
    // COLORES CORPORATIVOS (mismos que InventarioPage)
    // ======================================================
    const AZUL = [37, 99, 235];
    const MORADO = [124, 58, 237];
    const VERDE = [22, 163, 74];
    const NARANJA = [234, 88, 12];
    const BORDE = [220, 220, 220];
    const FONDO = [245, 247, 250];
  
    let y = 45;
  
    const checkPageBreak = (alturaNecesaria: number) => {
      if (y + alturaNecesaria > 280) {
        pdf.addPage();
        y = 20;
      }
    };
  
    const tituloSeccion = (titulo: string, color = AZUL) => {
      checkPageBreak(15);
      pdf.setFillColor(FONDO[0], FONDO[1], FONDO[2]);
      pdf.setDrawColor(BORDE[0], BORDE[1], BORDE[2]);
      pdf.roundedRect(12, y, 186, 10, 2, 2, 'FD');
  
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(titulo, 18, y + 6.5);
  
      y += 15;
    };
  
    // ======================================================
    // ENCABEZADO
    // ======================================================
    pdf.setFillColor(AZUL[0], AZUL[1], AZUL[2]);
    pdf.rect(0, 0, 210, 35, 'F');
  
    pdf.addImage(logoIncomar, 'PNG', 10, 5, 22, 22);
  
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('TRAZABILIDAD DE LOTE', 40, 15);
  
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Sistema de Gestión INCOMAR', 40, 22);
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Lote: ${lote.codigo_lote}`, 40, 29);
  
    pdf.setFontSize(9);
    pdf.text(`Emitido: ${new Date().toLocaleString('es-CL')}`, 145, 28);
  
    // ======================================================
    // INFORMACIÓN DEL LOTE
    // ======================================================
    tituloSeccion('INFORMACIÓN DEL LOTE');
  
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
  
    const infoLinea = (label: string, valor: string, x: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, x, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(valor, x + 30, y);
    };
  
    infoLinea('Código:', lote.codigo_lote, 18);
    infoLinea('Producto:', productoNombre, 112);
    y += 7;
    infoLinea('Planta:', plantaNombre, 18);
    infoLinea('Fecha Ingreso:', formatDate(fechaIngreso), 112);
    y += 7;
    infoLinea('Kilos Netos:', `${kilosOriginales.toLocaleString()} kg`, 18);
    if (cajasOriginales !== null) {
      infoLinea('Cajas:', String(cajasOriginales), 112);
    }
    y += 7;
    infoLinea('Estado:', estadoProductoInfo?.nombre ?? 'Sin registrar', 18);
    if (loteOrigen) {
      infoLinea('Lote Origen:', loteOrigen, 112);
    }
    y += 10;
  
    if (lote.observaciones) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Observaciones:', 18, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      const obsLines = pdf.splitTextToSize(lote.observaciones, 175);
      pdf.text(obsLines, 18, y);
      y += obsLines.length * 5 + 5;
    }
  
    y += 3;
  
    // ======================================================
    // RESUMEN GENERAL
    // ======================================================
    checkPageBreak(35);
    tituloSeccion('RESUMEN GENERAL');
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Kilos Originales:', 18, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${kilosOriginales.toLocaleString()} kg`, 55, y);
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Kilos Almacenados:', 112, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${kilosAlmacenados.toLocaleString()} kg`, 152, y);
    y += 7;
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Kilos Importados:', 18, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${kilosEnviados.toLocaleString()} kg`, 55, y);
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Controles de Calidad:', 112, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(calidadLote.length), 152, y);
    y += 7;
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Racks Involucrados:', 18, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(racksInvolucrados.size), 55, y);
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Embarques Asociados:', 112, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(embarquesLote.length), 152, y);
    y += 12;
  
    // ======================================================
    // UBICACIÓN ACTUAL
    // ======================================================
    if (inventarioLote.length > 0) {
      checkPageBreak(20);
      tituloSeccion('UBICACIÓN ACTUAL');
  
      autoTable(pdf, {
        startY: y,
        margin: { left: 12, right: 12 },
        head: [['Rack', 'Ubicación', 'Kilos', 'Cajas', 'Desde']],
        body: inventarioLote.map((item) => {
          const rackInfo = item.rack_id ? racksMap.get(item.rack_id) : null;
          return [
            rackInfo?.codigo ?? 'Sin registrar',
            rackInfo?.ubicacion ?? '-',
            `${(item.kilos ?? 0).toLocaleString()} kg`,
            item.cajas !== null ? String(item.cajas) : '-',
            formatDate(item.fecha_ingreso),
          ];
        }),
        headStyles: { fillColor: AZUL as [number, number, number] },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: FONDO as [number, number, number] },
      });
  
      y = (pdf as any).lastAutoTable.finalY + 12;
    }
  
    // ======================================================
    // HISTORIAL DE MOVIMIENTOS
    // ======================================================
    if (movimientosLote.length > 0) {
      checkPageBreak(20);
      tituloSeccion('HISTORIAL DE MOVIMIENTOS', MORADO);
  
      autoTable(pdf, {
        startY: y,
        margin: { left: 12, right: 12 },
        head: [['Tipo', 'Rack', 'Kilos', 'Cajas', 'Fecha', 'Responsable']],
        body: [...movimientosLote].reverse().map((mov) => {
          const tipoNombre = mov.tipo_movimiento_id
            ? tiposMovimientoMap.get(mov.tipo_movimiento_id) ?? 'Sin registrar'
            : 'Sin registrar';
          const rackCodigo = mov.rack_id ? racksMap.get(mov.rack_id)?.codigo : null;
          const responsable = mov.usuario_id ? usuariosMap.get(mov.usuario_id) : null;
          return [
            tipoNombre,
            rackCodigo ?? '-',
            `${(mov.cantidad_kg ?? 0).toLocaleString()} kg`,
            mov.cantidad_cajas !== null ? String(mov.cantidad_cajas) : '-',
            formatDate(mov.fecha),
            responsable ?? 'Sin registrar',
          ];
        }),
        headStyles: { fillColor: MORADO as [number, number, number] },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: FONDO as [number, number, number] },
      });
  
      y = (pdf as any).lastAutoTable.finalY + 12;
    }
  
    // ======================================================
    // CONTROL DE CALIDAD
    // ======================================================
    if (calidadLote.length > 0) {
      checkPageBreak(20);
      tituloSeccion('CONTROL DE CALIDAD/ RECEPCIÓN', VERDE);
  
      autoTable(pdf, {
        startY: y,
        margin: { left: 12, right: 12 },
        head: [['Estado', 'Inspector', 'Temperatura', 'Fecha', 'Observación']],
        body: [...calidadLote].reverse().map((c) => {
          const estadoInfo = c.estado_producto_id ? estadosProductoMap.get(c.estado_producto_id) : undefined;
          const inspector = c.usuario_id ? usuariosMap.get(c.usuario_id) : null;
          return [
            estadoInfo?.nombre ?? 'Sin estado',
            inspector ?? 'Sin registrar',
            c.temperatura !== null ? `${c.temperatura} °C` : '-',
            formatDate(c.fecha),
            c.observacion ?? '-',
          ];
        }),
        headStyles: { fillColor: VERDE as [number, number, number] },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: FONDO as [number, number, number] },
      });
  
      y = (pdf as any).lastAutoTable.finalY + 12;
    }
  
    // ======================================================
    // EMBARQUES
    // ======================================================
    if (embarquesLote.length > 0) {
      checkPageBreak(20);
      tituloSeccion('EMBARQUES', NARANJA);
  
      autoTable(pdf, {
        startY: y,
        margin: { left: 12, right: 12 },
        head: [['Embarque', 'Cliente', 'Destino', 'Kilos', 'Cajas', 'Estado', 'Fecha']],
        body: embarquesLote.map((e) => {
          const estadoInfo = e.estado_embarque_id ? estadosEmbarqueMap.get(e.estado_embarque_id) : undefined;
          return [
            e.codigo_embarque,
            e.cliente ?? '-',
            e.destino ?? '-',
            `${(e.kilos ?? 0).toLocaleString()} kg`,
            e.cajas !== null ? String(e.cajas) : '-',
            estadoInfo?.nombre ?? 'Sin estado',
            formatDate(e.fecha_embarque),
          ];
        }),
        headStyles: { fillColor: NARANJA as [number, number, number] },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: FONDO as [number, number, number] },
      });
  
      y = (pdf as any).lastAutoTable.finalY + 12;
    }
  
    // ======================================================
    // PIE DE DOCUMENTO
    // ======================================================
    checkPageBreak(20);
    pdf.setDrawColor(200);
    pdf.line(15, y, 195, y);
  
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text('Documento generado automáticamente por el Sistema de Gestión INCOMAR.', 15, y + 8);
    pdf.text('Uso interno - Información confidencial.', 15, y + 14);

    // ======================================================
    // DESCARGAR
    // ======================================================
    pdf.save(`Trazabilidad_${lote.codigo_lote}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Trazabilidad de Lotes</h1>
          <p className="text-gray-600">Historial completo desde el ingreso hasta el destino final</p>
        </div>

        {lote && (
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileDown className="w-5 h-5" />
            Generar PDF
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-2 relative">
          <label className="block text-gray-700 mb-2">Buscar Lote</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onFocus={() => textoBusqueda.trim() && setMostrarResultados(true)}
              placeholder="Buscar por código de lote..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {mostrarResultados && textoBusqueda.trim() && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {buscando && <p className="p-3 text-sm text-gray-500">Buscando...</p>}
              {!buscando && resultadosBusqueda.length === 0 && (
                <p className="p-3 text-sm text-gray-500">Sin coincidencias</p>
              )}
              {!buscando &&
                resultadosBusqueda.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setLoteSeleccionado(r.id);
                      setTextoBusqueda(r.codigo_lote);
                      setMostrarResultados(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="text-gray-900">{r.codigo_lote}</p>
                    <p className="text-xs text-gray-500">
                      {r.especie_id ? especiesMap.get(r.especie_id) || 'Sin especie' : 'Sin especie'} ·{' '}
                      {formatDate(r.fecha_produccion)}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </div>

        {(erroresRef.length > 0 || erroresDetalle.length > 0) && (
          <div className="mt-4 mb-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm mb-1">Ocurrieron errores cargando algunos datos:</p>
            <ul className="text-red-600 text-xs list-disc list-inside">
              {[...erroresRef, ...erroresDetalle].map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {!loteSeleccionado && refLoaded && (
          <div className="text-center py-12">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Busque un lote por código para visualizar su trazabilidad completa</p>
          </div>
        )}

        {loteSeleccionado && cargandoDetalle && (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando trazabilidad...</p>
          </div>
        )}

        {loteSeleccionado && !cargandoDetalle && lote && (
          <div className="mt-6 space-y-6">
            {/* Información general */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <PackageCheck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-4">Información del Lote</h2>

                  {loteOrigen && (
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-2">Trazabilidad de Lote:</p>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm">
                          Lote Origen: {loteOrigen}
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">
                          Lote Interno: {lote.codigo_lote}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Código</p>
                      <p className="text-gray-900">{lote.codigo_lote}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Producto</p>
                      <p className="text-gray-900">{productoNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Planta</p>
                      <p className="text-gray-900">{plantaNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha de Ingreso</p>
                      <p className="text-gray-900">{formatDate(fechaIngreso)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kilos Netos</p>
                      <p className="text-gray-900">{kilosOriginales.toLocaleString()} kg</p>
                    </div>
                    {cajasOriginales !== null && (
                      <div>
                        <p className="text-sm text-gray-600">Cantidad de Cajas</p>
                        <p className="text-gray-900">{cajasOriginales.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Estado del Producto</p>
                      {estadoProductoInfo ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-sm ${badgeClass(estadoProductoInfo.color)}`}>
                          {estadoProductoInfo.nombre}
                        </span>
                      ) : (
                        <p className="text-gray-900">Sin registrar</p>
                      )}
                    </div>
                    {lote.observaciones && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Observaciones</p>
                        <p className="text-gray-900">{lote.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen del lote */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-gray-900 mb-4">Resumen del Lote</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700 mb-1">Kilos Originales</p>
                  <p className="text-blue-700">{kilosOriginales.toLocaleString()} kg</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-700 mb-1">Kilos Almacenados Hoy</p>
                  <p className="text-green-700">{kilosAlmacenados.toLocaleString()} kg</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-sm text-gray-700 mb-1">Kilos Enviados</p>
                  <p className="text-indigo-700">{kilosEnviados.toLocaleString()} kg</p>
                </div>
                {cajasOriginales !== null && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-700 mb-1">Cajas Originales</p>
                    <p className="text-blue-700">{cajasOriginales.toLocaleString()}</p>
                  </div>
                )}
                {cajasAlmacenadas !== null && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm text-gray-700 mb-1">Cajas Almacenadas Hoy</p>
                    <p className="text-green-700">{cajasAlmacenadas.toLocaleString()}</p>
                  </div>
                )}
                {cajasEnviadas !== null && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-gray-700 mb-1">Cajas Enviadas</p>
                    <p className="text-indigo-700">{cajasEnviadas.toLocaleString()}</p>
                  </div>
                )}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-700 mb-1">Controles de Calidad</p>
                  <p className="text-purple-700">{calidadLote.length}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-sm text-gray-700 mb-1">Racks Involucrados</p>
                  <p className="text-yellow-700">{racksInvolucrados.size}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 mb-1">Embarques Asociados</p>
                  <p className="text-gray-700">{embarquesLote.length}</p>
                </div>
              </div>
            </div>

            {/* Stock / ubicación actual */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-yellow-600" />
                <h3 className="text-gray-900">Ubicación Actual ({inventarioLote.length})</h3>
              </div>
              {inventarioLote.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {inventarioLote.map((item) => {
                      const rackInfo = item.rack_id ? racksMap.get(item.rack_id) : null;
                      return (
                        <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-900 mb-1">Rack {rackInfo?.codigo || 'Sin registrar'}</p>
                          {rackInfo?.ubicacion && <p className="text-xs text-gray-500 mb-2">{rackInfo.ubicacion}</p>}
                          <p className="text-sm text-gray-900">{formatCantidad(item.kilos, item.cajas)}</p>
                          <p className="text-xs text-gray-500 mt-1">Desde: {formatDate(item.fecha_ingreso)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-gray-700">Total actual</p>
                    <p className="text-gray-900">
                      {formatCantidad(kilosAlmacenados, cajasAlmacenadas === null ? null : cajasAlmacenadas)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin asignación de almacenamiento</p>
              )}
            </div>

            {/* Línea de tiempo */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Route className="w-6 h-6 text-blue-600" />
                <h3 className="text-gray-900">Línea de Tiempo ({timeline.length})</h3>
              </div>
              {timeline.length > 0 ? (
                <div className="relative pl-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {timeline.map((ev) => (
                      <div key={ev.id} className="relative">
                        <div
                          className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ${timelineStyles[ev.kind].dot}`}
                        >
                          {timelineStyles[ev.kind].icon}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-gray-900">{ev.titulo}</p>
                            <p className="text-xs text-gray-500">{formatDate(ev.fecha)}</p>
                          </div>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            {ev.lineas.map((l, i) => (
                              <p key={i}>{l}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin eventos registrados todavía</p>
              )}
            </div>

            {/* Guías de despacho / origen */}
            {guiasLote.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileSignature className="w-6 h-6 text-blue-600" />
                  <h3 className="text-gray-900">Guías de Despacho / Origen ({guiasLote.length})</h3>
                </div>
                <div className="space-y-3">
                  {guiasLote.map((guia) => (
                    <div key={guia.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 mb-2">{guia.numero_guia}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Barco:</p>
                          <p className="text-gray-900">{guia.barco}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kilos:</p>
                          <p className="text-gray-900">{(guia.kilos || 0).toLocaleString()} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Origen:</p>
                          <p className="text-gray-900">{guia.origen}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Destino:</p>
                          <p className="text-gray-900">{guia.destino}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movimientos */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Ship className="w-6 h-6 text-indigo-600" />
                <h3 className="text-gray-900">Historial de Movimientos ({movimientosLote.length})</h3>
              </div>
              {movimientosLote.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Tipo</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Rack</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Cajas</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Kilos</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Fecha</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Responsable</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...movimientosLote].reverse().map((mov) => {
                        const tipoNombre = mov.tipo_movimiento_id
                          ? tiposMovimientoMap.get(mov.tipo_movimiento_id) || 'Sin registrar'
                          : 'Sin registrar';
                        const rackCodigo = mov.rack_id ? racksMap.get(mov.rack_id)?.codigo : null;
                        const responsable = mov.usuario_id ? usuariosMap.get(mov.usuario_id) : null;
                        return (
                          <tr key={mov.id} className="border-b border-gray-100">
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded text-xs ${tipoMovimientoBadge(tipoNombre)}`}>
                                {tipoNombre}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-900">{rackCodigo || '-'}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{mov.cantidad_cajas ?? '-'}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{(mov.cantidad_kg || 0).toLocaleString()} kg</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{formatDate(mov.fecha)}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{responsable || 'Sin registrar'}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{mov.descripcion || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin movimientos registrados</p>
              )}
            </div>

            {/* Control de calidad */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <ClipboardCheck className="w-6 h-6 text-green-600" />
                <h3 className="text-gray-900">Control de Calidad ({calidadLote.length})</h3>
              </div>
              {calidadLote.length > 0 ? (
                <div className="space-y-3">
                  {[...calidadLote].reverse().map((control) => {
                    const estadoInfo = control.estado_producto_id
                      ? estadosProductoMap.get(control.estado_producto_id)
                      : undefined;
                    const inspector = control.usuario_id ? usuariosMap.get(control.usuario_id) : null;
                    return (
                      <div key={control.id} className={`p-4 rounded-lg ${estadoCalidadCardClass(estadoInfo?.nombre || '')}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-900">{estadoInfo?.nombre || 'Sin estado'}</p>
                          <p className="text-sm text-gray-600">{formatDate(control.fecha)}</p>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">
                            Inspector: <span className="text-gray-900">{inspector || 'Sin registrar'}</span>
                          </p>
                          {control.temperatura !== null && (
                            <p className="text-gray-600">
                              Temperatura: <span className="text-gray-900">{control.temperatura} °C</span>
                            </p>
                          )}
                          {control.observacion && (
                            <p className="text-gray-600">
                              Obs: <span className="text-gray-900">{control.observacion}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin controles de calidad registrados</p>
              )}
            </div>

            {/* Embarques */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Ship className="w-6 h-6 text-blue-600" />
                <h3 className="text-gray-900">Embarques ({embarquesLote.length})</h3>
              </div>
              {embarquesLote.length > 0 ? (
                <div className="space-y-3">
                  {embarquesLote.map((embarque) => {
                    const estadoInfo = embarque.estado_embarque_id
                      ? estadosEmbarqueMap.get(embarque.estado_embarque_id)
                      : undefined;
                    const responsable = embarque.creado_por ? usuariosMap.get(embarque.creado_por) : null;
                    return (
                      <div key={embarque.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-900">{embarque.codigo_embarque}</p>
                          <span className={`px-3 py-1 rounded-full text-xs ${badgeClass(estadoInfo?.color)}`}>
                            {estadoInfo?.nombre || 'Sin estado'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Cliente:</p>
                            <p className="text-gray-900">{embarque.cliente || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Destino:</p>
                            <p className="text-gray-900">{embarque.destino || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Transporte:</p>
                            <p className="text-gray-900">{embarque.transporte || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Fecha de Embarque:</p>
                            <p className="text-gray-900">{formatDate(embarque.fecha_embarque)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Cantidad enviada:</p>
                            <p className="text-gray-900">{formatCantidad(embarque.kilos, embarque.cajas)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Responsable:</p>
                            <p className="text-gray-900">{responsable || 'Sin registrar'}</p>
                          </div>
                          {embarque.observaciones && (
                            <div className="col-span-2">
                              <p className="text-gray-600">Observaciones:</p>
                              <p className="text-gray-900">{embarque.observaciones}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin embarques registrados</p>
              )}
            </div>

            {/* Procesamiento (información adicional, no forma parte del recorrido pedido) */}
            {procesosLote.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Factory className="w-6 h-6 text-purple-600" />
                  <h3 className="text-gray-900">Procesamiento ({procesosLote.length})</h3>
                </div>
                <div className="space-y-3">
                  {procesosLote.map((proceso) => {
                    const merma = (proceso.kilos_entrada || 0) - (proceso.kilos_salida || 0);
                    const rendimiento = proceso.kilos_entrada ? (proceso.kilos_salida / proceso.kilos_entrada) * 100 : 0;
                    return (
                      <div key={proceso.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 mb-2">{proceso.observaciones || 'Procesamiento'}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Entrada:</p>
                            <p className="text-gray-900">{(proceso.kilos_entrada || 0).toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Salida:</p>
                            <p className="text-gray-900">{(proceso.kilos_salida || 0).toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Merma:</p>
                            <p className="text-red-700">{merma.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rendimiento:</p>
                            <p className="text-green-700">{rendimiento.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}