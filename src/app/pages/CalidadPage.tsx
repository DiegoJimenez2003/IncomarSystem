import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../../utils/supabase";
import { NuevoControlCalidadModal } from "../components/Productos/NuevoControlCalidadModal";

interface ControlCalidad {
  id: string;
  lote_id: string | null;
  usuario_id: string | null;
  temperatura: number | null;
  observacion: string | null;
  fecha: string;
  estado_producto_id: string | null;

  lotes?: {
    codigo_lote: string;
  } | null;

  usuarios?: {
    nombre: string;
  } | null;

  estados_producto?: {
    nombre: string;
    color: string | null;
  } | null;
}

export function CalidadPage() {
  const { user } = useAuth();

  const [controles, setControles] = useState<ControlCalidad[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [controlSeleccionado, setControlSeleccionado] =
    useState<ControlCalidad | null>(null);

  
  const canRegister =
    user?.rol === "administrador" ||
    user?.rol === "calidad";

  useEffect(() => {
    cargarControles();

    const canal = supabase
      .channel("control-calidad-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "control_calidad",
        },
        () => {
          cargarControles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // =====================================================
  // CARGAR CONTROLES
  // =====================================================

  async function cargarControles() {
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("control_calidad")
        .select(`
          id,
          lote_id,
          usuario_id,
          temperatura,
          observacion,
          fecha,
          estado_producto_id,

          lotes (
            codigo_lote
          ),

          usuarios (
            nombre
          ),

          estados_producto (
            nombre,
            color
          )
        `)
        .order("fecha", { ascending: false });

      if (error) throw error;

      const controlesFinales: ControlCalidad[] =
        (data ?? []).map((control: any) => ({
          id: control.id,
          lote_id: control.lote_id,
          usuario_id: control.usuario_id,

          temperatura:
            control.temperatura !== null
              ? Number(control.temperatura)
              : null,

          observacion: control.observacion,
          fecha: control.fecha,
          estado_producto_id:
            control.estado_producto_id,

          // Supabase puede devolver relaciones como array
          lotes:
            Array.isArray(control.lotes)
              ? control.lotes[0] ?? null
              : control.lotes ?? null,

          usuarios:
            Array.isArray(control.usuarios)
              ? control.usuarios[0] ?? null
              : control.usuarios ?? null,

          estados_producto:
            Array.isArray(control.estados_producto)
              ? control.estados_producto[0] ?? null
              : control.estados_producto ?? null,
        }));

      setControles(controlesFinales);
    } catch (error) {
      console.error(
        "Error cargando controles de calidad:",
        error
      );

      setControles([]);
    } finally {
      setCargando(false);
    }
  }

  async function eliminarControl(id: string) {
  const confirmar = window.confirm(
    "¿Está seguro de eliminar este control de calidad?"
  );

  if (!confirmar) return;

  try {
    const { error } = await supabase
      .from("control_calidad")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await cargarControles();
  } catch (error) {
    console.error(
      "Error eliminando control de calidad:",
      error
    );

    alert("No se pudo eliminar el control de calidad");
  }
}


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
  // ESTADO
  // =====================================================

  const obtenerEstado = (
    control: ControlCalidad
  ) => {
    return (
      control.estados_producto?.nombre
        ?.toLowerCase()
        .trim() ?? ""
    );
  };

  const getEstadoIcon = (
    control: ControlCalidad
  ) => {
    const estado = obtenerEstado(control);

    if (
      estado.includes("aprob") ||
      estado.includes("liber")
    ) {
      return (
        <CheckCircle className="w-5 h-5 text-green-600" />
      );
    }

    if (
      estado.includes("rechaz") ||
      estado.includes("bloque")
    ) {
      return (
        <XCircle className="w-5 h-5 text-red-600" />
      );
    }

    return (
      <AlertCircle className="w-5 h-5 text-yellow-600" />
    );
  };

  const getEstadoBadge = (
    control: ControlCalidad
  ) => {
    const estado = obtenerEstado(control);

    if (
      estado.includes("aprob") ||
      estado.includes("liber")
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      estado.includes("rechaz") ||
      estado.includes("bloque")
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const getEstadoCard = (
    control: ControlCalidad
  ) => {
    const estado = obtenerEstado(control);

    if (
      estado.includes("rechaz") ||
      estado.includes("bloque")
    ) {
      return "border-red-200 bg-red-50";
    }

    if (
      estado.includes("aprob") ||
      estado.includes("liber")
    ) {
      return "border-green-200 bg-green-50";
    }

    return "border-yellow-200 bg-yellow-50";
  };

  // =====================================================
  // FILTROS
  // =====================================================

  const controlesFiltrados = controles.filter(
    (control) => {
      const lote =
        control.lotes?.codigo_lote
          ?.toLowerCase() ?? "";

      const estado =
        obtenerEstado(control);

      const busqueda =
        searchTerm.toLowerCase();

      const matchesSearch =
        lote.includes(busqueda);

      const matchesEstado =
        filtroEstado === "todos" ||
        estado === filtroEstado;

      return (
        matchesSearch &&
        matchesEstado
      );
    }
  );

  // =====================================================
  // RESUMEN
  // =====================================================

  const aprobados = controles.filter((control) => {
    const estado = obtenerEstado(control);

    return (
      estado.includes("aprob") ||
      estado.includes("liber")
    );
  }).length;

  const rechazados = controles.filter((control) => {
    const estado = obtenerEstado(control);

    return (
      estado.includes("rechaz") ||
      estado.includes("bloque")
    );
  }).length;

  const observados =
    controles.length -
    aprobados -
    rechazados;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-start justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Control de Calidad
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Inspecciones y validaciones de producto
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.sernapesca.cl/informacion-utilidad/nominas-0/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Nómina de habilitación sanitaria de embarcaciones artesanales (Sernapesca)"
          >
            <ExternalLink className="w-5 h-5" />
            Nómina Sernapesca
          </a>

          {canRegister && (
            <button
              onClick={() => {
              setControlSeleccionado(null);
              setModalAbierto(true);
            }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Control
            </button>
          )}
        </div>

      </div>

      {/* TABLA / CONTROLES */}

      <div className="bg-white p-6 rounded-xl border border-gray-200">

        {/* FILTROS */}

        <div className="flex flex-col md:flex-row gap-4 mb-6">

          <div className="flex-1 relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Buscar por lote..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

          </div>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="aprobado">
              Aprobado
            </option>

            <option value="observado">
              Observado
            </option>

            <option value="rechazado">
              Rechazado
            </option>
          </select>

        </div>

        {/* CONTROLES */}

        {cargando ? (

          <div className="text-center py-12 text-gray-500">
            Cargando controles de calidad...
          </div>

        ) : (

          <div className="space-y-4">

            {controlesFiltrados.map(
              (control) => {

                const estado =
                  control.estados_producto
                    ?.nombre ?? "Sin estado";

                return (
                  <div
                    key={control.id}
                    className={`p-5 rounded-xl border-2 ${getEstadoCard(
                      control
                    )}`}
                  >

                    {/* CABECERA */}

                    <div className="flex items-start justify-between mb-4">

                      <div className="flex items-center gap-3">

                        {getEstadoIcon(
                          control
                        )}

                        <div>

                          <h3 className="text-gray-900 font-medium">
                            Lote{" "}
                            {control.lotes
                              ?.codigo_lote ??
                              "-"}

                          </h3>

                          <p className="text-sm text-gray-600">
                            {formatDate(
                              control.fecha
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <span
                          className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(
                            control
                          )}`}
                        >
                          {estado}
                        </span>

                        {canRegister && (
                          <>
                            <button
                              onClick={() => {
                                setControlSeleccionado(control);
                                setModalAbierto(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => eliminarControl(control.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                      </div>

                    </div>

                    {/* INFORMACIÓN */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      <div>
                        <p className="text-xs text-gray-600">
                          Inspector
                        </p>

                        <p className="text-sm text-gray-900">
                          {control.usuarios
                            ?.nombre ??
                            "Sin registrar"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">
                          Temperatura
                        </p>

                        <p className="text-sm text-gray-900">
                          {control.temperatura !==
                          null
                            ? `${control.temperatura} °C`
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">
                          Estado del producto
                        </p>

                        <div className="flex items-center gap-2">

                          <Tag className="w-4 h-4 text-gray-500" />

                          <p className="text-sm text-gray-900">
                            {estado}
                          </p>

                        </div>
                      </div>

                    </div>

                    {/* OBSERVACIÓN */}

                    {control.observacion && (
                      <div className="mt-4 pt-4 border-t border-gray-200">

                        <p className="text-xs text-gray-600 mb-1">
                          Observación
                        </p>

                        <p className="text-sm text-gray-900">
                          {control.observacion}
                        </p>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

        {/* SIN RESULTADOS */}

        {!cargando &&
          controlesFiltrados.length === 0 && (

            <div className="text-center py-12">

              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />

              <p className="text-gray-500">
                No se encontraron controles
              </p>

            </div>
          )}

      </div>

      {/* RESUMEN */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-gray-700 mb-2">
            Aprobados
          </p>

          <p className="text-green-700 text-xl font-semibold">
            {aprobados}
          </p>
        </div>

        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <p className="text-gray-700 mb-2">
            Con Observaciones
          </p>

          <p className="text-yellow-700 text-xl font-semibold">
            {observados}
          </p>
        </div>

        <div className="bg-red-50 p-5 rounded-xl border border-red-100">
          <p className="text-gray-700 mb-2">
            Rechazados
          </p>

          <p className="text-red-700 text-xl font-semibold">
            {rechazados}
          </p>
        </div>

      </div>

      {/* MODAL */}

      {modalAbierto && (
        <NuevoControlCalidadModal
          control={controlSeleccionado}
          onClose={() => {
            setModalAbierto(false);
            setControlSeleccionado(null);
          }}
          onSuccess={cargarControles}
        />
      )}

    </div>
  );
}