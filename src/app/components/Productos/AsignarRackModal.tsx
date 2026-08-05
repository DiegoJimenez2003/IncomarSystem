import { useEffect, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { supabase } from '../../../utils/supabase';

interface Rack {
id: string;
codigo: string;
ubicacion: string;
capacidad_kg: number;
activo: boolean;
}

interface Lote {
id: string;
codigo_lote: string;
kilos_netos: number;
cantidad_cajas: number | null;
}

interface Props {
lote: Lote;
onClose: () => void;
onSuccess: () => void;
}

export function AsignarRackModal({ lote, onClose, onSuccess }: Props) {
const [racks, setRacks] = useState<Rack[]>([]);
const [rackId, setRackId] = useState('');
const [kilos, setKilos] = useState('');
const [cajas, setCajas] = useState('');
const [guardando, setGuardando] = useState(false);

const [asignaciones, setAsignaciones] = useState<any[]>([]);
const [cargandoAsignaciones, setCargandoAsignaciones] = useState(true);

useEffect(() => {
cargarRacks();
cargarAsignacionesExistentes();
}, []);

async function cargarRacks() {
const { data, error } = await supabase
    .from('racks')
    .select('id, codigo, ubicacion, capacidad_kg, activo')
    .eq('activo', true)
    .order('codigo');

if (error) {
    console.error(error);
    return;
}

setRacks(data ?? []);
}

async function cargarAsignacionesExistentes() {
setCargandoAsignaciones(true);

const { data, error } = await supabase
    .from('detalle_lote')
    .select(`
    id,
    kilos,
    cajas,
    racks ( codigo, ubicacion )
    `)
    .eq('lote_id', lote.id);

if (error) {
    console.error(error);
} else {
    setAsignaciones(data ?? []);
}

setCargandoAsignaciones(false);
}

const kilosYaAsignados = asignaciones.reduce(
(sum, a) => sum + (Number(a.kilos) || 0), 0
);
const cajasYaAsignadas = asignaciones.reduce(
(sum, a) => sum + (Number(a.cajas) || 0), 0
);

const kilosDisponibles = (lote.kilos_netos ?? 0) - kilosYaAsignados;
const cajasDisponibles = (lote.cantidad_cajas ?? 0) - cajasYaAsignadas;

async function asignarRack() {
if (!rackId) {
    alert('Debe seleccionar un rack');
    return;
}

const kilosNum = Number(kilos);
const cajasNum = cajas ? Number(cajas) : 0;

if (!kilosNum || kilosNum <= 0) {
    alert('Debe ingresar una cantidad de kilos válida');
    return;
}

if (kilosNum > kilosDisponibles) {
    alert(`Solo quedan ${kilosDisponibles} kg disponibles para asignar de este lote`);
    return;
}

if (cajasNum > cajasDisponibles) {
    alert(`Solo quedan ${cajasDisponibles} cajas disponibles para asignar de este lote`);
    return;
}

try {
    setGuardando(true);

    const { error } = await supabase
    .from('detalle_lote')
    .insert({
        lote_id: lote.id,
        rack_id: rackId,
        kilos: kilosNum,
        cajas: cajasNum || null,
    });

    if (error) throw error;

    setRackId('');
    setKilos('');
    setCajas('');

    await cargarAsignacionesExistentes();
    onSuccess();
} catch (error) {
    console.error(error);
    alert('Error al asignar el rack');
} finally {
    setGuardando(false);
}
}

async function eliminarAsignacion(id: string) {
const confirmar = window.confirm('¿Quitar esta asignación de rack?');
if (!confirmar) return;

const { error } = await supabase
    .from('detalle_lote')
    .delete()
    .eq('id', id);

if (error) {
    console.error(error);
    alert('Error al eliminar la asignación');
    return;
}

await cargarAsignacionesExistentes();
onSuccess();
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

    <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
        Asignar Rack — Lote {lote.codigo_lote}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
        Distribuye este lote entre uno o varios racks
        </p>
    </div>

    <div className="p-6 space-y-6">

        {/* Resumen de disponibilidad */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
            <p className="text-gray-600">Kilos disponibles</p>
            <p className="text-blue-700 text-lg font-semibold">
            {kilosDisponibles.toLocaleString()} / {lote.kilos_netos?.toLocaleString()} kg
            </p>
        </div>
        <div>
            <p className="text-gray-600">Cajas disponibles</p>
            <p className="text-blue-700 text-lg font-semibold">
            {cajasDisponibles} / {lote.cantidad_cajas ?? 0}
            </p>
        </div>
        </div>

        {/* Formulario nueva asignación */}
        <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Nueva asignación</h3>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Rack
            </label>
            <select
            value={rackId}
            onChange={(e) => setRackId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
            <option value="">Seleccione un rack</option>
            {racks.map((r) => (
                <option key={r.id} value={r.id}>
                {r.codigo} - {r.ubicacion}
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilos a asignar
            </label>
            <input
                type="number"
                value={kilos}
                onChange={(e) => setKilos(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Cajas a asignar
            </label>
            <input
                type="number"
                value={cajas}
                onChange={(e) => setCajas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
            />
            </div>
        </div>

        <button
            onClick={asignarRack}
            disabled={guardando || kilosDisponibles <= 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
            <Warehouse className="w-4 h-4" />
            {guardando ? 'Asignando...' : 'Asignar a Rack'}
        </button>
        </div>

        {/* Lista de asignaciones existentes */}
        <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
            Asignaciones actuales
        </h3>

        {cargandoAsignaciones ? (
            <p className="text-sm text-gray-500">Cargando...</p>
        ) : asignaciones.length === 0 ? (
            <p className="text-sm text-gray-500">
            Este lote aún no ha sido asignado a ningún rack.
            </p>
        ) : (
            <div className="space-y-2">
            {asignaciones.map((a) => (
                <div
                key={a.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-purple-600" />
                    <div>
                    <p className="text-sm text-gray-900">
                        {a.racks?.codigo} - {a.racks?.ubicacion}
                    </p>
                    <p className="text-xs text-gray-500">
                        {Number(a.kilos).toLocaleString()} kg
                        {a.cajas ? ` · ${a.cajas} cajas` : ''}
                    </p>
                    </div>
                </div>

                <button
                    onClick={() => eliminarAsignacion(a.id)}
                    className="text-xs text-red-600 hover:underline"
                >
                    Quitar
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
        Cerrar
        </button>
    </div>

    </div>
</div>
);
}