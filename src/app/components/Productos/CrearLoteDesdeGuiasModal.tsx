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

export function CrearLoteDesdeGuiasModal({ guias, onClose, onSuccess }: Props) {
const [presentaciones, setPresentaciones] = useState<Opcion[]>([]);
const [estados, setEstados] = useState<Opcion[]>([]);
const [plantas, setPlantas] = useState<Opcion[]>([]);
const [turnos, setTurnos] = useState<Opcion[]>([]);

const [codigoLote, setCodigoLote] = useState('');
const [presentacionId, setPresentacionId] = useState('');
const [estadoId, setEstadoId] = useState('');
const [plantaId, setPlantaId] = useState('');
const [turnoId, setTurnoId] = useState('');
const [fechaProduccion, setFechaProduccion] = useState('');
const [cantidadCajas, setCantidadCajas] = useState('');
const [temperatura, setTemperatura] = useState('');
const [observaciones, setObservaciones] = useState('');

const [guardando, setGuardando] = useState(false);

const kilosTotal = guias.reduce((sum, g) => sum + (Number(g.kilos) || 0), 0);
const especieId = guias[0]?.especie_id;
const mismaEspecie = guias.every((g) => g.especie_id === especieId);

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

async function guardarLote() {
if (!codigoLote.trim()) {
    alert('Debe ingresar el código del lote interno');
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

try {
    setGuardando(true);

    const { data: nuevoLote, error: errorLote } = await supabase
    .from('lotes')
    .insert({
        codigo_lote: codigoLote.trim(),
        especie_id: especieId,
        presentacion_id: presentacionId || null,
        estado_producto_id: estadoId || null,
        planta_id: plantaId || null,
        turno_id: turnoId || null,
        fecha_produccion: fechaProduccion,
        kilos_netos: kilosTotal,
        cantidad_cajas: cantidadCajas ? Number(cantidadCajas) : null,
        temperatura: temperatura ? Number(temperatura) : null,
        observaciones: observaciones.trim(),
    })
    .select()
    .single();

    if (errorLote) throw errorLote;

    const idsGuias = guias.map((g) => g.id);

    const { error: errorGuias } = await supabase
    .from('guias')
    .update({ lote_id: nuevoLote.id })
    .in('id', idsGuias);

    if (errorGuias) throw errorGuias;

    onSuccess();
    onClose();
} catch (error) {
    console.error(error);
    alert('Error al crear el lote a partir de las guías');
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

    <h2 className="text-2xl font-semibold mb-2">
        Crear Lote Interno desde Guías
    </h2>
    <p className="text-sm text-gray-500 mb-6">
        Se generará un nuevo lote a partir de {guias.length} guía(s) seleccionada(s)
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Lote Interno
        </label>
        <input
            type="text"
            value={codigoLote}
            onChange={(e) => setCodigoLote(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="Ej: JB122"
        />
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
            Presentación
        </label>
        <select
            value={presentacionId}
            onChange={(e) => setPresentacionId(e.target.value)}
            className="w-full border rounded-lg p-2"
        >
            <option value="">Seleccione presentación</option>
            {presentaciones.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
        </select>
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
            Cantidad de Cajas
        </label>
        <input
            type="number"
            value={cantidadCajas}
            onChange={(e) => setCantidadCajas(e.target.value)}
            className="w-full border rounded-lg p-2"
        />
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
        {guardando ? 'Creando...' : 'Crear Lote'}
        </button>
    </div>

    </div>
</div>
);
}