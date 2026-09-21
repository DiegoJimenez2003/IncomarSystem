import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { X, Plus, Trash2, Ship, Search } from "lucide-react";
import { supabase } from '../../../utils/supabase';
import { useAuth } from "../../context/AuthContext";

interface LoteDisponible {
id: string;
codigo_lote: string;
kilos_disponibles: number;
cajas_disponibles: number;
}

// Lote con lo que aún queda por embarcar (descontando lo ya agregado a la lista)
interface LoteConRestante extends LoteDisponible {
kilos_restantes: number;
cajas_restantes: number;
}

interface ItemEmbarque {
lote_id: string;
codigo_lote: string;
kilos: number;
cajas: number;
disponible_kg: number;
disponible_cajas: number;
}

interface Props {
onClose: () => void;
onSuccess: () => void;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function NuevoEmbarqueModal({ onClose, onSuccess }: Props) {
const { user } = useAuth();

const [cliente, setCliente] = useState("");
const [destino, setDestino] = useState("");
const [transporte, setTransporte] = useState("");
const [fechaEmbarque, setFechaEmbarque] = useState(
new Date().toISOString().slice(0, 10)
);
const [observaciones, setObservaciones] = useState("");

const [lotesDisponibles, setLotesDisponibles] = useState<LoteDisponible[]>([]);
const [loteSeleccionado, setLoteSeleccionado] = useState("");
const [kilosInput, setKilosInput] = useState("");
const [cajasInput, setCajasInput] = useState("");

// Buscador del selector de lotes
const [busquedaLote, setBusquedaLote] = useState("");
const [listaAbierta, setListaAbierta] = useState(false);
const [indiceResaltado, setIndiceResaltado] = useState(0);
const comboRef = useRef<HTMLDivElement>(null);

const [items, setItems] = useState<ItemEmbarque[]>([]);
const [guardando, setGuardando] = useState(false);
const [cargandoLotes, setCargandoLotes] = useState(true);

useEffect(() => {
cargarLotesDisponibles();
}, []);

// Cierra la lista al hacer clic fuera del buscador
useEffect(() => {
function cerrarSiClickFuera(e: MouseEvent) {
    if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
    setListaAbierta(false);
    }
}
document.addEventListener("mousedown", cerrarSiClickFuera);
return () => document.removeEventListener("mousedown", cerrarSiClickFuera);
}, []);

// Mantiene visible la opción resaltada al navegar con el teclado
useEffect(() => {
if (!listaAbierta) return;
document
    .getElementById(`opcion-lote-${indiceResaltado}`)
    ?.scrollIntoView({ block: "nearest" });
}, [indiceResaltado, listaAbierta]);

// =====================================================
// LOTES CON KILOS ASIGNADOS A RACKS (inventario embarcable)
// =====================================================

async function cargarLotesDisponibles() {
setCargandoLotes(true);

try {
    const { data: detalle, error: errorDetalle } = await supabase
    .from("detalle_lote")
    .select("lote_id, kilos, cajas");

    if (errorDetalle) throw errorDetalle;

    const loteIds = [
    ...new Set((detalle ?? []).map((d) => d.lote_id).filter(Boolean)),
    ] as string[];

    if (loteIds.length === 0) {
    setLotesDisponibles([]);
    return;
    }

    const { data: lotes, error: errorLotes } = await supabase
    .from("lotes")
    .select("id, codigo_lote")
    .in("id", loteIds);

    if (errorLotes) throw errorLotes;

    const disponiblesMap = new Map<string, { kilos: number; cajas: number }>();

    (detalle ?? []).forEach((d) => {
    if (!d.lote_id) return;
    const actual = disponiblesMap.get(d.lote_id) ?? { kilos: 0, cajas: 0 };
    disponiblesMap.set(d.lote_id, {
        kilos: actual.kilos + Number(d.kilos ?? 0),
        cajas: actual.cajas + Number(d.cajas ?? 0),
    });
    });

    const resultado: LoteDisponible[] = (lotes ?? [])
    .map((l) => {
        const disp = disponiblesMap.get(l.id) ?? { kilos: 0, cajas: 0 };
        return {
        id: l.id,
        codigo_lote: l.codigo_lote,
        kilos_disponibles: disp.kilos,
        cajas_disponibles: disp.cajas,
        };
    })
    .filter((l) => l.kilos_disponibles > 0)
    .sort((a, b) => a.codigo_lote.localeCompare(b.codigo_lote));

    setLotesDisponibles(resultado);
} catch (error) {
    console.error("Error cargando lotes disponibles:", error);
    setLotesDisponibles([]);
} finally {
    setCargandoLotes(false);
}
}

// =====================================================
// BUSCADOR DE LOTES
// =====================================================

// Lotes con lo que todavía se puede embarcar (descontando lo ya agregado)
const lotesConRestante = useMemo<LoteConRestante[]>(() => {
return lotesDisponibles
    .map((l) => {
    const usados = items.filter((i) => i.lote_id === l.id);
    return {
        ...l,
        kilos_restantes: redondear(
        l.kilos_disponibles - usados.reduce((s, i) => s + i.kilos, 0)
        ),
        cajas_restantes:
        l.cajas_disponibles - usados.reduce((s, i) => s + i.cajas, 0),
    };
    })
    .filter((l) => l.kilos_restantes > 0);
}, [lotesDisponibles, items]);

// Lista filtrada por lo que se escribe en el buscador
const opciones = useMemo(() => {
const q = busquedaLote.trim().toLowerCase();
if (!q) return lotesConRestante;
return lotesConRestante.filter((l) =>
    l.codigo_lote.toLowerCase().includes(q)
);
}, [lotesConRestante, busquedaLote]);

const loteSel = lotesConRestante.find((l) => l.id === loteSeleccionado) ?? null;

function abrirLista() {
if (listaAbierta) return;
setListaAbierta(true);
setBusquedaLote("");
setIndiceResaltado(0);
}

function seleccionarLote(l: LoteConRestante) {
setLoteSeleccionado(l.id);
setBusquedaLote("");
setListaAbierta(false);

// Se completa con lo que queda del lote; el usuario puede editarlo
setKilosInput(String(l.kilos_restantes));
setCajasInput(l.cajas_restantes > 0 ? String(l.cajas_restantes) : "");
}

function manejarTecla(e: KeyboardEvent<HTMLInputElement>) {
if (e.key === "ArrowDown") {
    e.preventDefault();
    setListaAbierta(true);
    setIndiceResaltado((i) => Math.min(i + 1, opciones.length - 1));
} else if (e.key === "ArrowUp") {
    e.preventDefault();
    setIndiceResaltado((i) => Math.max(i - 1, 0));
} else if (e.key === "Enter") {
    e.preventDefault();
    if (listaAbierta && opciones[indiceResaltado]) {
    seleccionarLote(opciones[indiceResaltado]);
    }
} else if (e.key === "Escape") {
    setListaAbierta(false);
}
}

// Al cambiar los kilos, las cajas se recalculan proporcionalmente
// al stock del lote (siguen siendo editables a mano).
function cambiarKilos(valor: string) {
setKilosInput(valor);

if (!loteSel) return;

const kilos = Number(valor);

if (valor === "" || !Number.isFinite(kilos) || kilos <= 0) {
    setCajasInput("");
    return;
}

if (loteSel.cajas_restantes <= 0) return;

const cajas = Math.round(
    (kilos * loteSel.cajas_restantes) / loteSel.kilos_restantes
);
setCajasInput(String(Math.min(cajas, loteSel.cajas_restantes)));
}

// =====================================================
// AGREGAR ITEM AL EMBARQUE (en memoria, aún no se guarda)
// =====================================================

function agregarItem() {
const lote = lotesDisponibles.find((l) => l.id === loteSeleccionado);
if (!lote) {
    alert("Seleccione un lote");
    return;
}

const kilos = Number(kilosInput);
const cajas = cajasInput ? Number(cajasInput) : 0;

if (!kilos || kilos <= 0) {
    alert("Ingrese una cantidad de kilos válida");
    return;
}

const yaUsado = items
    .filter((i) => i.lote_id === lote.id)
    .reduce((sum, i) => sum + i.kilos, 0);

const yaUsadoCajas = items
    .filter((i) => i.lote_id === lote.id)
    .reduce((sum, i) => sum + i.cajas, 0);

if (kilos > lote.kilos_disponibles - yaUsado) {
    alert(
    `Solo quedan ${lote.kilos_disponibles - yaUsado} kg disponibles de este lote`
    );
    return;
}

if (cajas > lote.cajas_disponibles - yaUsadoCajas) {
    alert(
    `Solo quedan ${lote.cajas_disponibles - yaUsadoCajas} cajas disponibles de este lote`
    );
    return;
}

setItems((prev) => [
    ...prev,
    {
    lote_id: lote.id,
    codigo_lote: lote.codigo_lote,
    kilos,
    cajas,
    disponible_kg: lote.kilos_disponibles,
    disponible_cajas: lote.cajas_disponibles,
    },
]);

setLoteSeleccionado("");
setBusquedaLote("");
setListaAbierta(false);
setKilosInput("");
setCajasInput("");
}

function quitarItem(index: number) {
setItems((prev) => prev.filter((_, i) => i !== index));
}

// =====================================================
// DESCONTAR DE RACKS (FIFO por fecha_ingreso) Y GENERAR
// UN MOVIMIENTO DE SALIDA POR CADA RACK AFECTADO
// =====================================================

async function descontarDeRacksYRegistrarMovimientos(
loteId: string,
kilosADescontar: number,
cajasADescontar: number,
embarqueId: string,
codigoLote: string,
codigoEmbarque: string,
tipoSalidaId: string,
usuarioDbId: string | null
) {
const { data: asignaciones, error } = await supabase
    .from("detalle_lote")
    .select("id, rack_id, kilos, cajas, fecha_ingreso")
    .eq("lote_id", loteId)
    .order("fecha_ingreso", { ascending: true });

if (error) {
    console.error("Error obteniendo asignaciones de rack:", error);
    throw error;
}

let kilosRestantes = kilosADescontar;
let cajasRestantes = cajasADescontar;

for (const asignacion of asignaciones ?? []) {
    if (kilosRestantes <= 0) break;

    const kilosDisponiblesFila = Number(asignacion.kilos ?? 0);
    const cajasDisponiblesFila = Number(asignacion.cajas ?? 0);
    if (kilosDisponiblesFila <= 0) continue;

    const kilosATomar = Math.min(kilosDisponiblesFila, kilosRestantes);
    const cajasATomar = Math.min(cajasDisponiblesFila, cajasRestantes);

    // Actualizar o eliminar la fila de detalle_lote
    const kilosNuevos = kilosDisponiblesFila - kilosATomar;
    const cajasNuevas = cajasDisponiblesFila - cajasATomar;

    if (kilosNuevos <= 0) {
    const { error: errorDelete } = await supabase
        .from("detalle_lote")
        .delete()
        .eq("id", asignacion.id);
    if (errorDelete) throw errorDelete;
    } else {
    const { error: errorUpdate } = await supabase
        .from("detalle_lote")
        .update({ kilos: kilosNuevos, cajas: cajasNuevas })
        .eq("id", asignacion.id);
    if (errorUpdate) throw errorUpdate;
    }

    // Registrar movimiento de salida por este rack
    const { error: errorMovimiento } = await supabase
    .from("movimientos")
    .insert({
        lote_id: loteId,
        tipo_movimiento_id: tipoSalidaId,
        rack_id: asignacion.rack_id,
        usuario_id: usuarioDbId,
        cantidad_kg: kilosATomar,
        cantidad_cajas: cajasATomar || null,
        descripcion: `Embarque ${codigoEmbarque} — salida del lote ${codigoLote}`,
    });

    if (errorMovimiento) throw errorMovimiento;

    kilosRestantes -= kilosATomar;
    cajasRestantes -= cajasATomar;
}

if (kilosRestantes > 0) {
    console.warn(
    `Quedaron ${kilosRestantes} kg del lote ${codigoLote} sin poder descontarse de ningún rack (inconsistencia de datos).`
    );
}
}

// =====================================================
// GUARDAR EMBARQUE COMPLETO
// =====================================================

async function guardarEmbarque() {
if (!cliente.trim()) {
    alert("Ingrese el cliente");
    return;
}

if (items.length === 0) {
    alert("Agregue al menos un lote al embarque");
    return;
}

try {
    setGuardando(true);

    const usuarioDbId = user?.id ?? null;

    // Estado inicial: "preparando"
    const { data: estadoInicial, error: errorEstado } = await supabase
    .from("estados_embarque")
    .select("id")
    .eq("nombre", "preparando")
    .single();

    if (errorEstado) throw errorEstado;

    // Código de embarque simple y único
    const codigoEmbarque = `EMB-${Date.now()}`;

    const { data: embarque, error: errorEmbarque } = await supabase
    .from("embarques")
    .insert({
        codigo_embarque: codigoEmbarque,
        cliente,
        destino: destino || null,
        transporte: transporte || null,
        fecha_embarque: fechaEmbarque || null,
        observaciones: observaciones || null,
        creado_por: usuarioDbId,
        estado_embarque_id: estadoInicial.id,
    })
    .select("id")
    .single();

    if (errorEmbarque) throw errorEmbarque;

    // Tipo de movimiento "salida"
    const { data: tipoSalida, error: errorTipo } = await supabase
    .from("tipos_movimiento")
    .select("id")
    .eq("nombre", "salida")
    .single();

    if (errorTipo) throw errorTipo;

    // Insertar embarque_detalle + descontar racks + movimientos, por cada item
    for (const item of items) {
    const { error: errorDetalle } = await supabase
        .from("embarque_detalle")
        .insert({
        embarque_id: embarque.id,
        lote_id: item.lote_id,
        kilos: item.kilos,
        cajas: item.cajas || null,
        });

    if (errorDetalle) throw errorDetalle;

    await descontarDeRacksYRegistrarMovimientos(
        item.lote_id,
        item.kilos,
        item.cajas,
        embarque.id,
        item.codigo_lote,
        codigoEmbarque,
        tipoSalida.id,
        usuarioDbId
    );
    }

    onSuccess();
    onClose();
} catch (error) {
    console.error("Error guardando embarque:", error);
    alert("No se pudo registrar el embarque");
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
    <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
        <h2 className="text-xl font-semibold text-gray-900">
            Nuevo Embarque
        </h2>
        <p className="text-sm text-gray-500 mt-1">
            Registra el despacho de uno o varios lotes
        </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
        <X className="w-5 h-5 text-gray-500" />
        </button>
    </div>

    <div className="p-6 space-y-6">
        {/* DATOS DEL EMBARQUE */}
        <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente *
            </label>
            <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Destino
            </label>
            <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Transporte
            </label>
            <input
            type="text"
            value={transporte}
            onChange={(e) => setTransporte(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de embarque
            </label>
            <input
            type="date"
            value={fechaEmbarque}
            onChange={(e) => setFechaEmbarque(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
            </label>
            <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
        </div>

        {/* AGREGAR LOTES */}
        <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700">
            Lotes a embarcar
        </h3>

        <div className="grid grid-cols-4 gap-3">
            {/* Selector de lote con buscador */}
            <div className="col-span-2 relative" ref={comboRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                type="text"
                autoComplete="off"
                value={listaAbierta ? busquedaLote : loteSel?.codigo_lote ?? ""}
                onFocus={abrirLista}
                onClick={abrirLista}
                onChange={(e) => {
                    setBusquedaLote(e.target.value);
                    setIndiceResaltado(0);
                    setListaAbierta(true);
                }}
                onKeyDown={manejarTecla}
                placeholder={
                    cargandoLotes ? "Cargando lotes..." : "Buscar lote..."
                }
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {listaAbierta && (
                <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                {opciones.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-gray-500">
                    {cargandoLotes
                        ? "Cargando lotes..."
                        : "Ningún lote coincide con la búsqueda"}
                    </li>
                ) : (
                    opciones.map((l, idx) => (
                    <li
                        key={l.id}
                        id={`opcion-lote-${idx}`}
                        onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionarLote(l);
                        }}
                        onMouseEnter={() => setIndiceResaltado(idx)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 ${
                        idx === indiceResaltado ? "bg-blue-50" : ""
                        }`}
                    >
                        <span className="text-sm font-medium text-gray-900">
                        {l.codigo_lote}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                        {l.kilos_restantes.toLocaleString()} kg ·{" "}
                        {l.cajas_restantes.toLocaleString()} cajas
                        </span>
                    </li>
                    ))
                )}
                </ul>
            )}
            </div>

            <input
            type="number"
            placeholder="Kilos"
            value={kilosInput}
            onChange={(e) => cambiarKilos(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
            type="number"
            placeholder="Cajas"
            value={cajasInput}
            onChange={(e) => setCajasInput(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        {loteSel && (
            <p className="text-xs text-gray-500">
            Disponible en {loteSel.codigo_lote}:{" "}
            {loteSel.kilos_restantes.toLocaleString()} kg ·{" "}
            {loteSel.cajas_restantes.toLocaleString()} cajas. Las cajas se
            calculan según los kilos, pero puedes editarlas.
            </p>
        )}

        <button
            onClick={agregarItem}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
            <Plus className="w-4 h-4" />
            Agregar lote al embarque
        </button>

        {items.length > 0 && (
            <div className="space-y-2 pt-2">
            {items.map((item, index) => (
                <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <div>
                    <p className="text-sm text-gray-900">{item.codigo_lote}</p>
                    <p className="text-xs text-gray-500">
                        {item.kilos.toLocaleString()} kg
                        {item.cajas ? ` · ${item.cajas} cajas` : ""}
                    </p>
                    </div>
                </div>
                <button
                    onClick={() => quitarItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                </div>
            ))}
            </div>
        )}
        </div>
    </div>

    <div className="flex justify-end gap-3 px-6 py-4 border-t">
        <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
        Cancelar
        </button>
        <button
        onClick={guardarEmbarque}
        disabled={guardando}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
        {guardando ? "Guardando..." : "Registrar Embarque"}
        </button>
    </div>
    </div>
</div>
);
}