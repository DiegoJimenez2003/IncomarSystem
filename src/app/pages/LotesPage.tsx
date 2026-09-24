import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, PackageCheck, AlertTriangle, FileDown, X, Warehouse, Snowflake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { LoteModal } from '../components/Productos/LoteModal';
import jsPDF from 'jspdf';
import { logoIncomar } from '../../utils/LogoBase64';
import { AsignarRackModal } from '../components/Productos/AsignarRackModal';
import autoTable from 'jspdf-autotable';
import { MoverACamaraModal } from '../components/Productos/MoverACamaraModal';

interface Lote {
  id: string;
  codigo_lote: string;
  especie_id: string;
  presentacion_id: string;
  estado_producto_id: string;
  planta_id: string;
  turno_id: string;
  fecha_produccion: string;
  fecha_vencimiento: string | null;
  kilos_netos: number;
  cantidad_cajas: number | null;
  temperatura: number | null;
  observaciones: string | null;
  lote_padre_id: string | null;

  especie?: { nombre: string };
  presentacion?: { nombre: string };
  planta?: { nombre: string };
  estado_producto?: { nombre: string };
}

// Un "grupo" es el lote padre (ej. código 406) + sus lotes hijos, uno por presentación.
interface GrupoLote {
  padre: Lote;
  hijos: Lote[];
}

interface DetalleLinea {
  racks: any[];
  camaras: any[];
}

type FiltroFecha = 'todos' | 'hoy' | '7dias' | 'mes';

interface Filtros {
  codigo_lote: string;
  especie: string;
  planta: string;
  kilosMin: string;
  kilosMax: string;
  fecha: FiltroFecha;
  anio: string;
  estado: string;
}

const FILTROS_INICIALES: Filtros = {
  codigo_lote: '',
  especie: '',
  planta: '',
  kilosMin: '',
  kilosMax: '',
  fecha: 'todos',
  anio: '',
  estado: 'todos',
};

const OPCIONES_FECHA: { valor: FiltroFecha; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todas' },
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7dias', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
];

function fechaEnRango(fechaISO: string, filtro: FiltroFecha): boolean {
  if (filtro === 'todos') return true;
  const fecha = new Date(fechaISO);
  const ahora = new Date();

  if (filtro === 'hoy') {
    return (
      fecha.getFullYear() === ahora.getFullYear() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getDate() === ahora.getDate()
    );
  }
  if (filtro === '7dias') {
    const hace7dias = new Date(ahora);
    hace7dias.setDate(ahora.getDate() - 7);
    hace7dias.setHours(0, 0, 0, 0);
    return fecha >= hace7dias;
  }
  if (filtro === 'mes') {
    return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
  }
  return true;
}

// Las "líneas" de un grupo son sus presentaciones: si tiene hijos, son los hijos;
// si no tiene hijos (lote suelto sin dividir), la única línea es el propio padre.
function obtenerLineas(grupo: GrupoLote): Lote[] {
  return grupo.hijos.length > 0 ? grupo.hijos : [grupo.padre];
}

function resumenGrupo(grupo: GrupoLote) {
  const lineas = obtenerLineas(grupo);
  const kilosTotal = lineas.reduce((sum, l) => sum + (Number(l.kilos_netos) || 0), 0);
  const cajasTotal = lineas.reduce((sum, l) => sum + (Number(l.cantidad_cajas) || 0), 0);
  const estados = Array.from(
    new Set(lineas.map((l) => l.estado_producto?.nombre).filter(Boolean))
  ) as string[];
  const presentaciones = Array.from(
    new Set(lineas.map((l) => l.presentacion?.nombre).filter(Boolean))
  ) as string[];
  return { lineas, kilosTotal, cajasTotal, estados, presentaciones };
}

