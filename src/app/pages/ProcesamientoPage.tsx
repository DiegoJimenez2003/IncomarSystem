import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Factory,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../../utils/supabase";
import { ProcesamientoModal } from "../components/Productos/ProcesamientoModal";

interface Procesamiento {
  id: string;
  lote_id: string;
  fecha_proceso: string;
  kilos_entrada: number;
  kilos_salida: number;
  observaciones: string | null;
  usuario_id: string | null;

  lotes?: {
    codigo_lote: string;
    presentaciones?: {
      nombre: string;
    } | null;
  } | null;

  usuarios?: {
    nombre: string;
  } | null;
}

interface ProcesamientoForm {
  id?: string;
  lote_id: string;
  kilos_entrada: number;
  kilos_salida: number;
  observaciones: string;
}

export function ProcesamientoPage() {
  const { user } = useAuth();

  const [procesamientos, setProcesamientos] = useState<Procesamiento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);

  const [procesamientoEditar, setProcesamientoEditar] =
    useState<ProcesamientoForm | null>(null);

  const [cargando, setCargando] = useState(true);

  const canRegister =
    user?.rol === "administrador" ||
    user?.rol === "supervisor";

  // =====================================================
  // CARGAR PROCESAMIENTOS AL ENTRAR
  // =====================================================

  useEffect(() => {
    cargarProcesamientos();
  }, []);

  async function cargarProcesamientos() {
    setCargando(true);

    try {
      // -------------------------------------------------
      // 1. Procesamientos
      // -------------------------------------------------

      const { data: procesos, error: errorProcesos } =
        await supabase
          .from("procesamientos")
          .select(`
            id,
            lote_id,
            fecha_proceso,
            kilos_entrada,
            kilos_salida,
            observaciones,
            usuario_id
          `)
          .order("fecha_proceso", {
            ascending: false,
          });

      if (errorProcesos) {
        throw errorProcesos;
      }

      if (!procesos || procesos.length === 0) {
        setProcesamientos([]);
        return;
      }

      // -------------------------------------------------
      // 2. IDs de lotes
      // -------------------------------------------------

      const loteIds = [
        ...new Set(
          procesos
            .map((p) => p.lote_id)
            .filter(Boolean)
        ),
      ];

      // -------------------------------------------------
      // 3. IDs de usuarios
      // -------------------------------------------------

      const usuarioIds = [
        ...new Set(
          procesos
            .map((p) => p.usuario_id)
            .filter(Boolean)
        ),
      ];

      // -------------------------------------------------
      // 4. Cargar lotes
      // -------------------------------------------------

      const { data: lotes, error: errorLotes } =
        await supabase
          .from("lotes")
          .select(`
            id,
            codigo_lote,
            presentacion_id
          `)
          .in("id", loteIds);

      if (errorLotes) {
        throw errorLotes;
      }

      // -------------------------------------------------
      // 5. Cargar presentaciones
      // -------------------------------------------------

      const presentacionIds = [
        ...new Set(
          (lotes ?? [])
            .map((lote) => lote.presentacion_id)
            .filter(Boolean)
        ),
      ];

      let presentaciones: {
        id: string;
        nombre: string;
      }[] = [];

      if (presentacionIds.length > 0) {
        const {
          data,
          error: errorPresentaciones,
        } = await supabase
          .from("presentaciones")
          .select(`
            id,
            nombre
          `)
          .in("id", presentacionIds);

        if (errorPresentaciones) {
          throw errorPresentaciones;
        }

        presentaciones = data ?? [];
      }

      // -------------------------------------------------
      // 6. Cargar usuarios
      // -------------------------------------------------

      let usuarios: {
        id: string;
        nombre: string;
      }[] = [];

      if (usuarioIds.length > 0) {
        const {
          data,
          error: errorUsuarios,
        } = await supabase
          .from("usuarios")
          .select(`
            id,
            nombre
          `)
          .in("id", usuarioIds);

        if (errorUsuarios) {
          throw errorUsuarios;
        }

        usuarios = data ?? [];
      }

      // -------------------------------------------------
      // 7. Mapa presentaciones
      // -------------------------------------------------

      const presentacionesMap = new Map(
        presentaciones.map((presentacion) => [
          presentacion.id,
          {
            nombre: presentacion.nombre,
          },
        ])
      );

      // -------------------------------------------------
      // 8. Mapa lotes
      // -------------------------------------------------

      const lotesMap = new Map(
        (lotes ?? []).map((lote) => [
          lote.id,
          {
            codigo_lote: lote.codigo_lote,

            presentaciones:
              lote.presentacion_id
                ? presentacionesMap.get(
                    lote.presentacion_id
                  ) ?? null
                : null,
          },
        ])
      );

      // -------------------------------------------------
      // 9. Mapa usuarios
      // -------------------------------------------------

      const usuariosMap = new Map(
        usuarios.map((usuario) => [
          usuario.id,
          {
            nombre: usuario.nombre,
          },
        ])
      );

      // -------------------------------------------------
      // 10. Unir información
      // -------------------------------------------------

      const procesamientosFinales: Procesamiento[] =
        procesos.map((proceso) => ({
          id: proceso.id,
          lote_id: proceso.lote_id,
          fecha_proceso: proceso.fecha_proceso,

          kilos_entrada: Number(
            proceso.kilos_entrada
          ),

          kilos_salida: Number(
            proceso.kilos_salida
          ),

          observaciones:
            proceso.observaciones,

          usuario_id:
            proceso.usuario_id,

          lotes:
            lotesMap.get(
              proceso.lote_id
            ) ?? null,

          usuarios:
            proceso.usuario_id
              ? usuariosMap.get(
                  proceso.usuario_id
                ) ?? null
              : null,
        }));

      console.log(
        "Procesamientos finales:",
        procesamientosFinales
      );

      setProcesamientos(
        procesamientosFinales
      );

    } catch (error) {
      console.error(
        "Error cargando procesamientos:",
        error
      );

      alert(
        "No se pudieron cargar los procesamientos"
      );

      setProcesamientos([]);

    } finally {
      setCargando(false);
    }
  }

  // =====================================================
  // NUEVO
  // =====================================================

  function abrirNuevo() {
    setProcesamientoEditar(null);
    setModalAbierto(true);
  }

  // =====================================================
  // EDITAR
  // =====================================================

  function abrirEditar(
    proceso: Procesamiento
  ) {
    setProcesamientoEditar({
      id: proceso.id,

      lote_id:
        proceso.lote_id,

      kilos_entrada:
        Number(proceso.kilos_entrada),

      kilos_salida:
        Number(proceso.kilos_salida),

      observaciones:
        proceso.observaciones ?? "",
    });

    setModalAbierto(true);
  }

  // =====================================================
  // OBTENER USUARIO DE LA TABLA usuarios
  // =====================================================

  async function obtenerUsuarioDbId() {
    if (!user?.id) {
      return null;
    }

    // Si user.id es el auth.users.id
    const { data, error } =
      await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

    if (error) {
      console.error(
        "Error buscando usuario:",
        error
      );

      return null;
    }

    return data?.id ?? null;
  }

  // =====================================================
  // GUARDAR / EDITAR
  // =====================================================

  async function guardarProcesamiento(
    procesamiento: ProcesamientoForm
  ) {
    try {
      // -------------------------------------------------
      // EDITAR
      // -------------------------------------------------

      if (procesamiento.id) {
        const { error } =
          await supabase
            .from("procesamientos")
            .update({
              lote_id:
                procesamiento.lote_id,

              kilos_entrada:
                procesamiento.kilos_entrada,

              kilos_salida:
                procesamiento.kilos_salida,

              observaciones:
                procesamiento.observaciones,
            })
            .eq(
              "id",
              procesamiento.id
            );

        if (error) {
          throw error;
        }

        alert(
          "Procesamiento actualizado correctamente"
        );

      } else {
        // -------------------------------------------------
        // CREAR
        // -------------------------------------------------

        const { error } = await supabase
        .from("procesamientos")
        .insert({
          lote_id: procesamiento.lote_id,
          kilos_entrada: procesamiento.kilos_entrada,
          kilos_salida: procesamiento.kilos_salida,
          observaciones: procesamiento.observaciones,
          usuario_id: user?.id ?? null,
        });


        if (error) {
          throw error;
        }

        alert(
          "Procesamiento registrado correctamente"
        );
      }

      // Cerrar modal
      setModalAbierto(false);
      setProcesamientoEditar(null);

      // Recargar tabla
      await cargarProcesamientos();

    } catch (error) {
      console.error(
        "Error guardando procesamiento:",
        error
      );

      alert(
        "No se pudo guardar el procesamiento"
      );
    }
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function eliminarProcesamiento(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Está seguro de eliminar este procesamiento?"
      );

    if (!confirmar) {
      return;
    }

    const { error } =
      await supabase
        .from("procesamientos")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Error eliminando procesamiento:",
        error
      );

      alert(
        "No se pudo eliminar el procesamiento"
      );

      return;
    }

    alert(
      "Procesamiento eliminado correctamente"
    );

    await cargarProcesamientos();
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const procesosFiltrados =
    procesamientos.filter(
      (proceso) => {

        const codigoLote =
          proceso.lotes?.codigo_lote
            ?.toLowerCase() ?? "";

        const formato =
          proceso.lotes?.presentaciones
            ?.nombre
            ?.toLowerCase() ?? "";

        const busqueda =
          searchTerm.toLowerCase();

        return (
          codigoLote.includes(busqueda) ||
          formato.includes(busqueda)
        );
      }
    );

  // =====================================================
  // FECHA
  // =====================================================

  const formatDate = (
    dateString: string
  ) => {
    return new Intl.DateTimeFormat(
      "es-CL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(dateString)
    );
  };

  // =====================================================
  // RESUMEN
  // =====================================================

  const totalProcesado =
    procesamientos.reduce(
      (sum, p) =>
        sum +
        Number(
          p.kilos_entrada
        ),
      0
    );

  const totalSalida =
    procesamientos.reduce(
      (sum, p) =>
        sum +
        Number(
          p.kilos_salida
        ),
      0
    );

  const totalMerma =
    totalProcesado -
    totalSalida;

  const rendimientoPromedio =
    totalProcesado > 0
      ? (totalSalida /
          totalProcesado) *
        100
      : 0;

  // =====================================================
  // HTML
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Procesamiento Productivo
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Registro de procesos y rendimientos
          </p>

        </div>

        {canRegister && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proceso
          </button>
        )}

      </div>

      {/* TABLA */}

      <div className="bg-white p-6 rounded-xl border border-gray-200">

        <div className="mb-6">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Buscar por lote o formato..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b border-gray-200">

                <th className="text-left py-3 px-4 text-gray-700">
                  Lote
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Fecha
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Kg Entrada
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Kg Salida
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Merma
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Rendimiento
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Formato
                </th>

                <th className="text-left py-3 px-4 text-gray-700">
                  Responsable
                </th>

                <th className="text-right py-3 px-4 text-gray-700">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan={9}
                    className="text-center py-10 text-gray-500"
                  >
                    Cargando procesamientos...
                  </td>

                </tr>

              ) : (

                procesosFiltrados.map(
                  (proceso) => {

                    const entrada =
                      Number(
                        proceso.kilos_entrada
                      );

                    const salida =
                      Number(
                        proceso.kilos_salida
                      );

                    const merma =
                      entrada - salida;

                    const rendimiento =
                      entrada > 0
                        ? (salida /
                            entrada) *
                          100
                        : 0;

                    return (

                      <tr
                        key={proceso.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        {/* LOTE */}

                        <td className="py-3 px-4">

                          <div className="flex items-center gap-2">

                            <Factory className="w-4 h-4 text-blue-600" />

                            <span className="text-gray-900">

                              {proceso.lotes
                                ?.codigo_lote ??
                                "-"}

                            </span>

                          </div>

                        </td>

                        {/* FECHA */}

                        <td className="py-3 px-4 text-gray-600">

                          {formatDate(
                            proceso.fecha_proceso
                          )}

                        </td>

                        {/* ENTRADA */}

                        <td className="py-3 px-4 text-gray-900">

                          {entrada.toLocaleString()} kg

                        </td>

                        {/* SALIDA */}

                        <td className="py-3 px-4 text-gray-900">

                          {salida.toLocaleString()} kg

                        </td>

                        {/* MERMA */}

                        <td className="py-3 px-4 text-red-600">

                          {merma.toLocaleString()} kg

                        </td>

                        {/* RENDIMIENTO */}

                        <td className="py-3 px-4">

                          <div className="flex items-center gap-2">

                            <TrendingUp
                              className={`w-4 h-4 ${
                                rendimiento >= 85
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            />

                            <span
                              className={
                                rendimiento >= 85
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }
                            >
                              {rendimiento.toFixed(
                                1
                              )}
                              %
                            </span>

                          </div>

                        </td>

                        {/* FORMATO */}

                        <td className="py-3 px-4 text-gray-900">

                          {proceso.lotes
                            ?.presentaciones
                            ?.nombre ??
                            "-"}

                        </td>

                        {/* RESPONSABLE */}

                        <td className="py-3 px-4 text-gray-600">

                          {proceso.usuarios
                            ?.nombre ??
                            "Sin registrar"}

                        </td>

                        {/* ACCIONES */}

                        <td className="py-3 px-4">

                          <div className="flex justify-end gap-2">

                            {canRegister && (
                              <>

                                <button
                                  onClick={() =>
                                    abrirEditar(
                                      proceso
                                    )
                                  }
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    eliminarProcesamiento(
                                      proceso.id
                                    )
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {!cargando &&
          procesosFiltrados.length === 0 && (

            <div className="text-center py-12">

              <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />

              <p className="text-gray-500">
                No se encontraron procesos
              </p>

            </div>

          )}

      </div>

      {/* RESUMEN */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl border border-gray-200">

          <p className="text-gray-600 mb-2">
            Rendimiento Promedio
          </p>

          <p className="text-gray-900 text-xl font-semibold">
            {rendimientoPromedio.toFixed(1)}%
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">

          <p className="text-gray-600 mb-2">
            Total Procesado
          </p>

          <p className="text-gray-900 text-xl font-semibold">
            {totalProcesado.toLocaleString()} kg
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">

          <p className="text-gray-600 mb-2">
            Total Merma
          </p>

          <p className="text-red-700 text-xl font-semibold">
            {totalMerma.toLocaleString()} kg
          </p>

        </div>

      </div>

      {/* MODAL */}

      <ProcesamientoModal
        isOpen={modalAbierto}

        onClose={() => {
          setModalAbierto(false);
          setProcesamientoEditar(null);
        }}

        onSave={
          guardarProcesamiento
        }

        procesamientoEditar={
          procesamientoEditar
        }
      />

    </div>
  );
}