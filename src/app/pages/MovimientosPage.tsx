import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  Filter,
  Info,
} from "lucide-react";

import { supabase } from "../../utils/supabase";

interface Movimiento {
  id: string;
  lote_id: string | null;
  tipo_movimiento_id: string | null;
  usuario_id: string | null;
  rack_id: string | null;
  cantidad_kg: number | null;
  cantidad_cajas: number | null;
  descripcion: string | null;
  fecha: string;

  lotes?: { codigo_lote: string; presentaciones?: { nombre: string } | null } | null;
  tipos_movimiento?: { nombre: string } | null;
  usuarios?: { nombre: string } | null;
  racks?: { codigo: string } | null;
}

export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cargando, setCargando] = useState(true);

  // =====================================================
  // CARGAR MOVIMIENTOS
  // =====================================================

  useEffect(() => {
    cargarMovimientos();

    const canal = supabase
      .channel("movimientos-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movimientos",
        },
        () => {
          cargarMovimientos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  async function cargarMovimientos() {
    setCargando(true);

    try {
      // -------------------------------------------------
      // 1. Movimientos (sin joins embebidos)
      // -------------------------------------------------

      const { data: movs, error: errorMovs } = await supabase
        .from("movimientos")
        .select(`
          id,
          lote_id,
          tipo_movimiento_id,
          usuario_id,
          rack_id,
          cantidad_kg,
          cantidad_cajas,
          descripcion,
          fecha
        `)
        .order("fecha", { ascending: false });

      if (errorMovs) {
        throw errorMovs;
      }

      if (!movs || movs.length === 0) {
        setMovimientos([]);
        return;
      }

      // -------------------------------------------------
      // 2. IDs únicos a resolver
      // -------------------------------------------------

      const loteIds = [
        ...new Set(movs.map((m) => m.lote_id).filter(Boolean)),
      ] as string[];

      const tipoIds = [
        ...new Set(movs.map((m) => m.tipo_movimiento_id).filter(Boolean)),
      ] as string[];

      const usuarioIds = [
        ...new Set(movs.map((m) => m.usuario_id).filter(Boolean)),
      ] as string[];

      const rackIds = [
        ...new Set(movs.map((m) => m.rack_id).filter(Boolean)),
      ] as string[];

      // -------------------------------------------------
      // 3. Lotes
      // -------------------------------------------------

      let lotes: { id: string; codigo_lote: string; presentacion_id: string | null }[] = [];

      if (loteIds.length > 0) {
        const { data, error } = await supabase
          .from("lotes")
          .select("id, codigo_lote, presentacion_id")
          .in("id", loteIds);

        if (error) {
          console.error("Error cargando lotes:", error);
        } else {
          lotes = data ?? [];
        }
      }

      // -------------------------------------------------
      // 4. Presentaciones (dependen de los lotes)
      // -------------------------------------------------

      const presentacionIds = [
        ...new Set(lotes.map((l) => l.presentacion_id).filter(Boolean)),
      ] as string[];

      let presentaciones: { id: string; nombre: string }[] = [];

      if (presentacionIds.length > 0) {
        const { data, error } = await supabase
          .from("presentaciones")
          .select("id, nombre")
          .in("id", presentacionIds);

        if (error) {
          console.error("Error cargando presentaciones:", error);
        } else {
          presentaciones = data ?? [];
        }
      }

      // -------------------------------------------------
      // 5. Tipos de movimiento
      // -------------------------------------------------

      let tipos: { id: string; nombre: string }[] = [];

      if (tipoIds.length > 0) {
        const { data, error } = await supabase
          .from("tipos_movimiento")
          .select("id, nombre")
          .in("id", tipoIds);

        if (error) {
          console.error("Error cargando tipos de movimiento:", error);
        } else {
          tipos = data ?? [];
        }
      }

      // -------------------------------------------------
      // 6. Usuarios
      // -------------------------------------------------

      let usuarios: { id: string; nombre: string }[] = [];

      if (usuarioIds.length > 0) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, nombre")
          .in("id", usuarioIds);

        if (error) {
          console.error("Error cargando usuarios:", error);
        } else {
          usuarios = data ?? [];
        }
      }

      // -------------------------------------------------
      // 7. Racks
      // -------------------------------------------------

      let racks: { id: string; codigo: string }[] = [];

      if (rackIds.length > 0) {
        const { data, error } = await supabase
          .from("racks")
          .select("id, codigo")
          .in("id", rackIds);

        if (error) {
          console.error("Error cargando racks:", error);
        } else {
          racks = data ?? [];
        }
      }

      // -------------------------------------------------
      // 8. Mapas de referencia
      // -------------------------------------------------

      const presentacionesMap = new Map(
        presentaciones.map((p) => [p.id, { nombre: p.nombre }])
      );

      const lotesMap = new Map(
        lotes.map((l) => [
          l.id,
          {
            codigo_lote: l.codigo_lote,
            presentaciones: l.presentacion_id
              ? presentacionesMap.get(l.presentacion_id) ?? null
              : null,
          },
        ])
      );

      const tiposMap = new Map(tipos.map((t) => [t.id, { nombre: t.nombre }]));
      const usuariosMap = new Map(usuarios.map((u) => [u.id, { nombre: u.nombre }]));
      const racksMap = new Map(racks.map((r) => [r.id, { codigo: r.codigo }]));

      // -------------------------------------------------
      // 9. Unir información
      // -------------------------------------------------

      const movimientosFinales: Movimiento[] = movs.map((m) => ({
        id: m.id,
        lote_id: m.lote_id,
        tipo_movimiento_id: m.tipo_movimiento_id,
        usuario_id: m.usuario_id,
        rack_id: m.rack_id,

        cantidad_kg: m.cantidad_kg !== null ? Number(m.cantidad_kg) : null,
        cantidad_cajas: m.cantidad_cajas,
        descripcion: m.descripcion,
        fecha: m.fecha,

        lotes: m.lote_id ? lotesMap.get(m.lote_id) ?? null : null,

        tipos_movimiento: m.tipo_movimiento_id
          ? tiposMap.get(m.tipo_movimiento_id) ?? null
          : null,

        usuarios: m.usuario_id ? usuariosMap.get(m.usuario_id) ?? null : null,

        racks: m.rack_id ? racksMap.get(m.rack_id) ?? null : null,
      }));

      console.log("Movimientos finales:", movimientosFinales);

      setMovimientos(movimientosFinales);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      setMovimientos([]);
    } finally {
      setCargando(false);
    }
  }

  // =====================================================
  // FILTRAR
  // =====================================================

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const tipo = movimiento.tipos_movimiento?.nombre?.toLowerCase() ?? "";
    const lote = movimiento.lotes?.codigo_lote?.toLowerCase() ?? "";
    const producto = movimiento.lotes?.presentaciones?.nombre?.toLowerCase() ?? "";
    const busqueda = searchTerm.toLowerCase();

    const matchesTipo = filtroTipo === "todos" || tipo === filtroTipo;
    const matchesSearch = lote.includes(busqueda) || producto.includes(busqueda);

    return matchesTipo && matchesSearch;
  });

  // =====================================================
  // FECHA
  // =====================================================

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // =====================================================
  // TIPO
  // =====================================================

  const getTipoIcon = (tipo: string) => {
    if (tipo === "entrada") {
      return <ArrowDownCircle className="w-5 h-5" />;
    }

    if (tipo === "salida") {
      return <ArrowUpCircle className="w-5 h-5" />;
    }

    return <ArrowLeftRight className="w-5 h-5" />;
  };

  // =====================================================
  // TOTALES
  // =====================================================

  const totalEntradas = movimientos
    .filter((m) => m.tipos_movimiento?.nombre?.toLowerCase() === "entrada")
    .reduce((sum, m) => sum + Number(m.cantidad_kg ?? 0), 0);

  const totalSalidas = movimientos
    .filter((m) => m.tipos_movimiento?.nombre?.toLowerCase() === "salida")
    .reduce((sum, m) => sum + Number(m.cantidad_kg ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Movimientos</h1>

        <p className="text-sm text-gray-500 mt-1">
          Historial de entradas, salidas y transferencias
        </p>
      </div>

      {/* ================================================= */}
      {/* INFORMACIÓN */}
      {/* ================================================= */}

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

          <div>
            <p className="text-sm text-blue-900">
              <strong>Historial automático:</strong> esta sección muestra los
              movimientos generados por las distintas operaciones del
              sistema.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* RESUMEN */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ENTRADAS */}

        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownCircle className="w-6 h-6 text-green-600" />
            <p className="text-gray-700">Entradas</p>
          </div>

          <p className="text-green-700 text-xl font-semibold">
            {totalEntradas.toLocaleString()} kg
          </p>
        </div>

        {/* SALIDAS */}

        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="w-6 h-6 text-red-600" />
            <p className="text-gray-700">Salidas</p>
          </div>

          <p className="text-red-700 text-xl font-semibold">
            {totalSalidas.toLocaleString()} kg
          </p>
        </div>

        {/* TOTAL */}

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            <p className="text-gray-700">Total Movimientos</p>
          </div>

          <p className="text-blue-700 text-xl font-semibold">
            {movimientos.length}
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* TABLA */}
      {/* ================================================= */}

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        {/* FILTROS */}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Buscar por lote o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="transferencia">Transferencias</option>
            </select>
          </div>
        </div>

        {/* TABLA */}

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
                <th className="text-left py-3 px-4 text-gray-700">
                  Responsable
                </th>
                <th className="text-left py-3 px-4 text-gray-700">Fecha</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((movimiento) => {
                  const tipo =
                    movimiento.tipos_movimiento?.nombre?.toLowerCase() ?? "";

                  return (
                    <tr
                      key={movimiento.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      {/* TIPO */}

                      <td className="py-3 px-4">
                        <div
                          className={`flex items-center gap-2 ${
                            tipo === "entrada"
                              ? "text-green-600"
                              : tipo === "salida"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {getTipoIcon(tipo)}

                          <span className="capitalize">{tipo || "-"}</span>
                        </div>
                      </td>

                      {/* LOTE */}

                      <td className="py-3 px-4 text-gray-900">
                        {movimiento.lotes?.codigo_lote ?? "-"}
                      </td>

                      {/* PRODUCTO */}

                      <td className="py-3 px-4 text-gray-900">
                        {movimiento.lotes?.presentaciones?.nombre ?? "-"}
                      </td>

                      {/* RACK */}

                      <td className="py-3 px-4 text-gray-600">
                        {movimiento.racks?.codigo ?? "-"}
                      </td>

                      {/* CAJAS */}

                      <td className="py-3 px-4 text-gray-900">
                        {Number(movimiento.cantidad_cajas ?? 0).toLocaleString()}
                      </td>

                      {/* KILOS */}

                      <td className="py-3 px-4 text-gray-900">
                        {Number(movimiento.cantidad_kg ?? 0).toLocaleString()}{" "}
                        kg
                      </td>

                      {/* RESPONSABLE */}

                      <td className="py-3 px-4 text-gray-600">
                        {movimiento.usuarios?.nombre ?? "Sin registrar"}
                      </td>

                      {/* FECHA */}

                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(movimiento.fecha)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!cargando && movimientosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron movimientos</p>
          </div>
        )}
      </div>
    </div>
  );
}