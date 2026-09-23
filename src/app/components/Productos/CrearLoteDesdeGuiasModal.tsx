import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface Opcion {
id: string;
nombre: string;
}

interface Guia {
id: string;
numero_guia: string;
lote_origen: string;
especie_id: string;
kilos: number;
}

interface Props {
guias: Guia[];
onClose: () => void;
onSuccess: () => void;
}

const KILOS_POR_CAJA = 20;
const redondear = (n: number) => Math.round(n * 100) / 100;

interface SubLote {
key: string;
sufijo: string;
presentacionId: string;
kilos: string;
cajas: string;
}

function nuevaFilaSubLote(): SubLote {
return {
key: crypto.randomUUID(),
sufijo: '',
presentacionId: '',
kilos: '',
cajas: '',
};
}

export function CrearLoteDesdeGuiasModal({ guias, onClose, onSuccess }: Props) {
const [presentaciones, setPresentaciones] = useState<Opcion[]>([]);
const [estados, setEstados] = useState<Opcion[]>([]);
const [plantas, setPlantas] = useState<Opcion[]>([]);
const [turnos, setTurnos] = useState<Opcion[]>([]);

// Datos compartidos por todo el lote padre / lotes hijos
const [codigoLoteBase, setCodigoLoteBase] = useState('');
const [estadoId, setEstadoId] = useState('');
const [plantaId, setPlantaId] = useState('');
const [turnoId, setTurnoId] = useState('');
const [fechaProduccion, setFechaProduccion] = useState('');
const [temperatura, setTemperatura] = useState('');
const [observaciones, setObservaciones] = useState('');

// Subdivisión en presentaciones
const [subLotes, setSubLotes] = useState<SubLote[]>([nuevaFilaSubLote()]);

const [guardando, setGuardando] = useState(false);

const kilosTotal = guias.reduce((sum, g) => sum + (Number(g.kilos) || 0), 0);
const especieId = guias[0]?.especie_id;
const mismaEspecie = guias.every((g) => g.especie_id === especieId);

const kilosAsignados = subLotes.reduce(
(sum, s) => sum + (Number(s.kilos) || 0),
0
);
const kilosRestantes = Math.round((kilosTotal - kilosAsignados) * 100) / 100;

useEffect(() => {
cargarCombos();

const hoy = new Date().toISOString().slice(0, 10);
setFechaProduccion(hoy);

const observacionesGuias = guias
    .map((g) => `Guía ${g.numero_guia} (lote origen ${g.lote_origen})`)
    .join(', ');
setObservaciones(`Generado desde: ${observacionesGuias}`);
}, []);

async function cargarCombos() {
const [presentacionesRes, estadosRes, plantasRes, turnosRes] = await Promise.all([
    supabase.from('presentaciones').select('id,nombre').order('nombre'),
    supabase.from('estados_producto').select('id,nombre').order('nombre'),
    supabase.from('plantas').select('id,nombre').order('nombre'),
    supabase.from('turnos').select('id,nombre').order('nombre'),
]);

setPresentaciones(presentacionesRes.data ?? []);
setEstados(estadosRes.data ?? []);
setPlantas(plantasRes.data ?? []);
setTurnos(turnosRes.data ?? []);
}

function agregarSubLote() {
setSubLotes((prev) => [...prev, nuevaFilaSubLote()]);
}

function eliminarSubLote(key: string) {
setSubLotes((prev) => prev.filter((s) => s.key !== key));
}

function actualizarSubLote(key: string, campo: keyof SubLote, valor: string) {
setSubLotes((prev) =>
    prev.map((s) => (s.key === key ? { ...s, [campo]: valor } : s))
);
}

// Al escribir kilos en una fila, se completan las cajas (cajas completas de 20 kg).
function cambiarKilosSubLote(key: string, valor: string) {
setSubLotes((prev) =>
    prev.map((s) => {
    if (s.key !== key) return s;

    const n = Number(valor);
    if (valor === '' || !Number.isFinite(n) || n <= 0) {
        return { ...s, kilos: valor };
    }

    const cajasAuto = Math.floor(n / KILOS_POR_CAJA);
    return { ...s, kilos: valor, cajas: cajasAuto > 0 ? String(cajasAuto) : '' };
    })
);
}

// Al escribir cajas en una fila, se completan los kilos (cajas x 20 kg).
function cambiarCajasSubLote(key: string, valor: string) {
setSubLotes((prev) =>
    prev.map((s) => {
    if (s.key !== key) return s;

    const n = Number(valor);
    if (valor === '' || !Number.isFinite(n) || n <= 0) {
        return { ...s, cajas: valor };
    }

    return { ...s, cajas: valor, kilos: String(redondear(n * KILOS_POR_CAJA)) };
    })
);
}

function referenciaKilosCajas(kilos: string) {
const k = Number(kilos) || 0;
if (k <= 0) return null;
const completas = Math.floor(k / KILOS_POR_CAJA);
const sobrante = redondear(k - completas * KILOS_POR_CAJA);
return `${k} kg ÷ ${KILOS_POR_CAJA} kg = ${completas} cajas${
    sobrante > 0 ? ` + ${sobrante} kg sobrantes` : ''
}`;
}

function referenciaCajasKilos(cajas: string) {
const c = Number(cajas) || 0;
if (c <= 0) return null;
return `${c} cajas × ${KILOS_POR_CAJA} kg = ${redondear(
    c * KILOS_POR_CAJA
).toLocaleString()} kg`;
}

async function guardarLote() {
if (!codigoLoteBase.trim()) {
    alert('Debe ingresar el código base del lote interno (ej: 406)');
    return;
}

if (!mismaEspecie) {
    alert('Todas las guías seleccionadas deben ser de la misma especie');
    return;
}

if (!fechaProduccion) {
    alert('Debe seleccionar la fecha de producción');
    return;
}

if (subLotes.length === 0) {
    alert('Debe agregar al menos una presentación');
    return;
}

for (const s of subLotes) {
    if (!s.sufijo.trim()) {
    alert('Todas las filas deben tener un sufijo (ej: E, F, HGT)');
    return;
    }
    if (!s.presentacionId) {
    alert(`Debe seleccionar la presentación para el sufijo "${s.sufijo}"`);
    return;
    }
    if (!s.kilos || Number(s.kilos) <= 0) {
    alert(`Debe ingresar los kilos para "${codigoLoteBase}-${s.sufijo}"`);
    return;
    }
}

const sufijosUnicos = new Set(subLotes.map((s) => s.sufijo.trim().toUpperCase()));
if (sufijosUnicos.size !== subLotes.length) {
    alert('Hay sufijos repetidos. Cada corte/presentación debe tener un sufijo distinto');
    return;
}

if (kilosAsignados > kilosTotal) {
    alert(
    `Los kilos asignados (${kilosAsignados} kg) superan el total de las guías (${kilosTotal} kg)`
    );
    return;
}

if (
    kilosRestantes > 0 &&
    !confirm(
    `Quedan ${kilosRestantes} kg sin asignar a ninguna presentación (se perderán como merma o quedarán solo en el lote padre). ¿Continuar de todas formas?`
    )
) {
    return;
}

try {
    setGuardando(true);

    // 1. Crear el lote padre (materia prima cruda, sin presentación propia)
    const { data: lotePadre, error: errorPadre } = await supabase
    .from('lotes')
    .insert({
        codigo_lote: codigoLoteBase.trim(),
        especie_id: especieId,
        presentacion_id: null,
        estado_producto_id: estadoId || null,
        planta_id: plantaId || null,
        turno_id: turnoId || null,
        fecha_produccion: fechaProduccion,
        kilos_netos: kilosTotal,
        temperatura: temperatura ? Number(temperatura) : null,
        observaciones: observaciones.trim(),
    })
    .select()
    .single();

    if (errorPadre) throw errorPadre;

    // 2. Enlazar las guías al lote padre
    const idsGuias = guias.map((g) => g.id);

    const { error: errorGuias } = await supabase
    .from('guias')
    .update({ lote_id: lotePadre.id })
    .in('id', idsGuias);

    if (errorGuias) throw errorGuias;

    // 3. Crear un lote hijo por cada presentación/corte
    const filasHijos = subLotes.map((s) => ({
    codigo_lote: `${codigoLoteBase.trim()}-${s.sufijo.trim().toUpperCase()}`,
    especie_id: especieId,
    presentacion_id: s.presentacionId,
    estado_producto_id: estadoId || null,
    planta_id: plantaId || null,
    turno_id: turnoId || null,
    fecha_produccion: fechaProduccion,
    kilos_netos: Number(s.kilos),
    cantidad_cajas: s.cajas ? Number(s.cajas) : null,
    temperatura: temperatura ? Number(temperatura) : null,
    lote_padre_id: lotePadre.id,
    }));

    const { error: errorHijos } = await supabase.from('lotes').insert(filasHijos);

    if (errorHijos) throw errorHijos;

    onSuccess();
    onClose();
} catch (error) {
    console.error(error);
    alert('Error al crear el lote y sus presentaciones a partir de las guías');
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

    <h2 className="text-2xl font-semibold mb-2">
        Crear Lote Interno desde Guías
    </h2>
    <p className="text-sm text-gray-500 mb-6">
        Se generará un lote base a partir de {guias.length} guía(s) seleccionada(s), subdividido en las
        presentaciones/cortes que definas abajo.
    </p>

    {/* Resumen de guías seleccionadas */}
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Guías incluidas:</p>
        <ul className="text-sm text-gray-600 space-y-1">
        {guias.map((g) => (
            <li key={g.id}>
            • Guía {g.numero_guia} — Lote origen {g.lote_origen} — {Number(g.kilos).toLocaleString()} kg
            </li>
        ))}
        </ul>
        <p className="text-sm font-semibold text-blue-700 mt-3">
        Total: {kilosTotal.toLocaleString()} kg
        </p>
        {!mismaEspecie && (
        <p className="text-sm text-red-600 mt-2">
            ⚠️ Las guías seleccionadas tienen especies distintas. Deben ser de la misma especie.
        </p>
        )}
    </div>

    {/* Datos compartidos del lote */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Lote Interno (base)
        </label>
        <input
            type="text"
            value={codigoLoteBase}
            onChange={(e) => setCodigoLoteBase(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="Ej: 406"
        />
        <p className="text-xs text-gray-400 mt-1">
            Cada presentación se guardará como {codigoLoteBase || '406'}-[sufijo]
        </p>
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Producción
        </label>
        <input
            type="date"
            value={fechaProduccion}
            onChange={(e) => setFechaProduccion(e.target.value)}
            className="w-full border rounded-lg p-2"
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
        </label>
        <select
            value={estadoId}
            onChange={(e) => setEstadoId(e.target.value)}
            className="w-full border rounded-lg p-2"
        >
            <option value="">Seleccione estado</option>
            {estados.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
        </select>
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Planta
        </label>
        <select
            value={plantaId}
            onChange={(e) => setPlantaId(e.target.value)}
            className="w-full border rounded-lg p-2"
        >
            <option value="">Seleccione planta</option>
            {plantas.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
        </select>
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Turno
        </label>
        <select
            value={turnoId}
            onChange={(e) => setTurnoId(e.target.value)}
            className="w-full border rounded-lg p-2"
        >
            <option value="">Seleccione turno</option>
            {turnos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
        </select>
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperatura
        </label>
        <input
            type="number"
            step="0.1"
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value)}
            className="w-full border rounded-lg p-2"
        />
        </div>
    </div>

    {/* Subdivisión en presentaciones */}
    <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
            Subdivisión por presentación / corte
        </label>
        <span
            className={`text-sm font-semibold ${
            kilosRestantes < 0 ? 'text-red-600' : 'text-gray-600'
            }`}
        >
            Asignado: {kilosAsignados.toLocaleString()} / {kilosTotal.toLocaleString()} kg
            {kilosRestantes !== 0 && ` (restan ${kilosRestantes.toLocaleString()} kg)`}
        </span>
        </div>

        <div className="space-y-3">
        {subLotes.map((s, idx) => (
            <div
            key={s.key}
            className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
            >
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                Sufijo
                </label>
                <input
                type="text"
                value={s.sufijo}
                onChange={(e) =>
                    actualizarSubLote(s.key, 'sufijo', e.target.value)
                }
                className="w-full border rounded-lg p-2"
                placeholder="Ej: E, F, HGT"
                />
            </div>

            <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                Presentación
                </label>
                <select
                value={s.presentacionId}
                onChange={(e) =>
                    actualizarSubLote(s.key, 'presentacionId', e.target.value)
                }
                className="w-full border rounded-lg p-2"
                >
                <option value="">Seleccione presentación</option>
                {presentaciones.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
                </select>
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                Kilos
                </label>
                <input
                type="number"
                value={s.kilos}
                onChange={(e) => cambiarKilosSubLote(s.key, e.target.value)}
                className="w-full border rounded-lg p-2"
                />
                {referenciaKilosCajas(s.kilos) && (
                <p className="text-xs text-gray-400 mt-1">
                    {referenciaKilosCajas(s.kilos)}
                </p>
                )}
            </div>

            <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                Cajas
                </label>
                <input
                type="number"
                value={s.cajas}
                onChange={(e) => cambiarCajasSubLote(s.key, e.target.value)}
                className="w-full border rounded-lg p-2"
                />
                {referenciaCajasKilos(s.cajas) && (
                <p className="text-xs text-gray-400 mt-1">
                    {referenciaCajasKilos(s.cajas)}
                </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                1 caja = {KILOS_POR_CAJA} kg (se completa el otro campo solo)
                </p>
            </div>

            <div className="md:col-span-1 flex md:justify-end pt-6">
                {subLotes.length > 1 && (
                <button
                    type="button"
                    onClick={() => eliminarSubLote(s.key)}
                    className="text-red-500 text-sm hover:underline"
                >
                    Quitar
                </button>
                )}
            </div>

            <p className="md:col-span-12 text-xs text-gray-400">
                Código resultante: {codigoLoteBase || '406'}-{s.sufijo.toUpperCase() || `?${idx + 1}`}
            </p>
            </div>
        ))}
        </div>

        <button
        type="button"
        onClick={agregarSubLote}
        className="mt-3 px-3 py-2 text-sm border border-dashed rounded-lg text-blue-600 hover:bg-blue-50"
        >
        + Agregar presentación
        </button>
    </div>

    <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Observaciones
        </label>
        <textarea
        rows={3}
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        className="w-full border rounded-lg p-3"
        />
    </div>

    <div className="flex justify-end gap-3 mt-6">
        <button
        onClick={onClose}
        className="px-4 py-2 border rounded-lg"
        >
        Cancelar
        </button>

        <button
        onClick={guardarLote}
        disabled={guardando || !mismaEspecie}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
        >
        {guardando ? 'Creando...' : 'Crear Lote y Presentaciones'}
        </button>
    </div>

    </div>
</div>
);
}