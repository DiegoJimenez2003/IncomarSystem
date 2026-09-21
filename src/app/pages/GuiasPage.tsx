import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  FileSignature,
  Edit2,
  Trash2,
  Download,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';

import { GuiasModal } from '../components/Productos/GuiasModal';
import { CrearLoteDesdeGuiasModal } from '../components/Productos/CrearLoteDesdeGuiasModal';
import { PackagePlus } from 'lucide-react';

interface Guia {
  id: string;
  numero_guia: string;
  lote_origen: string;
  especie_id: string;
  barco: string;
  origen: string;
  destino: string;
  kilos: number;
  fecha_guia: string;
  observaciones: string;
  lote_id: string | null;
  especie?: {
    nombre: string;
  } | null;
  lote?: {
    codigo_lote: string;
  } | null;
}

type FiltroFecha = 'todos' | 'hoy' | '7dias' | 'mes';

interface Filtros {
  numero_guia: string;
  lote_origen: string;
  barco: string;
  origen: string;
  destino: string;
  especie: string;
  kilosMin: string;
  kilosMax: string;
  fecha: FiltroFecha;
  anio: string; // '' = todos los años
  loteInterno: 'todos' | 'pendiente' | 'asignado';
}

const FILTROS_INICIALES: Filtros = {
  numero_guia: '',
  lote_origen: '',
  barco: '',
  origen: '',
  destino: '',
  especie: '',
  kilosMin: '',
  kilosMax: '',
  fecha: 'todos',
  anio: '',
  loteInterno: 'todos',
};

const OPCIONES_FECHA: { valor: FiltroFecha; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todas' },
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7dias', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
];

function fechaEnRango(fechaGuiaISO: string, filtro: FiltroFecha): boolean {
  if (filtro === 'todos') return true;

  const fechaGuia = new Date(fechaGuiaISO);
  const ahora = new Date();

  if (filtro === 'hoy') {
    return (
      fechaGuia.getFullYear() === ahora.getFullYear() &&
      fechaGuia.getMonth() === ahora.getMonth() &&
      fechaGuia.getDate() === ahora.getDate()
    );
  }

  if (filtro === '7dias') {
    const hace7dias = new Date(ahora);
    hace7dias.setDate(ahora.getDate() - 7);
    hace7dias.setHours(0, 0, 0, 0);
    return fechaGuia >= hace7dias;
  }

  if (filtro === 'mes') {
    return (
      fechaGuia.getFullYear() === ahora.getFullYear() &&
      fechaGuia.getMonth() === ahora.getMonth()
    );
  }

  return true;
}

