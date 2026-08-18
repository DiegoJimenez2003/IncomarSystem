import { useEffect, useState } from 'react';
import { Search, Plus, Eye, Edit2,Trash2, PackageCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { LoteModal } from '../components/Productos/LoteModal';
import jsPDF from 'jspdf';
import { logoIncomar } from '../../utils/LogoBase64';
import { AsignarRackModal } from '../components/Productos/AsignarRackModal';
import { Warehouse } from 'lucide-react'; // agrégalo junto a los otros imports de lucide-react
import autoTable from 'jspdf-autotable';

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

  especie?: { nombre: string };
  presentacion?: { nombre: string }; // NUEVO
  planta?: { nombre: string };
  estado_producto?: { nombre: string };
}

  export function LotesPage() {
    const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [lotes, setLotes] =
    useState<Lote[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [loteEditar, setLoteEditar] =
    useState<Lote | null>(null);

    const [loteDetalle, setLoteDetalle] =
    useState<Lote | null>(null);

    const [loteAsignar, setLoteAsignar] = useState<Lote | null>(null);

  const lotesFiltrados = lotes.filter((lote) => {

  const matchesSearch =

    lote.codigo_lote
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())

    ||

    lote.especie?.nombre
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesEstado =
    filtroEstado === 'todos'
    ||
    lote.estado_producto?.nombre
      ?.toLowerCase()
      .trim() === filtroEstado;

    console.log(
      'Estado BD:',
      lote.estado_producto?.nombre,
      'Filtro:',
      filtroEstado
    );

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

  /* ==========================================================
    DESCARGAR FICHA OFICIAL DEL LOTE
========================================================== */

const descargarPDF = async (lote: Lote) => {

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const AZUL = [37, 99, 235];
  const MORADO = [124, 58, 237];
  const GRIS = [107, 114, 128];
  const BORDE = [220, 220, 220];
  const FONDO = [245, 247, 250];

  // ======================================================
  // 1) DATOS DE INVENTARIO / RACKS (nuevo)
  // ======================================================

  // Todo el detalle_lote con stock actual (kilos > 0), con info de rack embebida
  const { data: detalleTodos, error: errDetalle } = await supabase
    .from('detalle_lote')
    .select('lote_id, rack_id, kilos, cajas, racks:rack_id ( codigo, ubicacion )')
    .gt('kilos', 0);

  if (errDetalle) {
    console.error(errDetalle);
  }

  const detalle = detalleTodos ?? [];

  // Racks asociados a ESTE lote específico
  const racksDelLote = detalle.filter((d: any) => d.lote_id === lote.id);

  // Lotes que actualmente tienen stock en inventario (sistema completo)
  const lotesIdsEnInventario = new Set(detalle.map((d: any) => d.lote_id));
  const totalLotesInventario = lotesIdsEnInventario.size;

  // Desglose por grupo especie + presentación, usando los lotes ya cargados en memoria
  const grupos = new Map<string, { especie: string; presentacion: string; cantidad: number }>();

  lotes
    .filter((l) => lotesIdsEnInventario.has(l.id))
    .forEach((l) => {
      const especieNombre = l.especie?.nombre ?? 'Sin especie';
      const presentacionNombre = l.presentacion?.nombre ?? 'Sin presentación';
      const key = `${especieNombre}__${presentacionNombre}`;

      const actual = grupos.get(key);
      if (actual) {
        actual.cantidad += 1;
      } else {
        grupos.set(key, {
          especie: especieNombre,
          presentacion: presentacionNombre,
          cantidad: 1,
        });
      }
    });

  const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
    if (a.especie === b.especie) return a.presentacion.localeCompare(b.presentacion);
    return a.especie.localeCompare(b.especie);
  });

  // ======================================================
  // FONDO ENCABEZADO
  // ======================================================

  pdf.setFillColor(AZUL[0], AZUL[1], AZUL[2]);
  pdf.rect(0, 0, 210, 35, "F");

  pdf.addImage(logoIncomar, "PNG", 10, 5, 22, 22);

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("FICHA DE TRAZABILIDAD", 40, 15);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("Sistema de Gestión INCOMAR", 40, 22);

  pdf.setFont("helvetica", "bold");
  pdf.text(`Lote ${lote.codigo_lote}`, 40, 29);

  pdf.setFontSize(9);
  pdf.text(`Emitido: ${new Date().toLocaleString("es-CL")}`, 145, 28);

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
    pdf.roundedRect(12, y, 186, 10, 2, 2, "FD");

    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(titulo, 18, y + 6.5);

    y += 15;
  };

  const fila = (izquierda: string, valorIzq: any, derecha: string, valorDer: any) => {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(izquierda, 18, y);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(valorIzq ?? "-"), 52, y);

    pdf.setFont("helvetica", "bold");
    pdf.text(derecha, 112, y);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(valorDer ?? "-"), 152, y);

    y += 8;
  };

  // ======================================================
  // INFORMACIÓN GENERAL
  // ======================================================

  tituloSeccion("INFORMACIÓN GENERAL");

  fila("Código", lote.codigo_lote, "Estado", lote.estado_producto?.nombre ?? "-");
  fila("Producto", lote.especie?.nombre ?? "-", "Presentación", lote.presentacion?.nombre ?? "-");
  fila("Planta", lote.planta?.nombre ?? "-", "", "");

  y += 2;

  // ======================================================
  // DATOS DE PRODUCCIÓN
  // ======================================================

  tituloSeccion("DATOS DE PRODUCCIÓN");

  fila(
    "Producción", formatDate(lote.fecha_produccion),
    "Vencimiento", lote.fecha_vencimiento ? formatDate(lote.fecha_vencimiento) : "-"
  );

  fila("Kilos", `${lote.kilos_netos} kg`, "Cajas", lote.cantidad_cajas ?? "-");

  fila(
    "Temperatura", lote.temperatura != null ? `${lote.temperatura} °C` : "-",
    "Peso Neto", `${lote.kilos_netos} kg`
  );

  y += 5;

  // ======================================================
  // RACKS ASOCIADOS A ESTE LOTE (nuevo)
  // ======================================================

  checkPageBreak(20);
  tituloSeccion("RACKS ASOCIADOS AL LOTE", MORADO);

  if (racksDelLote.length > 0) {
    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [['Rack', 'Ubicación', 'Kilos', 'Cajas']],
      body: racksDelLote.map((d: any) => [
        d.racks?.codigo ?? 'Sin registrar',
        d.racks?.ubicacion ?? '-',
        `${(d.kilos ?? 0).toLocaleString()} kg`,
        d.cajas !== null ? String(d.cajas) : '-',
      ]),
      headStyles: { fillColor: MORADO as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total de racks asociados: ${new Set(racksDelLote.map((d: any) => d.rack_id)).size}`, 18, y);
    y += 10;
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
    pdf.text("Este lote no tiene racks asignados actualmente.", 18, y);
    y += 12;
  }

  // ======================================================
  // INVENTARIO GENERAL (nuevo)
  // ======================================================

  checkPageBreak(20);
  tituloSeccion("INVENTARIO GENERAL", AZUL);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total de lotes actualmente en inventario: ${totalLotesInventario}`, 18, y);
  y += 10;

  if (gruposOrdenados.length > 0) {
    autoTable(pdf, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [['Especie', 'Presentación', 'Lotes en inventario']],
      body: gruposOrdenados.map((g) => [g.especie, g.presentacion, String(g.cantidad)]),
      headStyles: { fillColor: AZUL as [number, number, number] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: FONDO as [number, number, number] },
    });
    y = (pdf as any).lastAutoTable.finalY + 10;
  }

  // ======================================================
  // OBSERVACIONES
  // ======================================================

  checkPageBreak(40);
  tituloSeccion("OBSERVACIONES");

  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(15, y, 180, 30, 2, 2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  const texto = lote.observaciones?.trim() ? lote.observaciones : "Sin observaciones registradas.";
  const lineas = pdf.splitTextToSize(texto, 170);
  pdf.text(lineas, 20, y + 8);

  y += 40;

  // ======================================================
  // PIE DE DOCUMENTO
  // ======================================================

  checkPageBreak(20);
  pdf.setDrawColor(200);
  pdf.line(15, y, 195, y);
  y += 8;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text("Documento generado automáticamente por el Sistema de Gestión INCOMAR.", 15, y);
  pdf.text("Uso interno - Información confidencial.", 15, y + 6);

  // ======================================================
  // DESCARGAR PDF
  // ======================================================

  pdf.save(`Ficha_Lote_${lote.codigo_lote}.pdf`);

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

  async function eliminarLote(id: string) {
    const confirmar = window.confirm(
      '¿Está seguro de eliminar este lote? Las guías asociadas quedarán sin lote asignado.'
    );

    if (!confirmar) return;

    // Primero desvincula las guías asociadas
    const { error: errorGuias } = await supabase
      .from('guias')
      .update({ lote_id: null })
      .eq('lote_id', id);

    if (errorGuias) {
      console.error(errorGuias);
      alert('Error al desvincular las guías asociadas');
      return;
    }

    // Luego elimina el lote
    const { error } = await supabase
      .from('lotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error eliminando lote');
      return;
    }

  cargarLotes();
}


  const getEstadoBadge = (
  estado?: string
  ) => {

    const nombre =
      estado?.toLowerCase() ?? '';

    if (nombre.includes('activo'))
      return 'bg-blue-100 text-blue-700';

    if (nombre.includes('proces'))
      return 'bg-yellow-100 text-yellow-700';

    if (nombre.includes('despach'))
      return 'bg-gray-100 text-gray-700';

    return 'bg-green-100 text-green-700';
  };

  const canRegister = user?.rol === 'administrador' || user?.rol === 'supervisor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Gestión de Lotes</h1>
          <p className="text-gray-600">Control y trazabilidad de lotes de producción</p>
        </div>

        {canRegister && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            setLoteEditar(null);
            setMostrarModal(true);}}>
            <Plus className="w-5 h-5" />
            Nuevo Lote
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lote origen, lote interno o producto..."
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
            <option value="activo">Activo</option>
            <option value="procesando">Procesando</option>
            <option value="procesado">Procesado</option>
            <option value="despachado">Despachado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">

                <th className="text-left py-3 px-4 text-gray-700">Lote Interno</th>
                <th className="text-left py-3 px-4 text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-gray-700">Planta</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha Producción</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 text-gray-700">Acciones</th>

              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{lote.codigo_lote}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{lote.especie?.nombre}</td>
                  <td className="py-3 px-4 text-gray-600">{lote.planta?.nombre}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(lote.fecha_produccion)}</td>
                  <td className="py-3 px-4 text-gray-900">{(lote.kilos_netos ?? 0).toLocaleString()} kg</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(lote.estado_producto?.nombre)}`}>
                      {lote.estado_producto?.nombre}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLoteDetalle(lote)}className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLoteAsignar(lote)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Asignar a rack"
                      >
                        <Warehouse className="w-4 h-4" />
                      </button>
                      {canRegister && (
                        <>
                          <button
                            onClick={() => {
                              setLoteEditar(lote);
                              setMostrarModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => eliminarLote(lote.id)}
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
              ))}
            </tbody>
          </table>
        </div>

        {lotesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron lotes</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-2">Total Lotes</p>
          <p className="text-gray-900">{lotes.length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Activos</p>
          <p className="text-blue-700">{lotes.filter((l) =>l.estado_producto?.nombre?.toLowerCase().includes('activo')??false).length}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Procesando</p>
          <p className="text-yellow-700">{lotes.filter((l) =>l.estado_producto?.nombre?.toLowerCase().includes('procesando')).length}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Procesados</p>
          <p className="text-green-700">{lotes.filter((l) =>l.estado_producto?.nombre?.toLowerCase().includes('procesado')).length}</p>
        </div>
      </div>
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

      {loteDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">

            <h2 className="text-xl font-semibold mb-6">
              Detalle del Lote
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-sm text-gray-500">Código lote</p>
                <p>{loteDetalle.codigo_lote}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Producto</p>
                <p>{loteDetalle.especie?.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Planta</p>
                <p>{loteDetalle.planta?.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p>{loteDetalle.estado_producto?.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha producción</p>
                <p>{formatDate(loteDetalle.fecha_produccion)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha vencimiento</p>
                <p>
                  {loteDetalle.fecha_vencimiento
                    ? formatDate(loteDetalle.fecha_vencimiento)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Kilos netos</p>
                <p>{loteDetalle.kilos_netos} kg</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Cantidad cajas</p>
                <p>{loteDetalle.cantidad_cajas ?? '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Temperatura</p>
                <p>{loteDetalle.temperatura ?? '-'} °C</p>
              </div>

            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">Observaciones</p>
              <p>{loteDetalle.observaciones || '-'}</p>
            </div>

            <div className="flex justify-end mt-6">

              <button
                  onClick={async () => {
                      if (loteDetalle) {
                          await descargarPDF(loteDetalle);
                      }
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                  Descargar PDF
              </button>

              <button
                onClick={() => setLoteDetalle(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>

          </div>

        </div>
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
    </div>
  );
}
