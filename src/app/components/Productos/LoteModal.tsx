import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface Opcion {
id: string;
nombre: string;
}

interface Lote {
id: string;
codigo_lote: string;
especie_id: string;
presentacion_id: string;
estado_producto_id: string;
planta_id: string;
turno_id: string;
fecha_produccion: string;
fecha_vencimiento: string | null;
kilos_netos: number;
cantidad_cajas: number | null;
temperatura: number | null;
observaciones: string | null;
}

interface Props {
onClose: () => void;
onSuccess: () => void;
lote?: Lote | null;
}

export function LoteModal({
onClose,
onSuccess,
lote,
}: Props) {
const [especies, setEspecies] = useState<Opcion[]>([]);
const [presentaciones, setPresentaciones] = useState<Opcion[]>([]);
const [estados, setEstados] = useState<Opcion[]>([]);
const [plantas, setPlantas] = useState<Opcion[]>([]);
const [turnos, setTurnos] = useState<Opcion[]>([]);

const [codigoLote, setCodigoLote] = useState('');
const [especieId, setEspecieId] = useState('');
const [presentacionId, setPresentacionId] = useState('');
const [estadoId, setEstadoId] = useState('');
const [plantaId, setPlantaId] = useState('');
const [turnoId, setTurnoId] = useState('');

const [fechaProduccion, setFechaProduccion] = useState('');
const [fechaVencimiento, setFechaVencimiento] = useState('');

const [kilosNetos, setKilosNetos] = useState('');
const [cantidadCajas, setCantidadCajas] = useState('');
const [temperatura, setTemperatura] = useState('');
const [observaciones, setObservaciones] = useState('');

const [guardando, setGuardando] = useState(false);

useEffect(() => {
cargarCombos();
}, []);

useEffect(() => {
if (!lote) return;

setCodigoLote(lote.codigo_lote);
setEspecieId(lote.especie_id);
setPresentacionId(lote.presentacion_id);
setEstadoId(lote.estado_producto_id);
setPlantaId(lote.planta_id);
setTurnoId(lote.turno_id);

setFechaProduccion(lote.fecha_produccion ?? '');
setFechaVencimiento(lote.fecha_vencimiento ?? '');

setKilosNetos(String(lote.kilos_netos ?? ''));
setCantidadCajas(String(lote.cantidad_cajas ?? ''));
setTemperatura(String(lote.temperatura ?? ''));
setObservaciones(lote.observaciones ?? '');
}, [lote]);

async function cargarCombos() {
const [
    especiesRes,
    presentacionesRes,
    estadosRes,
    plantasRes,
    turnosRes,
] = await Promise.all([
    supabase.from('especies').select('id,nombre').order('nombre'),
    supabase.from('presentaciones').select('id,nombre').order('nombre'),
    supabase.from('estados_producto').select('id,nombre').order('nombre'),
    supabase.from('plantas').select('id,nombre').order('nombre'),
    supabase.from('turnos').select('id,nombre').order('nombre'),
]);

setEspecies(especiesRes.data ?? []);
setPresentaciones(presentacionesRes.data ?? []);
setEstados(estadosRes.data ?? []);
setPlantas(plantasRes.data ?? []);
setTurnos(turnosRes.data ?? []);
}

async function guardarLote() {
if (!codigoLote.trim()) {
    alert('Debe ingresar código lote');
    return;
}

try {
    setGuardando(true);

    const datos = {
    codigo_lote: codigoLote.trim(),
    especie_id: especieId,
    presentacion_id: presentacionId,
    estado_producto_id: estadoId,
    planta_id: plantaId,
    turno_id: turnoId,
    fecha_produccion: fechaProduccion,
    fecha_vencimiento: fechaVencimiento || null,
    kilos_netos: Number(kilosNetos),
    cantidad_cajas: cantidadCajas
        ? Number(cantidadCajas)
        : null,
    temperatura: temperatura
        ? Number(temperatura)
        : null,
    observaciones: observaciones.trim(),
    };

    if (lote) {
    const { error } = await supabase
        .from('lotes')
        .update(datos)
        .eq('id', lote.id);

    if (error) throw error;
    } else {
    const { error } = await supabase
        .from('lotes')
        .insert(datos);

    if (error) throw error;
    }

    onSuccess();
    onClose();

} catch (error) {
    console.error(error);
    alert('Error guardando lote');
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

    <h2 className="text-2xl font-semibold mb-6">
        {lote ? 'Editar Lote' : 'Nuevo Lote'}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Código Lote
        </label>
        <input
        type="text"
        value={codigoLote}
        onChange={(e) => setCodigoLote(e.target.value)}
        className="w-full border rounded-lg p-2"
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
        Especie
        </label>
        <select
        value={especieId}
        onChange={(e) => setEspecieId(e.target.value)}
        className="w-full border rounded-lg p-2"
        >
        <option value="">Seleccione especie</option>
        {especies.map((e) => (
            <option key={e.id} value={e.id}>
            {e.nombre}
            </option>
        ))}
        </select>
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
            <option key={p.id} value={p.id}>
            {p.nombre}
            </option>
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
            <option key={e.id} value={e.id}>
            {e.nombre}
            </option>
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
            <option key={p.id} value={p.id}>
            {p.nombre}
            </option>
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
            <option key={t.id} value={t.id}>
            {t.nombre}
            </option>
        ))}
        </select>
    </div>

    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Fecha Vencimiento
        </label>
        <input
        type="date"
        value={fechaVencimiento}
        onChange={(e) => setFechaVencimiento(e.target.value)}
        className="w-full border rounded-lg p-2"
        />
    </div>

    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Kilos Netos
        </label>
        <input
        type="number"
        value={kilosNetos}
        onChange={(e) => setKilosNetos(e.target.value)}
        className="w-full border rounded-lg p-2"
        />
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
            rows={4}
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
        disabled={guardando}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
        {guardando
            ? 'Guardando...'
            : lote
            ? 'Actualizar'
            : 'Guardar'}
        </button>

    </div>

    </div>
</div>
);
}