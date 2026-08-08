import { useEffect, useState } from "react";
import { X, ClipboardCheck } from "lucide-react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../context/AuthContext";

interface Lote {
id: string;
codigo_lote: string;
}

interface EstadoProducto {
id: string;
nombre: string;
color: string | null;
}

interface ControlCalidadEditar {
    id: string;
    lote_id: string | null;
    temperatura: number | null;
    observacion: string | null;
    estado_producto_id: string | null;
    }

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    control?: ControlCalidadEditar | null;
    }

export function NuevoControlCalidadModal({
    onClose,
    onSuccess,
    control,
}: Props) {
const { user } = useAuth();

const [lotes, setLotes] = useState<Lote[]>([]);
const [estados, setEstados] = useState<EstadoProducto[]>([]);

const [loteId, setLoteId] = useState(control?.lote_id ?? "");
const [temperatura, setTemperatura] = useState(
    control?.temperatura !== null &&
    control?.temperatura !== undefined
    ? String(control.temperatura)
    : ""
);
const [observacion, setObservacion] = useState(
    control?.observacion ?? ""
);
const [estadoProductoId, setEstadoProductoId] = useState(
    control?.estado_producto_id ?? ""
);

const [cargando, setCargando] = useState(true);
const [guardando, setGuardando] = useState(false);

useEffect(() => {
    setLoteId(control?.lote_id ?? "");

    setTemperatura(
        control?.temperatura !== null &&
        control?.temperatura !== undefined
        ? String(control.temperatura)
        : ""
    );

    setObservacion(control?.observacion ?? "");

    setEstadoProductoId(
        control?.estado_producto_id ?? ""
    );
    }, [control]);

useEffect(() => {
cargarDatos();
}, []);

async function cargarDatos() {
setCargando(true);

try {
    const [
    { data: lotesData, error: errorLotes },
    { data: estadosData, error: errorEstados },
    ] = await Promise.all([
    supabase
        .from("lotes")
        .select("id, codigo_lote")
        .order("codigo_lote", { ascending: true }),

    supabase
        .from("estados_producto")
        .select("id, nombre, color")
        .order("nombre", { ascending: true }),
    ]);

    if (errorLotes) throw errorLotes;
    if (errorEstados) throw errorEstados;

    setLotes(lotesData ?? []);
    setEstados(estadosData ?? []);
} catch (error) {
    console.error("Error cargando datos de calidad:", error);
    alert("No se pudieron cargar los datos");
} finally {
    setCargando(false);
}
}

async function guardarControl() {
    if (!loteId) {
        alert("Debe seleccionar un lote");
        return;
    }

    if (!estadoProductoId) {
        alert("Debe seleccionar un estado del producto");
        return;
    }

    const temperaturaNumero =
        temperatura.trim() !== ""
        ? Number(temperatura)
        : null;

    if (
        temperaturaNumero !== null &&
        Number.isNaN(temperaturaNumero)
    ) {
        alert("Ingrese una temperatura válida");
        return;
    }

    try {
        setGuardando(true);

        const datos = {
        lote_id: loteId,
        temperatura: temperaturaNumero,
        observacion: observacion.trim() || null,
        estado_producto_id: estadoProductoId,
        };

        // ==========================================
        // EDITAR
        // ==========================================
        if (control?.id) {
        const { error } = await supabase
            .from("control_calidad")
            .update(datos)
            .eq("id", control.id);

        if (error) throw error;
        }

        // ==========================================
        // CREAR
        // ==========================================
        else {
        const { error } = await supabase
            .from("control_calidad")
            .insert({
            ...datos,
            usuario_id: user?.id ?? null,
            });

        if (error) throw error;
        }

        onSuccess();
        onClose();

    } catch (error) {
        console.error(
        "Error guardando control de calidad:",
        error
        );

        alert(
        control?.id
            ? "No se pudo actualizar el control de calidad"
            : "No se pudo registrar el control de calidad"
        );

    } finally {
        setGuardando(false);
    }
    }

return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">

    {/* HEADER */}
    <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
        </div>

        <div>
            <h2 className="text-lg font-semibold text-gray-900">
            {control?.id
                ? "Editar Control de Calidad"
                : "Nuevo Control de Calidad"}
            </h2>

            <p className="text-sm text-gray-500">
            {control?.id
                ? "Modifique la información de la inspección"
                : "Registre la inspección del lote"}
            </p>
        </div>
        </div>

        <button
        onClick={onClose}
        disabled={guardando}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
        <X className="w-5 h-5" />
        </button>
    </div>

    {/* CONTENIDO */}
    <div className="p-6 space-y-5">

        {/* LOTE */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Lote *
        </label>

        <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            disabled={cargando || guardando}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
            <option value="">
            {cargando
                ? "Cargando lotes..."
                : "Seleccione un lote"}
            </option>

            {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
                {lote.codigo_lote}
            </option>
            ))}
        </select>
        </div>

        {/* TEMPERATURA */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperatura
        </label>

        <div className="relative">
            <input
            type="number"
            step="0.01"
            value={temperatura}
            onChange={(e) =>
                setTemperatura(e.target.value)
            }
            disabled={guardando}
            placeholder="Ej: 4.50"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            °C
            </span>
        </div>
        </div>

        {/* ESTADO */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado del producto *
        </label>

        <select
            value={estadoProductoId}
            onChange={(e) =>
            setEstadoProductoId(e.target.value)
            }
            disabled={cargando || guardando}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
            <option value="">
            Seleccione un estado
            </option>

            {estados.map((estado) => (
            <option key={estado.id} value={estado.id}>
                {estado.nombre}
            </option>
            ))}
        </select>
        </div>

        {/* OBSERVACIÓN */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Observación
        </label>

        <textarea
            value={observacion}
            onChange={(e) =>
            setObservacion(e.target.value)
            }
            disabled={guardando}
            rows={4}
            placeholder="Ingrese observaciones sobre la inspección..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        </div>

    </div>

    {/* FOOTER */}
    <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">

        <button
        onClick={onClose}
        disabled={guardando}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
        >
        Cancelar
        </button>

        <button
        onClick={guardarControl}
        disabled={guardando || cargando}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
        <ClipboardCheck className="w-4 h-4" />

        {guardando
            ? "Guardando..."
            : control?.id
            ? "Guardar Cambios"
            : "Registrar Control"}
        </button>

    </div>
    </div>
</div>
);
}