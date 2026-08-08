import { useEffect, useState } from "react";
import { Search, Plus, Ship, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../utils/supabase";
import { NuevoEmbarqueModal } from "../components/Productos/NuevoEmbarqueModal";
import { EditarEmbarqueModal } from "../components/Productos/EditarEmbarqueModal";

interface Embarque {
  id: string;
  codigo_embarque: string;
  cliente: string | null;
  destino: string | null;
  transporte: string | null;
  fecha_embarque: string | null;
  observaciones: string | null;
  creado_por: string | null;
  created_at: string;
  estado_embarque_id: string | null;

  usuarios?: { nombre: string } | null;
  estados_embarque?: { nombre: string; color: string } | null;
  kilos_total: number;
  cajas_total: number;
}

export function EmbarquesPage() {
  const { user } = useAuth();

  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [embarqueEditando, setEmbarqueEditando] = useState<Embarque | null>(null);

  const canManage =
    user?.rol === "administrador" ||
    user?.rol === "supervisor" ||
    user?.rol === "secretaria";

  useEffect(() => {
    cargarEmbarques();

    const canal = supabase
      .channel("embarques-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "embarques" },
        () => cargarEmbarques()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // =====================================================
  // CARGAR EMBARQUES
  // =====================================================

  async function cargarEmbarques() {
    setCargando(true);

    try {
      const { data: embs, error: errorEmbs } = await supabase
        .from("embarques")
        .select(`
          id,
          codigo_embarque,
          cliente,
          destino,
          transporte,
          fecha_embarque,
          observaciones,
          creado_por,
          created_at,
          estado_embarque_id
        `)
        .order("created_at", { ascending: false });

      if (errorEmbs) throw errorEmbs;

      if (!embs || embs.length === 0) {
        setEmbarques([]);
        return;
      }

      const embarqueIds = embs.map((e) => e.id);
      const usuarioIds = [
        ...new Set(embs.map((e) => e.creado_por).filter(Boolean)),
      ] as string[];
      const estadoIds = [
        ...new Set(embs.map((e) => e.estado_embarque_id).filter(Boolean)),
      ] as string[];

      // Detalle (kilos/cajas por embarque)
      const { data: detalle, error: errorDetalle } = await supabase
        .from("embarque_detalle")
        .select("embarque_id, kilos, cajas")
        .in("embarque_id", embarqueIds);

      if (errorDetalle) {
        console.error("Error cargando embarque_detalle:", errorDetalle);
      }

      const totalesMap = new Map<string, { kilos: number; cajas: number }>();
      (detalle ?? []).forEach((d) => {
        if (!d.embarque_id) return;
        const actual = totalesMap.get(d.embarque_id) ?? { kilos: 0, cajas: 0 };
        totalesMap.set(d.embarque_id, {
          kilos: actual.kilos + Number(d.kilos ?? 0),
          cajas: actual.cajas + Number(d.cajas ?? 0),
        });
      });

      // Usuarios
      let usuarios: { id: string; nombre: string }[] = [];
      if (usuarioIds.length > 0) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, nombre")
          .in("id", usuarioIds);
        if (error) console.error("Error cargando usuarios:", error);
        usuarios = data ?? [];
      }
      const usuariosMap = new Map(usuarios.map((u) => [u.id, { nombre: u.nombre }]));

      // Estados de embarque
      let estados: { id: string; nombre: string; color: string }[] = [];
      if (estadoIds.length > 0) {
        const { data, error } = await supabase
          .from("estados_embarque")
          .select("id, nombre, color")
          .in("id", estadoIds);
        if (error) console.error("Error cargando estados_embarque:", error);
        estados = data ?? [];
      }
      const estadosMap = new Map(
        estados.map((e) => [e.id, { nombre: e.nombre, color: e.color }])
      );

      const embarquesFinales: Embarque[] = embs.map((e) => ({
        id: e.id,
        codigo_embarque: e.codigo_embarque,
        cliente: e.cliente,
        destino: e.destino,
        transporte: e.transporte,
        fecha_embarque: e.fecha_embarque,
        observaciones: e.observaciones,
        creado_por: e.creado_por,
        created_at: e.created_at,
        estado_embarque_id: e.estado_embarque_id,

        usuarios: e.creado_por ? usuariosMap.get(e.creado_por) ?? null : null,
        estados_embarque: e.estado_embarque_id
          ? estadosMap.get(e.estado_embarque_id) ?? null
          : null,

        kilos_total: totalesMap.get(e.id)?.kilos ?? 0,
        cajas_total: totalesMap.get(e.id)?.cajas ?? 0,
      }));

      setEmbarques(embarquesFinales);
    } catch (error) {
      console.error("Error cargando embarques:", error);
      setEmbarques([]);
    } finally {
      setCargando(false);
    }
  }

  // =====================================================
  // ELIMINAR (cascada elimina embarque_detalle)
  // =====================================================

  async function handleEliminar(id: string) {
    if (!confirm("¿Está seguro de eliminar este embarque? Esta acción no revierte los movimientos de inventario ya generados.")) {
      return;
    }

    const { error } = await supabase.from("embarques").delete().eq("id", id);

    if (error) {
      console.error("Error eliminando embarque:", error);
      alert("No se pudo eliminar el embarque");
      return;
    }

    await cargarEmbarques();
  }

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  async function cambiarEstado(embarqueId: string, nombreEstado: string) {
    const { data: estado, error: errorEstado } = await supabase
      .from("estados_embarque")
      .select("id")
      .eq("nombre", nombreEstado)
      .single();

    if (errorEstado || !estado) {
      console.error("Error buscando estado:", errorEstado);
      return;
    }

    const { error } = await supabase
      .from("embarques")
      .update({ estado_embarque_id: estado.id })
      .eq("id", embarqueId);

    if (error) {
      console.error("Error actualizando estado:", error);
      alert("No se pudo actualizar el estado");
      return;
    }

    await cargarEmbarques();
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const embarquesFiltrados = embarques.filter((e) => {
    const busqueda = searchTerm.toLowerCase();
    const matchesSearch =
      e.codigo_embarque.toLowerCase().includes(busqueda) ||
      (e.destino ?? "").toLowerCase().includes(busqueda) ||
      (e.cliente ?? "").toLowerCase().includes(busqueda);

    const matchesEstado =
      filtroEstado === "todos" || e.estados_embarque?.nombre === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const badgeColors: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  };

  const getEstadoBadge = (color?: string) =>
    badgeColors[color ?? "gray"] ?? badgeColors.gray;

  const contarPorEstado = (nombre: string) =>
    embarques.filter((e) => e.estados_embarque?.nombre === nombre).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Embarques</h1>
          <p className="text-gray-600">Registro y seguimiento de despachos</p>
        </div>

        {canManage && (
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Embarque
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o destino..."
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
            <option value="preparando">Preparando</option>
            <option value="despachado">Despachado</option>
            <option value="en_transito">En Tránsito</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Código</th>
                <th className="text-left py-3 px-4 text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 text-gray-700">Destino</th>
                <th className="text-left py-3 px-4 text-gray-700">Transporte</th>
                <th className="text-left py-3 px-4 text-gray-700">Cajas</th>
                <th className="text-left py-3 px-4 text-gray-700">Kilos</th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-700">Responsable</th>
                <th className="text-left py-3 px-4 text-gray-700">Estado</th>
                {canManage && <th className="text-left py-3 px-4 text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-500">
                    Cargando embarques...
                  </td>
                </tr>
              ) : (
                embarquesFiltrados.map((embarque) => (
                  <tr key={embarque.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{embarque.codigo_embarque}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{embarque.cliente ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-900">{embarque.destino ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{embarque.transporte ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-900">{embarque.cajas_total}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {embarque.kilos_total.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(embarque.fecha_embarque)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {embarque.usuarios?.nombre ?? "Sin registrar"}
                    </td>
                    <td className="py-3 px-4">
                      {canManage ? (
                        <select
                          value={embarque.estados_embarque?.nombre ?? ""}
                          onChange={(e) => cambiarEstado(embarque.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs border-0 ${getEstadoBadge(
                            embarque.estados_embarque?.color
                          )}`}
                        >
                          <option value="preparando">Preparando</option>
                          <option value="despachado">Despachado</option>
                          <option value="en_transito">En Tránsito</option>
                          <option value="entregado">Entregado</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(
                            embarque.estados_embarque?.color
                          )}`}
                        >
                          {embarque.estados_embarque?.nombre ?? "-"}
                        </span>
                      )}
                    </td>
                    {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEmbarqueEditando(embarque)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(embarque.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && embarquesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Ship className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron embarques</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">Preparando</p>
          <p className="text-yellow-700">{contarPorEstado("preparando")}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-2">Despachados</p>
          <p className="text-blue-700">{contarPorEstado("despachado")}</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-gray-700 mb-2">En Tránsito</p>
          <p className="text-purple-700">{contarPorEstado("en_transito")}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">Entregados</p>
          <p className="text-green-700">{contarPorEstado("entregado")}</p>
        </div>
      </div>

      {modalAbierto && (
        <NuevoEmbarqueModal
          onClose={() => setModalAbierto(false)}
          onSuccess={cargarEmbarques}
        />
      )}

      {embarqueEditando && (
        <EditarEmbarqueModal
          embarque={embarqueEditando}
          onClose={() => setEmbarqueEditando(null)}
          onSuccess={cargarEmbarques}
        />
      )}
    </div>
  );
}