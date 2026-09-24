import { useEffect, useMemo, useState } from 'react';
import { Snowflake, Warehouse } from 'lucide-react';
import { supabase } from '../../../utils/supabase';

// 1 caja = 20 kg (estándar de la planta)
const KG_POR_CAJA = 20;

interface Camara {
id: string;
nombre: string;
tipo: string;
}

interface Asignacion {
id: string;
kilos: number;
cajas: number | null;
racks: {
codigo: string;
ubicacion: string;
} | null;
}

interface Lote {
id: string;
codigo_lote: string;
}

interface Props {
lote: Lote;
onClose: () => void;
onSuccess: () => void;
}

export function MoverACamaraModal({ lote, onClose, onSuccess }: Props) {
const [camaras, setCamaras] = useState<Camara[]>([]);
const [camaraId, setCamaraId] = useState('');
const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
// Fuente de verdad: kilos a mover por rack (string, tal como lo escribe el usuario)
const [cantidades, setCantidades] = useState<Record<string, string>>({});
const [cargando, setCargando] = useState(true);
const [guardando, setGuardando] = useState(false);

useEffect(() => {
cargarDatos();
}, []);

async function cargarDatos() {
setCargando(true);

const [camarasRes, asignacionesRes] = await Promise.all([
    supabase.from('camaras').select('id, nombre, tipo').order('tipo'),
    supabase
    .from('detalle_lote')
    .select(`
        id,
        kilos,
        cajas,
        racks ( codigo, ubicacion )
    `)
    .eq('lote_id', lote.id),
]);

if (camarasRes.error) console.error(camarasRes.error);
if (asignacionesRes.error) console.error(asignacionesRes.error);

if (camarasRes.data) {
    setCamaras(camarasRes.data);
    if (camarasRes.data.length > 0) setCamaraId(camarasRes.data[0].id);
}

if (asignacionesRes.data) {
    setAsignaciones(asignacionesRes.data as any);

    const inicial: Record<string, string> = {};
    asignacionesRes.data.forEach((a: any) => {
    inicial[a.id] = String(a.kilos);
    });
    setCantidades(inicial);
}

setCargando(false);
}

// Cajas disponibles en el rack: si detalle_lote no trae cajas registradas,
// se estima a partir de los kilos como respaldo.
function cajasDisponibles(a: Asignacion) {
return a.cajas ?? Math.floor(Number(a.kilos) / KG_POR_CAJA);
}

function actualizarKilos(id: string, valor: string) {
setCantidades((prev) => ({ ...prev, [id]: valor }));
}

// Editar cajas recalcula los kilos automáticamente (1 caja = 20 kg)
function actualizarCajas(id: string, valor: string) {
if (valor === '') {
    setCantidades((prev) => ({ ...prev, [id]: '' }));
    return;
}
const cajasNum = Number(valor);
const kilosCalc = Number.isFinite(cajasNum) ? cajasNum * KG_POR_CAJA : 0;
setCantidades((prev) => ({ ...prev, [id]: String(kilosCalc) }));
}

// Cantidad de kilos ingresada para un rack (vacío = 0)
function cantidadDe(a: Asignacion) {
return Number(cantidades[a.id] || 0);
}

// Cajas equivalentes a los kilos ingresados (para mostrar como referencia y para el payload)
function cajasDe(a: Asignacion) {
return cantidadDe(a) / KG_POR_CAJA;
}

// Un rack es inválido si el valor no es número, es negativo, supera los kilos
// disponibles, o (cuando se conocen las cajas del rack) supera las cajas disponibles.
function esInvalido(a: Asignacion) {
const kilos = cantidadDe(a);
if (!Number.isFinite(kilos) || kilos < 0 || kilos > Number(a.kilos)) return true;

if (a.cajas != null) {
    const cajasCalc = cajasDe(a);
    if (cajasCalc > a.cajas + 0.001) return true;
}
return false;
}

const hayInvalidos = asignaciones.some(esInvalido);

// Solo los racks con una cantidad válida mayor que 0.
// El total sale de AQUÍ, así lo que se muestra es exactamente lo que se traslada.
const movimientos = useMemo(
() =>
    asignaciones
    .map((a) => ({
        detalleId: a.id,
        kilosAMover: Number(cantidades[a.id] || 0),
        // Cajas redondeadas al entero más cercano: la cámara guarda cajas como unidad física.
        cajasAMover: Math.round(Number(cantidades[a.id] || 0) / KG_POR_CAJA),
    }))
    .filter((m) => Number.isFinite(m.kilosAMover) && m.kilosAMover > 0),
[asignaciones, cantidades]
);

const totalAMover = movimientos.reduce((sum, m) => sum + m.kilosAMover, 0);
const totalCajasAMover = movimientos.reduce((sum, m) => sum + m.cajasAMover, 0);

async function confirmarTraslado() {
if (!camaraId) {
    alert('Debe seleccionar una cámara de destino');
    return;
}

if (hayInvalidos) {
    alert(
    'Revise las cantidades: no pueden ser negativas ni superar los kilos o cajas disponibles de cada rack'
    );
    return;
}

if (movimientos.length === 0) {
    alert('Debe ingresar al menos una cantidad de kilos a mover');
    return;
}

try {
    setGuardando(true);

    // Una sola llamada: la función SQL descuenta los racks y registra
    // el ingreso a cámara dentro de la misma transacción.
    //
    // IMPORTANTE: se agregó "cajas" a cada movimiento. La función
    // trasladar_lote_a_camara en la base de datos todavía debe actualizarse
    // para leer mov->>'cajas', descontarlo de detalle_lote.cajas e insertarlo
    // (sumado) en detalle_camara.cajas. Mientras esa función no se actualice,
    // este valor viajará en el payload pero será ignorado.
    const { error } = await supabase.rpc('trasladar_lote_a_camara', {
    p_lote_id: lote.id,
    p_camara_id: camaraId,
    p_movimientos: movimientos.map((m) => ({
        detalle_id: m.detalleId,
        kilos: m.kilosAMover,
        cajas: m.cajasAMover,
    })),
    });

    if (error) throw error;

    onSuccess();
    onClose();
} catch (error: any) {
    console.error(error);
    alert(error?.message ?? 'Error al trasladar el lote a cámara');
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
        Trasladar a Cámara — Lote {lote.codigo_lote}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
        Selecciona cuántos kilos o cajas de cada rack quieres enviar a cámara. Los racks quedarán liberados según lo enviado.
        </p>
    </div>

    <div className="p-6 space-y-6">
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cámara de destino</label>
        <select
            value={camaraId}
            onChange={(e) => setCamaraId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
            {camaras.map((c) => (
            <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo})
            </option>
            ))}
        </select>
        </div>

        {cargando ? (
        <p className="text-sm text-gray-500">Cargando ubicaciones actuales...</p>
        ) : asignaciones.length === 0 ? (
        <p className="text-sm text-gray-500">Este lote no tiene kilos asignados en ningún rack.</p>
        ) : (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Ubicación actual del lote (racks)</h3>

            {asignaciones.map((a) => {
            const invalido = esInvalido(a);

            return (
                <div
                key={a.id}
                className={`flex items-center justify-between gap-4 p-3 border rounded-lg ${
                    invalido ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                >
                <div className="flex items-center gap-2 flex-1">
                    <Warehouse className="w-4 h-4 text-purple-600" />
                    <div>
                    <p className="text-sm text-gray-900">
                        {a.racks?.codigo} - {a.racks?.ubicacion}
                    </p>
                    <p className="text-xs text-gray-500">
                        Disponible: {Number(a.kilos).toLocaleString()} kg
                        {' · '}
                        {cajasDisponibles(a)} cajas
                    </p>
                    {invalido && (
                        <p className="text-xs text-red-600 mt-0.5">
                        Ingresa un valor entre 0 y {Number(a.kilos).toLocaleString()} kg
                        {a.cajas != null ? ` (máx. ${a.cajas} cajas)` : ''}
                        </p>
                    )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                    <label className="text-[10px] text-gray-400 mb-0.5">Kilos</label>
                    <input
                        type="number"
                        value={cantidades[a.id] ?? ''}
                        onChange={(e) => actualizarKilos(a.id, e.target.value)}
                        max={a.kilos}
                        min={0}
                        step="any"
                        className={`w-24 border rounded-lg px-2 py-2 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        invalido ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    </div>
                    <div className="flex flex-col items-end">
                    <label className="text-[10px] text-gray-400 mb-0.5">Cajas</label>
                    <input
                        type="number"
                        value={cantidades[a.id] ? Number((cajasDe(a)).toFixed(2)) : ''}
                        onChange={(e) => actualizarCajas(a.id, e.target.value)}
                        min={0}
                        step="any"
                        className={`w-20 border rounded-lg px-2 py-2 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        invalido ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    </div>
                </div>
                </div>
            );
            })}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm flex justify-between">
            <div>
                <span className="text-gray-600">Total a trasladar: </span>
                <span className="font-semibold text-blue-700">{totalAMover.toLocaleString()} kg</span>
            </div>
            <div>
                <span className="text-gray-600">≈ </span>
                <span className="font-semibold text-blue-700">{totalCajasAMover} cajas</span>
            </div>
            </div>
        </div>
        )}
    </div>

    <div className="flex justify-end gap-3 px-6 py-4 border-t">
        <button
        onClick={onClose}
        disabled={guardando}
        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
        Cancelar
        </button>

        <button
        onClick={confirmarTraslado}
        disabled={guardando || asignaciones.length === 0 || hayInvalidos || movimientos.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
        <Snowflake className="w-4 h-4" />
        {guardando ? 'Trasladando...' : 'Confirmar Traslado'}
        </button>
    </div>
    </div>
</div>
);
}