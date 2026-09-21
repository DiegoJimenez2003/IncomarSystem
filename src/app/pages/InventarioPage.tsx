import { useEffect, useMemo, useState } from 'react';
import { Search, Package, Warehouse, FileDown, Snowflake } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIncomar from "../../assets/logo_sin_nombre.png";

// Una fila de inventario, venga de un rack (detalle_lote) o de una cámara (detalle_camara)
interface ItemInventario {
  key: string;
  origen: 'rack' | 'camara';
  lote_id: string | null;
  codigo_lote: string;
  producto: string;
  presentacion: string;
  ubicacion: string; // código del rack o nombre de la cámara
  rack_id: string | null;
  camara_id: string | null;
  tipo: string | null; // 'PAC' | 'NO_PAC'
  kilos: number;
  cajas: number | null; // las cámaras no registran cajas
  fecha_ingreso: string | null;
}

type FiltroTipo = 'todos' | 'PAC' | 'NO_PAC';

const tipoLabel = (tipo: string | null | undefined) => {
  if (tipo === 'PAC') return 'PAC';
  if (tipo === 'NO_PAC') return 'NO PAC';
  return 'Sin definir';
};

const tipoBadgeClass = (tipo: string | null | undefined) => {
  if (tipo === 'PAC') return 'bg-blue-100 text-blue-700';
  if (tipo === 'NO_PAC') return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-600';
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
};

