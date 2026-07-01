import { useEffect, useState } from 'react';
import { Search, Plus, Eye, Edit2,Trash2, PackageCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { LoteModal } from '../components/Productos/LoteModal';
import jsPDF from 'jspdf';


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

    especie?: {
      nombre: string;
    };

    planta?: {
      nombre: string;
    };

    estado_producto?: {
      nombre: string;
    };
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

  // ==========================================
  // Descargar información del lote en PDF
  // ==========================================
  const descargarPDF = (lote: Lote) => {

    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(20);
    pdf.text("INCOMAR", 20, y);

    y += 8;

    pdf.setFontSize(14);
    pdf.text("Detalle del Lote", 20, y);

    y += 15;

    pdf.setFontSize(11);

    const agregarLinea = (titulo: string, valor: any) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${titulo}:`, 20, y);

      pdf.setFont("helvetica", "normal");
      pdf.text(String(valor ?? "-"), 75, y);

      y += 8;
    };

    agregarLinea("Código lote", lote.codigo_lote);
    agregarLinea("Producto", lote.especie?.nombre);
    agregarLinea("Planta", lote.planta?.nombre);
    agregarLinea("Estado", lote.estado_producto?.nombre);

    agregarLinea(
      "Fecha producción",
      formatDate(lote.fecha_produccion)
    );

    agregarLinea(
      "Fecha vencimiento",
      lote.fecha_vencimiento
        ? formatDate(lote.fecha_vencimiento)
        : "-"
    );

    agregarLinea(
      "Kilos netos",
      `${lote.kilos_netos} kg`
    );

    agregarLinea(
      "Cantidad cajas",
      lote.cantidad_cajas ?? "-"
    );

    agregarLinea(
      "Temperatura",
      lote.temperatura != null
        ? `${lote.temperatura} °C`
        : "-"
    );

    agregarLinea(
      "Observaciones",
      lote.observaciones || "-"
    );

    y += 10;

    pdf.setDrawColor(180);
    pdf.line(20, y, 190, y);

    y += 10;

    pdf.setFontSize(9);

    pdf.text(
      `Documento generado automáticamente por INCOMAR`,
      20,
      y
    );

    pdf.save(`Lote-${lote.codigo_lote}.pdf`);

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
          especie:especie_id (
            nombre
          ),
          planta:planta_id (
            nombre
          ),
          estado_producto:estado_producto_id (
            nombre
          )
        `)
        .order('created_at', {
          ascending: false
        });

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
      '¿Está seguro de eliminar este lote?'
    );

    if (!confirmar) return;

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
                  onClick={() => {
                      if (loteDetalle) {
                          descargarPDF(loteDetalle);
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
    </div>
  );
}
