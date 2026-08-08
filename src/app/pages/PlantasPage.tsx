import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Factory, X } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Planta {
  id: string;
  nombre: string;
  codigo_planta: string | null;
  direccion: string | null;
  zona_pesca: string | null;
}

interface PlantaForm {
  nombre: string;
  codigo_planta: string;
  direccion: string;
  zona_pesca: string;
}

const formVacio: PlantaForm = {
  nombre: '',
  codigo_planta: '',
  direccion: '',
  zona_pesca: '',
};

export function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [plantaEditando, setPlantaEditando] = useState<Planta | null>(null);
  const [form, setForm] = useState<PlantaForm>(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Confirmación de borrado
  const [plantaAEliminar, setPlantaAEliminar] = useState<Planta | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  useEffect(() => {
    cargarPlantas();
  }, []);

  async function cargarPlantas() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('plantas')
      .select('id, nombre, codigo_planta, direccion, zona_pesca')
      .order('nombre');

    if (error) {
      setError(`Error cargando plantas: ${error.message}`);
    } else {
      setPlantas(data || []);
    }
    setLoading(false);
  }

  const plantasFiltradas = plantas.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.codigo_planta || '').toLowerCase().includes(term) ||
      (p.zona_pesca || '').toLowerCase().includes(term)
    );
  });

  // ------------------------------------------------------------------
  // Modal crear/editar
  // ------------------------------------------------------------------
  function abrirModalCrear() {
    setPlantaEditando(null);
    setForm(formVacio);
    setErrorForm(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(planta: Planta) {
    setPlantaEditando(planta);
    setForm({
      nombre: planta.nombre,
      codigo_planta: planta.codigo_planta || '',
      direccion: planta.direccion || '',
      zona_pesca: planta.zona_pesca || '',
    });
    setErrorForm(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setPlantaEditando(null);
    setForm(formVacio);
    setErrorForm(null);
  }

  async function guardarPlanta() {
    if (!form.nombre.trim()) {
      setErrorForm('El nombre de la planta es obligatorio');
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      nombre: form.nombre.trim(),
      codigo_planta: form.codigo_planta.trim() || null,
      direccion: form.direccion.trim() || null,
      zona_pesca: form.zona_pesca.trim() || null,
    };

    const { error } = plantaEditando
      ? await supabase.from('plantas').update(payload).eq('id', plantaEditando.id)
      : await supabase.from('plantas').insert(payload);

    if (error) {
      setErrorForm(`Error guardando: ${error.message}`);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    cerrarModal();
    cargarPlantas();
  }

  // ------------------------------------------------------------------
  // Eliminar (con chequeo de lotes asociados)
  // ------------------------------------------------------------------
  function pedirConfirmacionEliminar(planta: Planta) {
    setPlantaAEliminar(planta);
    setErrorEliminar(null);
  }

  async function confirmarEliminar() {
    if (!plantaAEliminar) return;

    setEliminando(true);
    setErrorEliminar(null);

    // Chequear si hay lotes asociados a esta planta antes de borrar
    const { count, error: countError } = await supabase
      .from('lotes')
      .select('id', { count: 'exact', head: true })
      .eq('planta_id', plantaAEliminar.id);

    if (countError) {
      setErrorEliminar(`Error verificando lotes asociados: ${countError.message}`);
      setEliminando(false);
      return;
    }

    if (count && count > 0) {
      setErrorEliminar(
        `No se puede eliminar: esta planta tiene ${count} lote(s) asociado(s). Reasigne o elimine esos lotes primero.`
      );
      setEliminando(false);
      return;
    }

    const { error } = await supabase.from('plantas').delete().eq('id', plantaAEliminar.id);

    if (error) {
      setErrorEliminar(`Error eliminando: ${error.message}`);
      setEliminando(false);
      return;
    }

    setEliminando(false);
    setPlantaAEliminar(null);
    cargarPlantas();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Plantas</h1>
          <p className="text-gray-600">Lugares físicos donde se procesa el producto</p>
        </div>

        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Planta
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o zona de pesca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando plantas...</p>
          </div>
        ) : plantasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 text-gray-700">Código</th>
                  <th className="text-left py-3 px-4 text-gray-700">Dirección</th>
                  <th className="text-left py-3 px-4 text-gray-700">Zona de Pesca</th>
                  <th className="text-right py-3 px-4 text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plantasFiltradas.map((planta) => (
                  <tr key={planta.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{planta.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{planta.codigo_planta || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{planta.direccion || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{planta.zona_pesca || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(planta)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => pedirConfirmacionEliminar(planta)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron plantas con ese criterio' : 'No hay plantas registradas todavía'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-gray-900">{plantaEditando ? 'Editar Planta' : 'Nueva Planta'}</h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorForm}</div>
              )}

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Planta San Vicente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Código de Planta</label>
                <input
                  type="text"
                  value={form.codigo_planta}
                  onChange={(e) => setForm({ ...form, codigo_planta: e.target.value })}
                  placeholder="Ej: PL-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej: Av. Costanera 1234, Coronel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Zona de Pesca</label>
                <input
                  type="text"
                  value={form.zona_pesca}
                  onChange={(e) => setForm({ ...form, zona_pesca: e.target.value })}
                  placeholder="Ej: Zona Centro-Sur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPlanta}
                disabled={guardando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {guardando ? 'Guardando...' : plantaEditando ? 'Guardar Cambios' : 'Crear Planta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {plantaAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-gray-900 mb-2">Eliminar Planta</h2>
            <p className="text-gray-600 text-sm mb-4">
              ¿Está seguro de que desea eliminar la planta <span className="text-gray-900">{plantaAEliminar.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>

            {errorEliminar && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errorEliminar}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPlantaAEliminar(null)}
                disabled={eliminando}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}