export function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todos'); // 'todos' | 'rack:<id>' | 'camara:<id>'
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [detalleRacks, setDetalleRacks] = useState<any[]>([]);
  const [detalleCamaras, setDetalleCamaras] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [camaras, setCamaras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    const [racksDetalleRes, camarasDetalleRes, racksRes, camarasRes] = await Promise.all([
      supabase
        .from('detalle_lote')
        .select(`
          id,
          kilos,
          cajas,
          fecha_ingreso,
          rack_id,
          lote_id,
          lotes (
            id,
            codigo_lote,
            especies ( nombre ),
            presentaciones ( nombre )
          ),
          racks (
            id,
            codigo,
            ubicacion,
            capacidad_kg,
            bodega
          )
        `)
        .order('fecha_ingreso', { ascending: false }),

      supabase
        .from('detalle_camara')
        .select(`
          id,
          kilos,
          fecha_ingreso,
          lote_id,
          camara_id,
          lotes (
            id,
            codigo_lote,
            especies ( nombre ),
            presentaciones ( nombre )
          ),
          camaras ( id, nombre, tipo )
        `)
        .order('fecha_ingreso', { ascending: false }),

      supabase
        .from('racks')
        .select('id, codigo, ubicacion, capacidad_kg, bodega')
        .order('codigo'),

      supabase
        .from('camaras')
        .select('id, nombre, tipo')
        .order('tipo'),
    ]);

    if (racksDetalleRes.error) console.error(racksDetalleRes.error);
    else setDetalleRacks(racksDetalleRes.data ?? []);

    if (camarasDetalleRes.error) console.error(camarasDetalleRes.error);
    else setDetalleCamaras(camarasDetalleRes.data ?? []);

    if (racksRes.error) console.error(racksRes.error);
    else setRacks(racksRes.data ?? []);

    if (camarasRes.error) console.error(camarasRes.error);
    else setCamaras(camarasRes.data ?? []);

    setLoading(false);
  }

  // ======================================================
  // INVENTARIO UNIFICADO (racks + cámaras)
  // ======================================================

  const items = useMemo<ItemInventario[]>(() => {
    const desdeRacks: ItemInventario[] = detalleRacks.map((d) => ({
      key: `rack-${d.id}`,
      origen: 'rack',
      lote_id: d.lote_id ?? null,
      codigo_lote: d.lotes?.codigo_lote ?? '-',
      producto: d.lotes?.especies?.nombre ?? '-',
      presentacion: d.lotes?.presentaciones?.nombre ?? '-',
      ubicacion: d.racks?.codigo ?? '-',
      rack_id: d.rack_id ?? null,
      camara_id: null,
      tipo: d.racks?.bodega ?? null,
      kilos: Number(d.kilos) || 0,
      cajas: Number(d.cajas) || 0,
      fecha_ingreso: d.fecha_ingreso ?? null,
    }));

    const desdeCamaras: ItemInventario[] = detalleCamaras.map((d) => ({
      key: `camara-${d.id}`,
      origen: 'camara',
      lote_id: d.lote_id ?? null,
      codigo_lote: d.lotes?.codigo_lote ?? '-',
      producto: d.lotes?.especies?.nombre ?? '-',
      presentacion: d.lotes?.presentaciones?.nombre ?? '-',
      ubicacion: d.camaras?.nombre ?? '-',
      rack_id: null,
      camara_id: d.camara_id ?? null,
      tipo: d.camaras?.tipo ?? null,
      kilos: Number(d.kilos) || 0,
      cajas: null,
      fecha_ingreso: d.fecha_ingreso ?? null,
    }));

    return [...desdeRacks, ...desdeCamaras].sort(
      (a, b) =>
        new Date(b.fecha_ingreso ?? 0).getTime() -
        new Date(a.fecha_ingreso ?? 0).getTime()
    );
  }, [detalleRacks, detalleCamaras]);

  const itemsFiltrados = items.filter((item) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      item.codigo_lote.toLowerCase().includes(term) ||
      item.producto.toLowerCase().includes(term) ||
      item.ubicacion.toLowerCase().includes(term);

    const matchesUbicacion =
      filtroUbicacion === 'todos' ||
      filtroUbicacion === `rack:${item.rack_id}` ||
      filtroUbicacion === `camara:${item.camara_id}`;

    const matchesTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;

    return matchesSearch && matchesUbicacion && matchesTipo;
  });

  // ======================================================
  // TOTALES
  // ======================================================

  const totalKilos = itemsFiltrados.reduce((sum, i) => sum + i.kilos, 0);
  const kilosEnRacks = itemsFiltrados
    .filter((i) => i.origen === 'rack')
    .reduce((sum, i) => sum + i.kilos, 0);
  const kilosEnCamaras = itemsFiltrados
    .filter((i) => i.origen === 'camara')
    .reduce((sum, i) => sum + i.kilos, 0);
  const totalCajas = itemsFiltrados.reduce((sum, i) => sum + (i.cajas ?? 0), 0);
  const lotesEnStock = new Set(
    items.map((i) => i.lote_id).filter(Boolean)
  ).size;

  // Resumen por rack / por cámara (siempre sobre el inventario completo)
  function resumenRack(rackId: string) {
    const enRack = items.filter((i) => i.origen === 'rack' && i.rack_id === rackId);
    return {
      kilos: enRack.reduce((sum, i) => sum + i.kilos, 0),
      cajas: enRack.reduce((sum, i) => sum + (i.cajas ?? 0), 0),
      lotes: Array.from(new Set(enRack.map((i) => i.codigo_lote).filter((c) => c !== '-'))),
    };
  }

  function resumenCamara(camaraId: string) {
    const enCamara = items.filter((i) => i.origen === 'camara' && i.camara_id === camaraId);
    return {
      kilos: enCamara.reduce((sum, i) => sum + i.kilos, 0),
      lotes: Array.from(new Set(enCamara.map((i) => i.codigo_lote).filter((c) => c !== '-'))),
    };
  }

  // ======================================================
  // PDF
  // ======================================================

  const exportarPDF = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // COLORES CORPORATIVOS
    const AZUL = [37, 99, 235];
    const MORADO = [124, 58, 237];
    const CIAN = [8, 145, 178];
    const BORDE = [220, 220, 220];
    const FONDO = [245, 247, 250];

    // FONDO ENCABEZADO
    pdf.setFillColor(AZUL[0], AZUL[1], AZUL[2]);
    pdf.rect(0, 0, 210, 35, "F");

    // LOGO
    pdf.addImage(logoIncomar, "PNG", 10, 5, 22, 22);

    // TITULO
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("REPORTE DE INVENTARIO", 40, 15);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Sistema de Gestión INCOMAR", 40, 22);

    // Texto con los filtros aplicados
    let ubicacionFiltrada = '';
    if (filtroUbicacion.startsWith('rack:')) {
      const rack = racks.find((r) => 'rack:' + r.id === filtroUbicacion);
      ubicacionFiltrada = `Rack ${rack?.codigo ?? ''}`;
    } else if (filtroUbicacion.startsWith('camara:')) {
      const camara = camaras.find((c) => 'camara:' + c.id === filtroUbicacion);
      ubicacionFiltrada = camara?.nombre ?? '';
    }
    const partesFiltro = [
      ubicacionFiltrada,
      filtroTipo !== 'todos' ? `Cámara ${tipoLabel(filtroTipo)}` : '',
    ].filter(Boolean);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(
      partesFiltro.length > 0
        ? `Filtro: ${partesFiltro.join(' · ')}`
        : "Racks y cámaras",
      40,
      29
    );

    pdf.setFontSize(9);
    pdf.text(`Emitido: ${new Date().toLocaleString("es-CL")}`, 145, 28);

    let y = 45;

    const tituloSeccion = (titulo: string, color = AZUL) => {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFillColor(FONDO[0], FONDO[1], FONDO[2]);
      pdf.setDrawColor(BORDE[0], BORDE[1], BORDE[2]);
      pdf.roundedRect(12, y, 186, 10, 2, 2, "FD");

      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(titulo, 18, y + 6.5);

      y += 15;
    };

    // RESUMEN GENERAL
    tituloSeccion("RESUMEN GENERAL");

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Total Kilos:", 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${totalKilos.toLocaleString()} kg`, 52, y);

    pdf.setFont("helvetica", "bold");
    pdf.text("Total Cajas:", 112, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(totalCajas), 152, y);

    y += 8;

    pdf.setFont("helvetica", "bold");
    pdf.text("Kilos en Racks:", 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${kilosEnRacks.toLocaleString()} kg`, 52, y);

    pdf.setFont("helvetica", "bold");
    pdf.text("Kilos en Cámaras:", 112, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${kilosEnCamaras.toLocaleString()} kg`, 152, y);

    y += 8;

    pdf.setFont("helvetica", "bold");
    pdf.text("Lotes en Stock:", 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(lotesEnStock), 52, y);

    y += 13;

    // DETALLE DE INVENTARIO
    tituloSeccion("DETALLE DE INVENTARIO");

    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [["Lote", "Producto", "Ubicación", "Cámara", "Tipo Parte", "Cajas", "Kilos", "Fecha Ingreso"]],
      body: itemsFiltrados.map((item) => [
        item.codigo_lote,
        item.producto,
        item.ubicacion,
        tipoLabel(item.tipo),
        item.presentacion,
        item.cajas === null ? "-" : String(item.cajas),
        `${item.kilos.toLocaleString()} kg`,
        formatDate(item.fecha_ingreso),
      ]),
      headStyles: { fillColor: AZUL as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // RESUMEN POR RACK
    tituloSeccion("RESUMEN POR RACK", MORADO);

    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [["Rack", "Ubicación", "Cámara", "Cajas", "Kilos", "Capacidad (kg)", "Lotes"]],
      body: racks.map((rack) => {
        const r = resumenRack(rack.id);
        return [
          rack.codigo,
          rack.ubicacion ?? "-",
          tipoLabel(rack.bodega),
          String(r.cajas),
          `${r.kilos.toLocaleString()} kg`,
          rack.capacidad_kg ? `${Number(rack.capacidad_kg).toLocaleString()} kg` : "-",
          r.lotes.length > 0 ? r.lotes.join(", ") : "-",
        ];
      }),
      headStyles: { fillColor: MORADO as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // RESUMEN POR CÁMARA
    tituloSeccion("RESUMEN POR CÁMARA", CIAN);

    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [["Cámara", "Tipo", "Kilos", "Lotes"]],
      body: camaras.map((camara) => {
        const r = resumenCamara(camara.id);
        return [
          camara.nombre,
          tipoLabel(camara.tipo),
          `${r.kilos.toLocaleString()} kg`,
          r.lotes.length > 0 ? r.lotes.join(", ") : "-",
        ];
      }),
      headStyles: { fillColor: CIAN as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });

    // PIE DE DOCUMENTO
    let finalY = (pdf as any).lastAutoTable.finalY + 10;

    if (finalY > 265) {
      pdf.addPage();
      finalY = 20;
    }

    pdf.setDrawColor(200);
    pdf.line(15, finalY, 195, finalY);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(
      "Documento generado automáticamente por el Sistema de Gestión INCOMAR.",
      15,
      finalY + 8
    );
    pdf.text(
      "Uso interno - Información confidencial.",
      15,
      finalY + 14
    );

    pdf.save(`Inventario_INCOMAR_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Inventario</h1>
          <p className="text-gray-600">
            Stock actual en racks y cámaras (soporta movimientos parciales)
          </p>
        </div>

        <button
          onClick={exportarPDF}
          disabled={loading || itemsFiltrados.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          <FileDown className="w-5 h-5" />
          Generar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Kilos</p>
          <p className="text-gray-900">{totalKilos.toLocaleString()} kg</p>
          <p className="text-xs text-gray-500 mt-1">
            Racks: {kilosEnRacks.toLocaleString()} kg · Cámaras:{' '}
            {kilosEnCamaras.toLocaleString()} kg
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Cajas</p>
          <p className="text-gray-900">{totalCajas}</p>
          <p className="text-xs text-gray-500 mt-1">Solo cuenta lo que está en racks</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Lotes en Stock</p>
          <p className="text-gray-900">{lotesEnStock}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote, producto, rack o cámara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Cámara PAC y NO PAC</option>
            <option value="PAC">Solo Cámara PAC</option>
            <option value="NO_PAC">Solo Cámara NO PAC</option>
          </select>

          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todas las ubicaciones</option>
            <optgroup label="Cámaras">
              {camaras.map((camara) => (
                <option key={camara.id} value={`camara:${camara.id}`}>
                  {camara.nombre} ({tipoLabel(camara.tipo)})
                </option>
              ))}
            </optgroup>
            <optgroup label="Racks">
              {racks.map((rack) => (
                <option key={rack.id} value={`rack:${rack.id}`}>
                  {rack.codigo} - {rack.ubicacion} ({tipoLabel(rack.bodega)})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando inventario...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Lote</th>
                  <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                  <th className="text-left py-3 px-4 text-gray-700">Ubicación</th>
                  <th className="text-left py-3 px-4 text-gray-700">Cámara</th>
                  <th className="text-left py-3 px-4 text-gray-700">Tipo Parte</th>
                  <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                  <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                  <th className="text-left py-3 px-4 text-gray-700">Fecha Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr key={item.key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{item.codigo_lote}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{item.producto}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.origen === 'camara' ? (
                          <Snowflake className="w-4 h-4 text-cyan-600" />
                        ) : (
                          <Warehouse className="w-4 h-4 text-purple-600" />
                        )}
                        <span className="text-gray-900">{item.ubicacion}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${tipoBadgeClass(item.tipo)}`}
                      >
                        {tipoLabel(item.tipo)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.presentacion}</td>
                    <td className="py-3 px-4 text-gray-900">{item.cajas ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.kilos.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(item.fecha_ingreso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {itemsFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron items en inventario</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Inventario por Cámara</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camaras.map((camara) => {
            const r = resumenCamara(camara.id);

            return (
              <div key={camara.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Snowflake
                      className={`w-5 h-5 ${
                        camara.tipo === 'PAC' ? 'text-blue-600' : 'text-cyan-600'
                      }`}
                    />
                    <h3 className="text-gray-900">{camara.nombre}</h3>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${tipoBadgeClass(camara.tipo)}`}
                  >
                    {tipoLabel(camara.tipo)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kilos:</span>
                    <span className="text-gray-900">{r.kilos.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lotes distintos:</span>
                    <span className="text-gray-900">{r.lotes.length}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 shrink-0">Lotes:</span>
                    <span className="text-gray-900 text-right">
                      {r.lotes.length > 0 ? r.lotes.join(", ") : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Inventario por Rack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {racks.map((rack) => {
            const r = resumenRack(rack.id);

            return (
              <div key={rack.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <h3 className="text-gray-900">{rack.codigo}</h3>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${tipoBadgeClass(rack.bodega)}`}
                  >
                    {tipoLabel(rack.bodega)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cajas:</span>
                    <span className="text-gray-900">{r.cajas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kilos:</span>
                    <span className="text-gray-900">
                      {r.kilos.toLocaleString()} / {rack.capacidad_kg ? Number(rack.capacidad_kg).toLocaleString() : '-'} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 shrink-0">Lotes:</span>
                    <span className="text-gray-900 text-right">
                      {r.lotes.length > 0 ? r.lotes.join(", ") : '-'}
                    </span>
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