export function GuiasPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [guias, setGuias] = useState<Guia[]>([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [guiaEditar, setGuiaEditar] =
    useState<Guia | null>(null);

  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [mostrarCrearLote, setMostrarCrearLote] = useState(false);

  const [loading, setLoading] =
    useState(true);

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
      key === 'loteInterno' || key === 'fecha' ? value !== 'todos' : value !== ''
    );

  const aniosDisponibles = useMemo(() => {
    const anios = new Set(guias.map((g) => new Date(g.fecha_guia).getFullYear()));
    return Array.from(anios).sort((a, b) => b - a); // más reciente primero
  }, [guias]);

  const guiasFiltradas = useMemo(() => {
    return guias.filter((guia) => {
      // Búsqueda general (se mantiene, opcional)
      const coincideBusquedaGeneral =
        searchTerm === '' ||
        guia.numero_guia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guia.lote_origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guia.barco.toLowerCase().includes(searchTerm.toLowerCase());

      if (!coincideBusquedaGeneral) return false;

      if (
        filtros.numero_guia &&
        !guia.numero_guia.toLowerCase().includes(filtros.numero_guia.toLowerCase())
      )
        return false;

      if (
        filtros.lote_origen &&
        !guia.lote_origen.toLowerCase().includes(filtros.lote_origen.toLowerCase())
      )
        return false;

      if (
        filtros.barco &&
        !guia.barco.toLowerCase().includes(filtros.barco.toLowerCase())
      )
        return false;

      if (
        filtros.origen &&
        !guia.origen.toLowerCase().includes(filtros.origen.toLowerCase())
      )
        return false;

      if (
        filtros.destino &&
        !guia.destino.toLowerCase().includes(filtros.destino.toLowerCase())
      )
        return false;

      if (
        filtros.especie &&
        !(guia.especie?.nombre ?? '').toLowerCase().includes(filtros.especie.toLowerCase())
      )
        return false;

      if (filtros.kilosMin && guia.kilos < Number(filtros.kilosMin)) return false;
      if (filtros.kilosMax && guia.kilos > Number(filtros.kilosMax)) return false;

      if (!fechaEnRango(guia.fecha_guia, filtros.fecha)) return false;

      if (filtros.anio && new Date(guia.fecha_guia).getFullYear() !== Number(filtros.anio))
        return false;

      if (filtros.loteInterno === 'pendiente' && guia.lote_id) return false;
      if (filtros.loteInterno === 'asignado' && !guia.lote_id) return false;

      return true;
    });
  }, [guias, searchTerm, filtros]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  useEffect(() => {
  cargarGuias();
}, []);

async function cargarGuias() {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from('guias')
      .select(`
        *,
        especie:especie_id (
          nombre
        ),
        lote:lote_id (
          codigo_lote
        )
      `)
      .order('fecha_guia', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setGuias(data ?? []);
  } finally {
    setLoading(false);
  }
}


  function toggleSeleccion(id: string) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const guiasSeleccionadas = guias.filter((g) => seleccionadas.includes(g.id));


  function handleEditar(guia: Guia) {

    setGuiaEditar(guia);

    setMostrarModal(true);
  }

    async function handleEliminar(id: string) {

    const confirmar = confirm(
      '¿Desea eliminar esta guía?'
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('guias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error eliminando guía');
      return;
    }

  cargarGuias();
}

  function exportarExcel() {
    if (guiasFiltradas.length === 0) {
      alert('No hay guías para exportar con los filtros actuales');
      return;
    }

    const filas = guiasFiltradas.map((guia) => ({
      'Nº Guía': guia.numero_guia,
      'Lote Origen': guia.lote_origen,
      Especie: guia.especie?.nombre ?? '',
      Barco: guia.barco,
      Origen: guia.origen,
      Destino: guia.destino,
      Kilos: guia.kilos,
      Fecha: formatDate(guia.fecha_guia),
      'Lote Interno': guia.lote?.codigo_lote ?? 'Pendiente',
      Observaciones: guia.observaciones ?? '',
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);

    // Ancho de columnas aproximado según contenido
    hoja['!cols'] = [
      { wch: 14 }, // Nº Guía
      { wch: 16 }, // Lote Origen
      { wch: 16 }, // Especie
      { wch: 18 }, // Barco
      { wch: 14 }, // Origen
      { wch: 14 }, // Destino
      { wch: 10 }, // Kilos
      { wch: 18 }, // Fecha
      { wch: 14 }, // Lote Interno
      { wch: 30 }, // Observaciones
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Guías');

    const fechaArchivo = new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-')
      .join('');

    XLSX.writeFile(libro, `guias_${fechaArchivo}.xlsx`);
  }

  const canManage = user?.rol === 'administrador' || user?.rol === 'supervisor' || user?.rol === 'secretaria';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Guías de Despacho</h1>
          <p className="text-gray-600">Registro de guías asociadas a lotes</p>
        </div>

      <div className="flex items-center gap-2">
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar Excel
        </button>

        {seleccionadas.length > 0 && (
          <button
            onClick={() => setMostrarCrearLote(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PackagePlus className="w-5 h-5" />
            Crear Lote ({seleccionadas.length})
          </button>
        )}

        {canManage && (
          <button onClick={() => {setGuiaEditar(null); setMostrarModal(true);}}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nueva Guía
          </button>
        )}
      </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de guía, lote o barco..."
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
              <label className="block text-xs text-gray-500 mb-1">Nº Guía</label>
              <input
                type="text"
                value={filtros.numero_guia}
                onChange={(e) => actualizarFiltro('numero_guia', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Lote Origen</label>
              <input
                type="text"
                value={filtros.lote_origen}
                onChange={(e) => actualizarFiltro('lote_origen', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Especie</label>
              <input
                type="text"
                value={filtros.especie}
                onChange={(e) => actualizarFiltro('especie', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Barco</label>
              <input
                type="text"
                value={filtros.barco}
                onChange={(e) => actualizarFiltro('barco', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Origen</label>
              <input
                type="text"
                value={filtros.origen}
                onChange={(e) => actualizarFiltro('origen', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Destino</label>
              <input
                type="text"
                value={filtros.destino}
                onChange={(e) => actualizarFiltro('destino', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Filtrar..."
              />
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
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Lote Interno</label>
              <select
                value={filtros.loteInterno}
                onChange={(e) =>
                  actualizarFiltro('loteInterno', e.target.value as Filtros['loteInterno'])
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="asignado">Asignado</option>
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            Cargando guías...
          </div>
        )}

        <div className="mb-2 text-sm text-gray-500">
          Mostrando {guiasFiltradas.length} de {guias.length} guías
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4"></th>
                <th className="text-left py-3 px-4 text-gray-700">Nº Guía</th>
                <th className="text-left py-3 px-4 text-gray-700">Lote Origen</th>
                <th className="text-left py-3 px-4 text-gray-700">Barco</th>
                <th className="text-left py-3 px-4 text-gray-700">Origen</th>
                <th className="text-left py-3 px-4 text-gray-700">Destino</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-700">Lote Interno</th>
                {canManage && <th className="text-left py-3 px-4 text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {guiasFiltradas.map((guia) => (
                <tr key={guia.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(guia.id)}
                      onChange={() => toggleSeleccion(guia.id)}
                      disabled={!!guia.lote_id}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileSignature className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">{guia.numero_guia}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{guia.lote_origen}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.barco}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.origen}</td>
                  <td className="py-3 px-4 text-gray-600">{guia.destino}</td>
                  <td className="py-3 px-4 text-gray-900">{guia.kilos.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(guia.fecha_guia)}</td>
                  <td className="py-3 px-4">
                    {guia.lote ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                        {guia.lote.codigo_lote}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
                        Pendiente
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditar(guia)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(guia.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && guiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron guías</p>
          </div>
        )}
      </div>

            {mostrarModal && (
        <GuiasModal
          guia={guiaEditar}
          onClose={() => {
            setMostrarModal(false);
            setGuiaEditar(null);
          }}
          onSuccess={() => {
            cargarGuias();
          }}
        />
      )}

      {mostrarCrearLote && (
        <CrearLoteDesdeGuiasModal
          guias={guiasSeleccionadas}
          onClose={() => setMostrarCrearLote(false)}
          onSuccess={() => {
            setSeleccionadas([]);
            cargarGuias();
          }}
        />
      )}
    </div>
  );
}