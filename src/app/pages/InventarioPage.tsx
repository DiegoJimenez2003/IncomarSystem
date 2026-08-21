import { useEffect, useState } from 'react';
import { Search, Package, Warehouse, FileDown } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIncomar from "../../assets/logo_sin_nombre.png";

export function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRack, setFiltroRack] = useState<string>('todos');
  const [inventario, setInventario] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    const [inventarioRes, racksRes] = await Promise.all([
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
        .from('racks')
        .select('id, codigo, ubicacion, capacidad_kg, bodega')
        .order('codigo'),
    ]);

    if (inventarioRes.error) {
      console.error(inventarioRes.error);
    } else {
      setInventario(inventarioRes.data ?? []);
    }

    if (racksRes.error) {
      console.error(racksRes.error);
    } else {
      setRacks(racksRes.data ?? []);
    }

    setLoading(false);
  }

  const inventarioFiltrado = inventario.filter((item) => {
    const term = searchTerm.toLowerCase();

    const loteCodigo = item.lotes?.codigo_lote?.toLowerCase() ?? '';
    const productoNombre = item.lotes?.especies?.nombre?.toLowerCase() ?? '';
    const rackCodigo = item.racks?.codigo?.toLowerCase() ?? '';

    const matchesSearch =
      loteCodigo.includes(term) ||
      productoNombre.includes(term) ||
      rackCodigo.includes(term);

    const matchesRack = filtroRack === 'todos' || item.rack_id === filtroRack;

    return matchesSearch && matchesRack;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const bodegaLabel = (bodega: string | null | undefined) => {
    if (bodega === 'PAC') return 'PAC';
    if (bodega === 'NO_PAC') return 'NO PAC';
    return 'Sin bodega';
  };

  const bodegaBadgeClass = (bodega: string | null | undefined) => {
    if (bodega === 'PAC') return 'bg-blue-100 text-blue-700';
    if (bodega === 'NO_PAC') return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-600';
  };

  const totalKilos = inventarioFiltrado.reduce(
    (sum, item) => sum + (Number(item.kilos) || 0), 0
  );
  const totalCajas = inventarioFiltrado.reduce(
    (sum, item) => sum + (Number(item.cajas) || 0), 0
  );
  const lotesEnStock = new Set(
    inventario.map((item) => item.lote_id).filter(Boolean)
  ).size;

  const exportarPDF = () => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

    // ======================================================
    // COLORES CORPORATIVOS
    // ======================================================

    const AZUL = [37, 99, 235];
    const MORADO = [124, 58, 237];
    const BORDE = [220, 220, 220];
    const FONDO = [245, 247, 250];

    // ======================================================
    // FONDO ENCABEZADO
    // ======================================================

    pdf.setFillColor(AZUL[0], AZUL[1], AZUL[2]);
    pdf.rect(0, 0, 210, 35, "F");

    // ======================================================
    // LOGO
    // ======================================================

    pdf.addImage(logoIncomar, "PNG", 10, 5, 22, 22);

    // ======================================================
    // TITULO
    // ======================================================

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("REPORTE DE INVENTARIO", 40, 15);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Sistema de Gestión INCOMAR", 40, 22);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    const filtroTexto =
      filtroRack !== "todos"
        ? `Filtro: ${racks.find((r) => r.id === filtroRack)?.codigo ?? ""}`
        : "Todos los racks";
    pdf.text(filtroTexto, 40, 29);

    pdf.setFontSize(9);
    pdf.text(`Emitido: ${new Date().toLocaleString("es-CL")}`, 145, 28);

    // ======================================================
    // COMIENZO DEL CONTENIDO
    // ======================================================

    let y = 45;

    // ======================================================
    // FUNCIÓN PARA DIBUJAR TÍTULOS DE SECCIÓN
    // ======================================================

    const tituloSeccion = (titulo: string, color = AZUL) => {
      pdf.setFillColor(FONDO[0], FONDO[1], FONDO[2]);
      pdf.setDrawColor(BORDE[0], BORDE[1], BORDE[2]);
      pdf.roundedRect(12, y, 186, 10, 2, 2, "FD");

      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(titulo, 18, y + 6.5);

      y += 15;
    };

    // ======================================================
    // RESUMEN GENERAL
    // ======================================================

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
    pdf.text("Lotes en Stock:", 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(lotesEnStock), 52, y);

    y += 13;

    // ======================================================
    // TABLA DE INVENTARIO
    // ======================================================

    tituloSeccion("DETALLE DE INVENTARIO");

    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [["Lote", "Producto", "Rack", "Bodega", "Tipo Parte", "Cajas", "Kilos", "Fecha Ingreso"]],
      body: inventarioFiltrado.map((item) => [
        item.lotes?.codigo_lote ?? "-",
        item.lotes?.especies?.nombre ?? "-",
        item.racks?.codigo ?? "-",
        bodegaLabel(item.racks?.bodega),
        item.lotes?.presentaciones?.nombre ?? "-",
        String(item.cajas ?? 0),
        `${Number(item.kilos ?? 0).toLocaleString()} kg`,
        formatDate(item.fecha_ingreso),
      ]),
      headStyles: { fillColor: AZUL as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // ======================================================
    // RESUMEN POR RACK
    // ======================================================

    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    tituloSeccion("RESUMEN POR RACK", MORADO);

    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [["Rack", "Ubicación", "Bodega", "Cajas", "Kilos", "Capacidad (kg)", "Lotes"]],
      body: racks.map((rack) => {
        const itemsEnRack = inventario.filter((i) => i.rack_id === rack.id);
        const kilosEnRack = itemsEnRack.reduce((sum, i) => sum + (Number(i.kilos) || 0), 0);
        const cajasEnRack = itemsEnRack.reduce((sum, i) => sum + (Number(i.cajas) || 0), 0);
        const codigosLotesEnRack = Array.from(
          new Set(
            itemsEnRack
              .map((i) => i.lotes?.codigo_lote)
              .filter(Boolean)
          )
        );

        return [
          rack.codigo,
          rack.ubicacion ?? "-",
          bodegaLabel(rack.bodega),
          String(cajasEnRack),
          `${kilosEnRack.toLocaleString()} kg`,
          rack.capacidad_kg ? `${Number(rack.capacidad_kg).toLocaleString()} kg` : "-",
          codigosLotesEnRack.length > 0 ? codigosLotesEnRack.join(", ") : "-",
        ];
      }),
      headStyles: { fillColor: MORADO as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });

    // ======================================================
    // PIE DE DOCUMENTO
    // ======================================================

    const finalY = (pdf as any).lastAutoTable.finalY + 10;

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

    // ======================================================
    // DESCARGAR PDF
    // ======================================================

    pdf.save(`Inventario_INCOMAR_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Inventario</h1>
          <p className="text-gray-600">Stock actual en racks de almacenamiento (soporta movimientos parciales)</p>
        </div>

        <button
          onClick={exportarPDF}
          disabled={loading || inventarioFiltrado.length === 0}
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
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Cajas</p>
          <p className="text-gray-900">{totalCajas}</p>
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
              placeholder="Buscar por lote, producto o rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroRack}
            onChange={(e) => setFiltroRack(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los racks</option>
            {racks.map((rack) => (
              <option key={rack.id} value={rack.id}>
                {rack.codigo} - {rack.ubicacion} ({bodegaLabel(rack.bodega)})
              </option>
            ))}
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
                  <th className="text-left py-3 px-4 text-gray-700">Rack</th>
                  <th className="text-left py-3 px-4 text-gray-700">Bodega</th>
                  <th className="text-left py-3 px-4 text-gray-700">Tipo Parte</th>
                  <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                  <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                  <th className="text-left py-3 px-4 text-gray-700">Fecha Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {inventarioFiltrado.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{item.lotes?.codigo_lote ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.lotes?.especies?.nombre ?? '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-900">{item.racks?.codigo ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${bodegaBadgeClass(
                          item.racks?.bodega
                        )}`}
                      >
                        {bodegaLabel(item.racks?.bodega)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.lotes?.presentaciones?.nombre ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{item.cajas ?? 0}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {Number(item.kilos ?? 0).toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(item.fecha_ingreso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {inventarioFiltrado.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron items en inventario</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-gray-900 mb-4">Inventario por Rack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {racks.map((rack) => {
            const itemsEnRack = inventario.filter((i) => i.rack_id === rack.id);
            const kilosEnRack = itemsEnRack.reduce(
              (sum, i) => sum + (Number(i.kilos) || 0), 0
            );
            const cajasEnRack = itemsEnRack.reduce(
              (sum, i) => sum + (Number(i.cajas) || 0), 0
            );
            const codigosLotesEnRack = Array.from(
              new Set(
                itemsEnRack
                  .map((i) => i.lotes?.codigo_lote)
                  .filter(Boolean)
              )
            );

            return (
              <div key={rack.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <h3 className="text-gray-900">{rack.codigo}</h3>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${bodegaBadgeClass(
                      rack.bodega
                    )}`}
                  >
                    {bodegaLabel(rack.bodega)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cajas:</span>
                    <span className="text-gray-900">{cajasEnRack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kilos:</span>
                    <span className="text-gray-900">
                      {kilosEnRack.toLocaleString()} / {rack.capacidad_kg ? Number(rack.capacidad_kg).toLocaleString() : '-'} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 shrink-0">Lotes:</span>
                    <span className="text-gray-900 text-right">
                      {codigosLotesEnRack.length > 0
                        ? codigosLotesEnRack.join(", ")
                        : '-'}
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