export function LotesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [loteEditar, setLoteEditar] = useState<Lote | null>(null);

  const [grupoDetalle, setGrupoDetalle] = useState<GrupoLote | null>(null);
  const [detalleLineas, setDetalleLineas] = useState<Record<string, DetalleLinea>>({});

  const [loteAsignar, setLoteAsignar] = useState<Lote | null>(null);
  const [loteMoverCamara, setLoteMoverCamara] = useState<Lote | null>(null);

  const [grupoEliminar, setGrupoEliminar] = useState<GrupoLote | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [generandoPDFGeneral, setGenerandoPDFGeneral] = useState(false);
  const [generandoPDFLoteId, setGenerandoPDFLoteId] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  function actualizarFiltro<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setSearchTerm('');
  }

  const hayFiltrosActivos =
    searchTerm !== '' ||
    Object.entries(filtros).some(([key, value]) =>
      key === 'estado' || key === 'fecha' ? value !== 'todos' : value !== ''
    );

  // ==========================================================
  // AGRUPACIÓN: lote padre + sus líneas por presentación
  // ==========================================================

  const grupos = useMemo<GrupoLote[]>(() => {
    const hijosPorPadre = new Map<string, Lote[]>();
    lotes.forEach((l) => {
      if (l.lote_padre_id) {
        const arr = hijosPorPadre.get(l.lote_padre_id) ?? [];
        arr.push(l);
        hijosPorPadre.set(l.lote_padre_id, arr);
      }
    });

    return lotes
      .filter((l) => !l.lote_padre_id)
      .map((padre) => ({ padre, hijos: hijosPorPadre.get(padre.id) ?? [] }));
  }, [lotes]);

  // Líneas "reales" del sistema completo (para inventario / reporte general):
  // se excluyen los padres que ya fueron divididos en hijos, para no duplicar kilos.
  const lineasTodas = useMemo(() => {
    const idsConHijos = new Set(
      lotes.filter((l) => l.lote_padre_id).map((l) => l.lote_padre_id as string)
    );
    return lotes.filter((l) => !idsConHijos.has(l.id));
  }, [lotes]);

  // Si el grupo abierto en el detalle cambia de contenido (racks, cámaras, ediciones),
  // lo mantenemos sincronizado con los datos frescos de `grupos`.
  useEffect(() => {
    if (!grupoDetalle) return;
    const actualizado = grupos.find((g) => g.padre.id === grupoDetalle.padre.id);
    setGrupoDetalle(actualizado ?? null);
  }, [grupos]);

  const aniosDisponibles = useMemo(() => {
    const anios = new Set(grupos.map((g) => new Date(g.padre.fecha_produccion).getFullYear()));
    return Array.from(anios).sort((a, b) => b - a);
  }, [grupos]);

  const gruposFiltrados = useMemo(() => {
    return grupos.filter((grupo) => {
      const { padre } = grupo;
      const { lineas, kilosTotal, estados, presentaciones } = resumenGrupo(grupo);

      const matchesSearch =
        searchTerm === '' ||
        padre.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lineas.some((l) => l.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (padre.especie?.nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        presentaciones.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      if (
        filtros.codigo_lote &&
        !padre.codigo_lote?.toLowerCase().includes(filtros.codigo_lote.toLowerCase())
      )
        return false;

      if (
        filtros.especie &&
        !(padre.especie?.nombre ?? '').toLowerCase().includes(filtros.especie.toLowerCase())
      )
        return false;

      if (
        filtros.planta &&
        !(padre.planta?.nombre ?? '').toLowerCase().includes(filtros.planta.toLowerCase())
      )
        return false;

      if (filtros.kilosMin && kilosTotal < Number(filtros.kilosMin)) return false;
      if (filtros.kilosMax && kilosTotal > Number(filtros.kilosMax)) return false;

      if (!fechaEnRango(padre.fecha_produccion, filtros.fecha)) return false;

      if (filtros.anio && new Date(padre.fecha_produccion).getFullYear() !== Number(filtros.anio))
        return false;

      const matchesEstado =
        filtros.estado === 'todos' ||
        estados.some((e) => e.toLowerCase().trim() === filtros.estado);
      if (!matchesEstado) return false;

      return true;
    });
  }, [grupos, searchTerm, filtros]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  /* ==========================================================
     DETALLE: racks y cámaras de las líneas del grupo abierto
  ========================================================== */

  async function cargarDetalleLineas(ids: string[]) {
    if (ids.length === 0) {
      setDetalleLineas({});
      return;
    }

    const { data: racksData, error: errRacks } = await supabase
      .from('detalle_lote')
      .select('lote_id, kilos, cajas, racks:rack_id ( codigo, ubicacion, bodega )')
      .in('lote_id', ids)
      .gt('kilos', 0);

    if (errRacks) console.error(errRacks);

    const { data: camarasData, error: errCamaras } = await supabase
      .from('detalle_camara')
      .select('lote_id, kilos, cajas, fecha_ingreso, camaras ( nombre, tipo )')
      .in('lote_id', ids);

    if (errCamaras) console.error(errCamaras);

    const mapa: Record<string, DetalleLinea> = {};
    ids.forEach((id) => {
      mapa[id] = { racks: [], camaras: [] };
    });
    (racksData ?? []).forEach((r: any) => {
      mapa[r.lote_id]?.racks.push(r);
    });
    (camarasData ?? []).forEach((c: any) => {
      mapa[c.lote_id]?.camaras.push(c);
    });

    setDetalleLineas(mapa);
  }

  useEffect(() => {
    if (!grupoDetalle) {
      setDetalleLineas({});
      return;
    }
    cargarDetalleLineas(obtenerLineas(grupoDetalle).map((l) => l.id));
  }, [grupoDetalle]);

  /* ==========================================================
     FICHA PDF POR LOTE (padre), desglosada por presentación
  ========================================================== */

  const descargarPDFGrupo = async (grupo: GrupoLote) => {
    setGenerandoPDFLoteId(grupo.padre.id);
    try {
      const { padre } = grupo;
      const lineas = obtenerLineas(grupo);
      const idsLineas = lineas.map((l) => l.id);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const AZUL: [number, number, number] = [37, 99, 235];
      const MORADO: [number, number, number] = [124, 58, 237];
      const GRIS: [number, number, number] = [107, 114, 128];
      const BORDE: [number, number, number] = [220, 220, 220];
      const FONDO: [number, number, number] = [245, 247, 250];

      const { data: detalleRacksData, error: errRacks } = await supabase
        .from('detalle_lote')
        .select('lote_id, kilos, cajas, racks:rack_id ( codigo, ubicacion )')
        .in('lote_id', idsLineas)
        .gt('kilos', 0);
      if (errRacks) console.error(errRacks);

      const { data: detalleCamarasData, error: errCamaras } = await supabase
        .from('detalle_camara')
        .select('lote_id, kilos, cajas, fecha_ingreso, camaras ( nombre, tipo )')
        .in('lote_id', idsLineas);
      if (errCamaras) console.error(errCamaras);

      const racks = detalleRacksData ?? [];
      const camaras = detalleCamarasData ?? [];

      // Inventario general del sistema completo (para dar contexto en la ficha)
      const { data: detalleTodosData } = await supabase
        .from('detalle_lote')
        .select('lote_id, kilos')
        .gt('kilos', 0);
      const { data: camaraTodosData } = await supabase.from('detalle_camara').select('lote_id, kilos');

      const idsEnInventario = new Set([
        ...(detalleTodosData ?? []).map((d: any) => d.lote_id),
        ...(camaraTodosData ?? []).map((c: any) => c.lote_id),
      ]);
      const totalLotesInventario = idsEnInventario.size;

      const gruposInv = new Map<string, { especie: string; presentacion: string; cantidad: number }>();
      lineasTodas
        .filter((l) => idsEnInventario.has(l.id))
        .forEach((l) => {
          const especieNombre = l.especie?.nombre ?? 'Sin especie';
          const presentacionNombre = l.presentacion?.nombre ?? 'Sin presentación';
          const key = `${especieNombre}__${presentacionNombre}`;
          const actual = gruposInv.get(key);
          if (actual) actual.cantidad += 1;
          else gruposInv.set(key, { especie: especieNombre, presentacion: presentacionNombre, cantidad: 1 });
        });
      const gruposInvOrdenados = Array.from(gruposInv.values()).sort((a, b) =>
        a.especie === b.especie ? a.presentacion.localeCompare(b.presentacion) : a.especie.localeCompare(b.especie)
      );

      // ---- Encabezado ----
      pdf.setFillColor(...AZUL);
      pdf.rect(0, 0, 210, 35, 'F');
      pdf.addImage(logoIncomar, 'PNG', 10, 5, 22, 22);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('FICHA DE TRAZABILIDAD', 40, 15);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text('Sistema de Gestión INCOMAR', 40, 22);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Lote ${padre.codigo_lote}`, 40, 29);
      pdf.setFontSize(9);
      pdf.text(`Emitido: ${new Date().toLocaleString('es-CL')}`, 145, 28);

      let y = 45;
      const checkPageBreak = (alturaNecesaria: number) => {
        if (y + alturaNecesaria > 280) {
          pdf.addPage();
          y = 20;
        }
      };
      const tituloSeccion = (titulo: string, color: [number, number, number] = AZUL) => {
        checkPageBreak(15);
        pdf.setFillColor(...FONDO);
        pdf.setDrawColor(...BORDE);
        pdf.roundedRect(12, y, 186, 10, 2, 2, 'FD');
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(titulo, 18, y + 6.5);
        y += 15;
      };
      const fila = (izquierda: string, valorIzq: any, derecha: string, valorDer: any) => {
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(izquierda, 18, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(valorIzq ?? '-'), 52, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(derecha, 112, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(valorDer ?? '-'), 152, y);
        y += 8;
      };

      // ---- Información general del lote padre ----
      tituloSeccion('INFORMACIÓN GENERAL');
      fila('Código', padre.codigo_lote, 'Especie', padre.especie?.nombre ?? '-');
      fila('Planta', padre.planta?.nombre ?? '-', 'Presentaciones', lineas.length);
      fila(
        'Producción',
        formatDate(padre.fecha_produccion),
        'Vencimiento',
        padre.fecha_vencimiento ? formatDate(padre.fecha_vencimiento) : '-'
      );

      const kilosTotalGrupo = lineas.reduce((s, l) => s + (Number(l.kilos_netos) || 0), 0);
      const cajasTotalGrupo = lineas.reduce((s, l) => s + (Number(l.cantidad_cajas) || 0), 0);
      fila('Kilos totales', `${kilosTotalGrupo.toLocaleString()} kg`, 'Cajas totales', cajasTotalGrupo || '-');
      y += 2;

      // ---- Una sección por presentación (línea) ----
      lineas.forEach((linea) => {
        checkPageBreak(20);
        tituloSeccion(
          `PRESENTACIÓN: ${(linea.presentacion?.nombre ?? 'Sin presentación').toUpperCase()}`,
          MORADO
        );

        fila('Código interno', linea.codigo_lote, 'Estado', linea.estado_producto?.nombre ?? '-');
        fila('Kilos', `${linea.kilos_netos ?? 0} kg`, 'Cajas', linea.cantidad_cajas ?? '-');

        const racksLinea = racks.filter((r: any) => r.lote_id === linea.id);
        const camarasLinea = camaras.filter((c: any) => c.lote_id === linea.id);

        if (racksLinea.length > 0) {
          autoTable(pdf, {
            startY: y,
            margin: { left: 12, right: 12 },
            head: [['Rack', 'Ubicación', 'Kilos', 'Cajas']],
            body: racksLinea.map((r: any) => [
              r.racks?.codigo ?? 'Sin registrar',
              r.racks?.ubicacion ?? '-',
              `${(r.kilos ?? 0).toLocaleString()} kg`,
              r.cajas !== null ? String(r.cajas) : '-',
            ]),
            headStyles: { fillColor: MORADO },
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: FONDO },
          });
          y = (pdf as any).lastAutoTable.finalY + 6;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...GRIS);
          pdf.text('Sin racks asignados.', 18, y);
          y += 8;
        }

        if (camarasLinea.length > 0) {
          checkPageBreak(20);
          autoTable(pdf, {
            startY: y,
            margin: { left: 12, right: 12 },
            head: [['Cámara', 'Tipo', 'Kilos', 'Cajas', 'Ingreso']],
            body: camarasLinea.map((c: any) => [
              c.camaras?.nombre ?? '-',
              c.camaras?.tipo === 'NO_PAC' ? 'NO PAC' : (c.camaras?.tipo ?? '-'),
              `${(Number(c.kilos) || 0).toLocaleString()} kg`,
              c.cajas != null ? String(c.cajas) : '-',
              c.fecha_ingreso ? formatDate(c.fecha_ingreso) : '-',
            ]),
            headStyles: { fillColor: AZUL },
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: FONDO },
          });
          y = (pdf as any).lastAutoTable.finalY + 6;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...GRIS);
          pdf.text('Sin ubicación en cámara.', 18, y);
          y += 8;
        }

        if (linea.observaciones?.trim()) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          const obsLineas = pdf.splitTextToSize(`Obs.: ${linea.observaciones}`, 170);
          pdf.text(obsLineas, 18, y);
          y += obsLineas.length * 5 + 4;
        }

        y += 3;
      });

      // ---- Inventario general ----
      checkPageBreak(20);
      tituloSeccion('INVENTARIO GENERAL', AZUL);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total de lotes actualmente en inventario: ${totalLotesInventario}`, 18, y);
      y += 10;

      if (gruposInvOrdenados.length > 0) {
        autoTable(pdf, {
          startY: y,
          margin: { left: 12, right: 12 },
          head: [['Especie', 'Presentación', 'Lotes en inventario']],
          body: gruposInvOrdenados.map((g) => [g.especie, g.presentacion, String(g.cantidad)]),
          headStyles: { fillColor: AZUL },
          styles: { fontSize: 9 },
          alternateRowStyles: { fillColor: FONDO },
        });
        y = (pdf as any).lastAutoTable.finalY + 10;
      }

      // ---- Observaciones generales del lote padre ----
      checkPageBreak(40);
      tituloSeccion('OBSERVACIONES GENERALES');
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(15, y, 180, 30, 2, 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const texto = padre.observaciones?.trim() ? padre.observaciones : 'Sin observaciones registradas.';
      const lineasTexto = pdf.splitTextToSize(texto, 170);
      pdf.text(lineasTexto, 20, y + 8);
      y += 40;

      // ---- Pie ----
      checkPageBreak(20);
      pdf.setDrawColor(200);
      pdf.line(15, y, 195, y);
      y += 8;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text('Documento generado automáticamente por el Sistema de Gestión INCOMAR.', 15, y);
      pdf.text('Uso interno - Información confidencial.', 15, y + 6);

      pdf.save(`Ficha_Lote_${padre.codigo_lote}.pdf`);
    } finally {
      setGenerandoPDFLoteId(null);
    }
  };

  /* ==========================================================
     PDF GENERAL - TODAS LAS LÍNEAS (presentaciones) AGRUPADAS POR ESPECIE
  ========================================================== */

  const generarPDFGeneral = async () => {
    try {
      setGenerandoPDFGeneral(true);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const AZUL: [number, number, number] = [37, 99, 235];
      const MORADO: [number, number, number] = [124, 58, 237];
      const VERDE: [number, number, number] = [22, 163, 74];
      const GRIS: [number, number, number] = [107, 114, 128];
      const BORDE: [number, number, number] = [220, 220, 220];
      const FONDO: [number, number, number] = [245, 247, 250];
      const PAGE_W = 297;
      const MARGIN = 12;

      const codigoPadrePorId = new Map(lotes.map((l) => [l.id, l.codigo_lote]));

      const { data: detalleTodos, error: errDetalle } = await supabase
        .from('detalle_lote')
        .select('lote_id, rack_id, kilos, cajas, racks:rack_id ( codigo, bodega )');
      if (errDetalle) console.error(errDetalle);
      const detalle = detalleTodos ?? [];

      const { data: camaraTodos, error: errCamara } = await supabase
        .from('detalle_camara')
        .select('lote_id, kilos, cajas, camaras ( nombre, tipo )');
      if (errCamara) console.error(errCamara);
      const enCamara = camaraTodos ?? [];

      const camaraPorLote = new Map<
        string,
        { kilos: number; kilosPAC: number; kilosNoPAC: number; cajas: number }
      >();
      let cajasCamaraGeneral = 0;
      enCamara.forEach((c: any) => {
        const actual = camaraPorLote.get(c.lote_id) ?? { kilos: 0, kilosPAC: 0, kilosNoPAC: 0, cajas: 0 };
        const kg = Number(c.kilos) || 0;
        const cj = Number(c.cajas) || 0;
        actual.kilos += kg;
        actual.cajas += cj;
        if (c.camaras?.tipo === 'PAC') actual.kilosPAC += kg;
        else if (c.camaras?.tipo === 'NO_PAC') actual.kilosNoPAC += kg;
        camaraPorLote.set(c.lote_id, actual);
        cajasCamaraGeneral += cj;
      });

      const infoPorLote = new Map<string, { kilosAsignados: number; racks: string[]; bodegas: Set<string> }>();
      detalle.forEach((d: any) => {
        const actual = infoPorLote.get(d.lote_id) ?? { kilosAsignados: 0, racks: [], bodegas: new Set<string>() };
        actual.kilosAsignados += Number(d.kilos) || 0;
        if (d.racks?.codigo) actual.racks.push(d.racks.codigo);
        if (d.racks?.bodega) actual.bodegas.add(d.racks.bodega);
        infoPorLote.set(d.lote_id, actual);
      });

      const estadoBodegaLote = (loteId: string) => {
        const info = infoPorLote.get(loteId);
        if (!info || info.bodegas.size === 0) return 'SIN_ASIGNAR';
        if (info.bodegas.has('PAC') && info.bodegas.has('NO_PAC')) return 'MIXTO';
        if (info.bodegas.has('PAC')) return 'PAC';
        if (info.bodegas.has('NO_PAC')) return 'NO_PAC';
        return 'SIN_ASIGNAR';
      };
      const bodegaLabelLote = (estado: string) => {
        if (estado === 'PAC') return 'PAC';
        if (estado === 'NO_PAC') return 'NO PAC';
        if (estado === 'MIXTO') return 'PAC + NO PAC';
        return 'Sin asignar';
      };

      // Agrupar por especie usando SOLO líneas reales (evita duplicar el padre + sus hijos)
      const gruposPorEspecie = new Map<string, Lote[]>();
      lineasTodas.forEach((l) => {
        const nombreEspecie = l.especie?.nombre ?? 'Sin especie';
        const actual = gruposPorEspecie.get(nombreEspecie) ?? [];
        actual.push(l);
        gruposPorEspecie.set(nombreEspecie, actual);
      });
      const especiesOrdenadas = Array.from(gruposPorEspecie.keys()).sort((a, b) => a.localeCompare(b));

      let totalKilosGeneral = 0;
      let totalCajasGeneral = 0;
      let kilosPACGeneral = 0;
      let kilosNoPACGeneral = 0;
      let kilosSinAsignarGeneral = 0;
      let kilosCamaraPACGeneral = 0;
      let kilosCamaraNoPACGeneral = 0;

      lineasTodas.forEach((l) => {
        const kilos = Number(l.kilos_netos) || 0;
        totalKilosGeneral += kilos;
        totalCajasGeneral += Number(l.cantidad_cajas) || 0;

        const info = infoPorLote.get(l.id);
        const camara = camaraPorLote.get(l.id);
        const asignados = (info?.kilosAsignados ?? 0) + (camara?.kilos ?? 0);
        const sinAsignar = Math.max(kilos - asignados, 0);
        kilosSinAsignarGeneral += sinAsignar;
        kilosCamaraPACGeneral += camara?.kilosPAC ?? 0;
        kilosCamaraNoPACGeneral += camara?.kilosNoPAC ?? 0;

        detalle
          .filter((d: any) => d.lote_id === l.id)
          .forEach((d: any) => {
            const kg = Number(d.kilos) || 0;
            if (d.racks?.bodega === 'PAC') kilosPACGeneral += kg;
            else if (d.racks?.bodega === 'NO_PAC') kilosNoPACGeneral += kg;
          });
      });

      // ---- Encabezado ----
      pdf.setFillColor(...AZUL);
      pdf.rect(0, 0, PAGE_W, 32, 'F');
      pdf.addImage(logoIncomar, 'PNG', 10, 5, 20, 20);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('REPORTE GENERAL DE LOTES', 36, 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Sistema de Gestión INCOMAR — Panorama de inventario por especie y bodega', 36, 21);
      pdf.setFontSize(9);
      pdf.text(`Emitido: ${new Date().toLocaleString('es-CL')}`, 36, 27);

      let y = 40;
      const checkPageBreak = (alturaNecesaria: number) => {
        if (y + alturaNecesaria > 195) {
          pdf.addPage();
          y = 15;
        }
      };
      const tituloSeccion = (titulo: string, color: [number, number, number] = AZUL) => {
        checkPageBreak(14);
        pdf.setFillColor(...FONDO);
        pdf.setDrawColor(...BORDE);
        pdf.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 9, 2, 2, 'FD');
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(titulo, MARGIN + 4, y + 6.2);
        y += 14;
      };

      // ---- Resumen general ----
      tituloSeccion('RESUMEN GENERAL');
      autoTable(pdf, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [[
          'Total Líneas', 'Total Kilos', 'Total Cajas', 'Kilos en Bodega PAC',
          'Kilos en Bodega NO PAC', 'Kilos en Cámara PAC', 'Kilos en Cámara NO PAC',
          'Cajas en Cámara', 'Kilos sin ubicación',
        ]],
        body: [[
          String(lineasTodas.length),
          `${totalKilosGeneral.toLocaleString()} kg`,
          String(totalCajasGeneral),
          `${kilosPACGeneral.toLocaleString()} kg`,
          `${kilosNoPACGeneral.toLocaleString()} kg`,
          `${kilosCamaraPACGeneral.toLocaleString()} kg`,
          `${kilosCamaraNoPACGeneral.toLocaleString()} kg`,
          String(cajasCamaraGeneral),
          `${kilosSinAsignarGeneral.toLocaleString()} kg`,
        ]],
        headStyles: { fillColor: AZUL },
        styles: { fontSize: 9, halign: 'center' },
        alternateRowStyles: { fillColor: FONDO },
      });
      y = (pdf as any).lastAutoTable.finalY + 10;

      // ---- Una sección por especie ----
      especiesOrdenadas.forEach((nombreEspecie) => {
        const lineasEspecie = gruposPorEspecie.get(nombreEspecie)!;

        const kilosEspecie = lineasEspecie.reduce((sum, l) => sum + (Number(l.kilos_netos) || 0), 0);
        const cajasEspecie = lineasEspecie.reduce((sum, l) => sum + (Number(l.cantidad_cajas) || 0), 0);

        let kilosPACEspecie = 0;
        let kilosNoPACEspecie = 0;
        lineasEspecie.forEach((l) => {
          detalle
            .filter((d: any) => d.lote_id === l.id)
            .forEach((d: any) => {
              const kg = Number(d.kilos) || 0;
              if (d.racks?.bodega === 'PAC') kilosPACEspecie += kg;
              else if (d.racks?.bodega === 'NO_PAC') kilosNoPACEspecie += kg;
            });
        });

        checkPageBreak(20);
        tituloSeccion(
          `ESPECIE: ${nombreEspecie.toUpperCase()}  —  ${lineasEspecie.length} línea(s)  ·  ${kilosEspecie.toLocaleString()} kg  ·  ${cajasEspecie} caja(s)  ·  PAC: ${kilosPACEspecie.toLocaleString()} kg  ·  NO PAC: ${kilosNoPACEspecie.toLocaleString()} kg`,
          MORADO
        );

        autoTable(pdf, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [[
            'Lote', 'Lote Padre', 'Presentación', 'Planta', 'Fecha Producción',
            'Estado', 'Kilos', 'Cajas', 'Racks asignados', 'Bodega', 'En cámara',
          ]],
          body: lineasEspecie
            .slice()
            .sort((a, b) => a.codigo_lote.localeCompare(b.codigo_lote))
            .map((l) => {
              const info = infoPorLote.get(l.id);
              const camara = camaraPorLote.get(l.id);
              const estadoBodega = estadoBodegaLote(l.id);

              const partesCamara: string[] = [];
              if (camara?.kilosPAC) partesCamara.push(`PAC ${camara.kilosPAC.toLocaleString()} kg`);
              if (camara?.kilosNoPAC) partesCamara.push(`NO PAC ${camara.kilosNoPAC.toLocaleString()} kg`);
              if (camara?.cajas) partesCamara.push(`${camara.cajas} cajas`);

              return [
                l.codigo_lote,
                l.lote_padre_id ? (codigoPadrePorId.get(l.lote_padre_id) ?? '-') : '-',
                l.presentacion?.nombre ?? '-',
                l.planta?.nombre ?? '-',
                formatDate(l.fecha_produccion),
                l.estado_producto?.nombre ?? '-',
                `${(Number(l.kilos_netos) || 0).toLocaleString()} kg`,
                String(l.cantidad_cajas ?? '-'),
                info && info.racks.length > 0 ? Array.from(new Set(info.racks)).join(', ') : (camara ? '-' : 'Sin asignar'),
                estadoBodega === 'SIN_ASIGNAR' && camara ? 'Solo en cámara' : bodegaLabelLote(estadoBodega),
                partesCamara.length > 0 ? partesCamara.join(' / ') : '-',
              ];
            }),
          headStyles: { fillColor: VERDE },
          styles: { fontSize: 8 },
          alternateRowStyles: { fillColor: FONDO },
          columnStyles: { 6: { halign: 'right' }, 7: { halign: 'right' } },
        });

        y = (pdf as any).lastAutoTable.finalY + 10;
      });

      // ---- Pie ----
      checkPageBreak(16);
      pdf.setDrawColor(200);
      pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 7;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(...GRIS);
      pdf.text(
        'Documento generado automáticamente por el Sistema de Gestión INCOMAR. Uso interno - Información confidencial.',
        MARGIN,
        y
      );

      pdf.save(`Reporte_General_Lotes_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerandoPDFGeneral(false);
    }
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  async function cargarLotes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lotes')
        .select(`
          *,
          especie:especie_id ( nombre ),
          presentacion:presentacion_id ( nombre ),
          planta:planta_id ( nombre ),
          estado_producto:estado_producto_id ( nombre )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setLotes(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  // Las foreign keys de movimientos/detalle_lote/etiquetas/control_calidad/procesamientos
  // tienen ON DELETE CASCADE o SET NULL hacia lotes, así que al eliminar cada línea
  // (padre e hijos) se limpia automáticamente todo lo asociado a ella.
  async function confirmarEliminarGrupo() {
    if (!grupoEliminar) return;

    try {
      setEliminando(true);
      const idsHijos = grupoEliminar.hijos.map((h) => h.id);

      if (idsHijos.length > 0) {
        const { error: errorHijos } = await supabase.from('lotes').delete().in('id', idsHijos);
        if (errorHijos) {
          console.error(errorHijos);
          alert('Error eliminando las presentaciones del lote');
          return;
        }
      }

      const { error } = await supabase.from('lotes').delete().eq('id', grupoEliminar.padre.id);
      if (error) {
        console.error(error);
        alert('Error eliminando el lote');
        return;
      }

      setGrupoEliminar(null);
      cargarLotes();
    } finally {
      setEliminando(false);
    }
  }

  async function eliminarLinea(linea: Lote) {
    if (!confirm(`¿Eliminar la presentación "${linea.presentacion?.nombre ?? linea.codigo_lote}"? Esta acción es permanente.`))
      return;

    const { error } = await supabase.from('lotes').delete().eq('id', linea.id);
    if (error) {
      console.error(error);
      alert('Error eliminando la presentación');
      return;
    }
    cargarLotes();
  }

  const getEstadoBadge = (estado?: string) => {
    const nombre = estado?.toLowerCase() ?? '';
    if (nombre.includes('activo')) return 'bg-blue-100 text-blue-700';
    if (nombre.includes('proces')) return 'bg-yellow-100 text-yellow-700';
    if (nombre.includes('despach')) return 'bg-gray-100 text-gray-700';
    return 'bg-green-100 text-green-700';
  };

  const renderBadgeEstadoGrupo = (estados: string[]) => {
    if (estados.length === 0)
      return <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500">Sin estado</span>;
    if (estados.length === 1)
      return <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(estados[0])}`}>{estados[0]}</span>;
    return (
      <span
        className="px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700"
        title={estados.join(', ')}
      >
        Mixto
      </span>
    );
  };

  const canRegister = user?.rol === 'administrador' || user?.rol === 'supervisor';

  // Estadísticas por línea (presentación) para reflejar el estado real de proceso
  const totalActivos = lineasTodas.filter((l) => l.estado_producto?.nombre?.toLowerCase().includes('activo')).length;
  const totalProcesando = lineasTodas.filter((l) => l.estado_producto?.nombre?.toLowerCase().includes('procesando')).length;
  const totalProcesados = lineasTodas.filter((l) => l.estado_producto?.nombre?.toLowerCase().includes('procesado')).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Lotes</h1>
          <p className="text-gray-600">Control y trazabilidad de lotes de producción</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generarPDFGeneral}
            disabled={generandoPDFGeneral || lotes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Genera un PDF con todas las presentaciones agrupadas por especie, con su estado de bodega (PAC / NO PAC)"
          >
            <FileDown className="w-5 h-5" />
            {generandoPDFGeneral ? 'Generando...' : 'Generar PDF General'}
          </button>

          {canRegister && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setLoteEditar(null);
                setMostrarModal(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Nuevo Lote
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote, presentación o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltros((v) => !v)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {mostrarFiltros && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lote</label>
              <input
                type="text"
                value={filtros.codigo_lote}
                onChange={(e) => actualizarFiltro('codigo_lote', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Producto</label>
              <input
                type="text"
                value={filtros.especie}
                onChange={(e) => actualizarFiltro('especie', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Planta</label>
              <input
                type="text"
                value={filtros.planta}
                onChange={(e) => actualizarFiltro('planta', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => actualizarFiltro('estado', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="procesando">Procesando</option>
                <option value="procesado">Procesado</option>
                <option value="despachado">Despachado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Kilos (mín - máx)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filtros.kilosMin}
                  onChange={(e) => actualizarFiltro('kilosMin', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="Mín"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={filtros.kilosMax}
                  onChange={(e) => actualizarFiltro('kilosMax', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="Máx"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Fecha de producción</label>
              <div className="flex flex-wrap gap-1.5">
                {OPCIONES_FECHA.map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => actualizarFiltro('fecha', opcion.valor)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      filtros.fecha === opcion.valor
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Año</label>
              <select
                value={filtros.anio}
                onChange={(e) => actualizarFiltro('anio', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Todos los años</option>
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mb-2 text-sm text-gray-500">
          Mostrando {gruposFiltrados.length} de {grupos.length} lotes
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-gray-700">Planta</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha Producción</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.map((grupo) => {
                const { kilosTotal, estados, presentaciones } = resumenGrupo(grupo);
                const { padre } = grupo;

                return (
                  <tr key={padre.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-gray-900">{padre.codigo_lote}</div>
                          {presentaciones.length > 1 && (
                            <div className="text-xs text-gray-400">{presentaciones.length} presentaciones</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{padre.especie?.nombre}</td>
                    <td className="py-3 px-4 text-gray-600">{padre.planta?.nombre}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(padre.fecha_produccion)}</td>
                    <td className="py-3 px-4 text-gray-900">{kilosTotal.toLocaleString()} kg</td>
                    <td className="py-3 px-4">{renderBadgeEstadoGrupo(estados)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setGrupoDetalle(grupo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles por presentación"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => descargarPDFGrupo(grupo)}
                          disabled={generandoPDFLoteId === padre.id}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Descargar ficha PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        {canRegister && (
                          <>
                            <button
                              onClick={() => {
                                setLoteEditar(padre);
                                setMostrarModal(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setGrupoEliminar(grupo)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {gruposFiltrados.length === 0 && (
          <div className="text-center py-12">
            <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron lotes</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Lotes</p>
          <p className="text-gray-900">{grupos.length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Presentaciones activas</p>
          <p className="text-blue-700">{totalActivos}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Procesando</p>
          <p className="text-yellow-700">{totalProcesando}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Procesados</p>
          <p className="text-green-700">{totalProcesados}</p>
        </div>
      </div>

      {/* ================= DETALLE DEL LOTE, POR PRESENTACIÓN ================= */}
      {grupoDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Lote {grupoDetalle.padre.codigo_lote}</h2>
              <button onClick={() => setGrupoDetalle(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Producto</p>
                <p>{grupoDetalle.padre.especie?.nombre ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Planta</p>
                <p>{grupoDetalle.padre.planta?.nombre ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha producción</p>
                <p>{formatDate(grupoDetalle.padre.fecha_produccion)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha vencimiento</p>
                <p>{grupoDetalle.padre.fecha_vencimiento ? formatDate(grupoDetalle.padre.fecha_vencimiento) : '-'}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">Presentaciones</h3>

            <div className="space-y-4">
              {obtenerLineas(grupoDetalle).map((linea) => {
                const detalle = detalleLineas[linea.id] ?? { racks: [], camaras: [] };
                return (
                  <div key={linea.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                          {linea.presentacion?.nombre ?? 'Sin presentación'}
                        </span>
                        <span className="text-sm text-gray-400">{linea.codigo_lote}</span>
                        <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(linea.estado_producto?.nombre)}`}>
                          {linea.estado_producto?.nombre ?? '-'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLoteMoverCamara(linea)}
                          className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Trasladar a cámara"
                        >
                          <Snowflake className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLoteAsignar(linea)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Asignar a rack"
                        >
                          <Warehouse className="w-4 h-4" />
                        </button>
                        {canRegister && (
                          <>
                            <button
                              onClick={() => {
                                setLoteEditar(linea);
                                setMostrarModal(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Editar presentación"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarLinea(linea)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar presentación"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Kilos</p>
                        <p>{linea.kilos_netos ?? 0} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cajas</p>
                        <p>{linea.cantidad_cajas ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Temperatura</p>
                        <p>{linea.temperatura ?? '-'} °C</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Observaciones</p>
                        <p className="truncate" title={linea.observaciones ?? ''}>{linea.observaciones || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Racks asignados</p>
                        {detalle.racks.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {detalle.racks.map((r: any, i: number) => (
                              <li key={i} className="flex justify-between text-gray-700">
                                <span>{r.racks?.codigo ?? 'Sin registrar'} ({r.racks?.ubicacion ?? '-'})</span>
                                <span>{(r.kilos ?? 0).toLocaleString()} kg</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400">Sin racks asignados</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ubicación en cámara</p>
                        {detalle.camaras.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {detalle.camaras.map((c: any, i: number) => (
                              <li key={i} className="flex justify-between text-gray-700">
                                <span>{c.camaras?.nombre ?? '-'} ({c.camaras?.tipo === 'NO_PAC' ? 'NO PAC' : c.camaras?.tipo})</span>
                                <span>
                                  {(Number(c.kilos) || 0).toLocaleString()} kg
                                  {c.cajas != null ? ` · ${c.cajas} cajas` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400">No está en ninguna cámara</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => descargarPDFGrupo(grupoDetalle)}
                disabled={generandoPDFLoteId === grupoDetalle.padre.id}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generandoPDFLoteId === grupoDetalle.padre.id ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button onClick={() => setGrupoDetalle(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <LoteModal
          lote={loteEditar}
          onClose={() => {
            setMostrarModal(false);
            setLoteEditar(null);
          }}
          onSuccess={() => {
            cargarLotes();
          }}
        />
      )}

      {loteMoverCamara && (
        <MoverACamaraModal
          lote={loteMoverCamara}
          onClose={() => setLoteMoverCamara(null)}
          onSuccess={() => {
            cargarLotes();
          }}
        />
      )}

      {loteAsignar && (
        <AsignarRackModal
          lote={loteAsignar}
          onClose={() => setLoteAsignar(null)}
          onSuccess={() => {
            cargarLotes();
          }}
        />
      )}

      {grupoEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">¿Eliminar este lote?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Estás a punto de eliminar el lote{' '}
                    <span className="font-semibold text-gray-900">{grupoEliminar.padre.codigo_lote}</span>
                    {grupoEliminar.hijos.length > 0 && (
                      <>
                        {' '}y sus <span className="font-semibold">{grupoEliminar.hijos.length}</span> presentaciones asociadas
                      </>
                    )}
                    . Esta acción es <span className="font-semibold">permanente</span> y también eliminará todo su
                    historial de movimientos, asignaciones de rack, cámaras, etiquetas, control de calidad y
                    procesamientos asociados. Las guías vinculadas quedarán sin lote asignado.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setGrupoEliminar(null)}
                disabled={eliminando}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarGrupo}
                disabled={eliminando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}