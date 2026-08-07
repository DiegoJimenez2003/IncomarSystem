import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface Lote {
    id: string;
    codigo_lote: string;
    kilos_netos: number | null;
    presentacion_id: string | null;
    presentaciones?: {
        nombre: string;
    }[] | null;
}

interface Procesamiento {
    id?: string;
    lote_id: string;
    kilos_entrada: number;
    kilos_salida: number;
    observaciones: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (procesamiento: Procesamiento) => void;
    procesamientoEditar?: Procesamiento | null;
}

export function ProcesamientoModal({
    isOpen,
    onClose,
    onSave,
    procesamientoEditar,
}: Props) {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loteId, setLoteId] = useState('');
    const [kilosEntrada, setKilosEntrada] = useState<number | ''>('');
    const [kilosSalida, setKilosSalida] = useState<number | ''>('');
    const [observaciones, setObservaciones] = useState('');
    const [cargandoLotes, setCargandoLotes] = useState(false);

useEffect(() => {
    if (isOpen) {
        if (procesamientoEditar) {
        setLoteId(procesamientoEditar.lote_id);
        setKilosEntrada(procesamientoEditar.kilos_entrada);
        setKilosSalida(procesamientoEditar.kilos_salida);
        setObservaciones(procesamientoEditar.observaciones ?? '');
        } else {
        setLoteId('');
        setKilosEntrada('');
        setKilosSalida('');
        setObservaciones('');
        }

        cargarLotes();
    }
}, [isOpen, procesamientoEditar]);

async function cargarLotes() {
setCargandoLotes(true);

const { data, error } = await supabase
    .from('lotes')
    .select(`
    id,
    codigo_lote,
    kilos_netos,
    presentacion_id,
    presentaciones (
        nombre
    )
    `)
    .order('codigo_lote');

if (error) {
    console.error('Error cargando lotes:', error);
    alert('No se pudieron cargar los lotes');
} else {
    setLotes(data ?? []);
}

setCargandoLotes(false);
}

const loteSeleccionado = lotes.find(
(lote) => lote.id === loteId
);

const merma =
kilosEntrada !== '' && kilosSalida !== ''
    ? Number(kilosEntrada) - Number(kilosSalida)
    : 0;

const rendimiento =
kilosEntrada !== '' &&
Number(kilosEntrada) > 0 &&
kilosSalida !== ''
    ? (Number(kilosSalida) / Number(kilosEntrada)) * 100
    : 0;

function guardar() {
if (!loteId) {
    alert('Debe seleccionar un lote');
    return;
}

const entrada = Number(kilosEntrada);
const salida = Number(kilosSalida);

if (!entrada || entrada <= 0) {
    alert('Debe ingresar una cantidad válida de kilos de entrada');
    return;
}

if (salida < 0) {
    alert('Los kilos de salida no pueden ser negativos');
    return;
}

if (salida > entrada) {
    alert('Los kilos de salida no pueden ser mayores que los kilos de entrada');
    return;
}

onSave({
    ...(procesamientoEditar?.id
        ? { id: procesamientoEditar.id }
        : {}),
    lote_id: loteId,
    kilos_entrada: entrada,
    kilos_salida: salida,
    observaciones: observaciones.trim(),
});
}

if (!isOpen) return null;

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

    <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
        Nuevo Proceso
        </h2>

        <p className="text-sm text-gray-500 mt-1">
        Registra el procesamiento y rendimiento del lote
        </p>
    </div>

    <div className="p-6 space-y-4">

        {/* Lote */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Lote
        </label>

        <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            disabled={cargandoLotes}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
            <option value="">
            {cargandoLotes
                ? 'Cargando lotes...'
                : 'Seleccione un lote'}
            </option>

            {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
                {lote.codigo_lote}
                {lote.presentaciones?.[0]?.nombre
                ? ` - ${lote.presentaciones[0].nombre}`
                : ''}
            </option>
            ))}
        </select>
        </div>

        {/* Información del lote */}
        {loteSeleccionado && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">
            Kilos registrados en el lote
            </p>

            <p className="text-lg font-semibold text-blue-700">
            {Number(
                loteSeleccionado.kilos_netos ?? 0
            ).toLocaleString()} kg
            </p>
        </div>
        )}

        {/* Kilos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Kg Entrada
            </label>

            <input
            type="number"
            min="0"
            step="0.01"
            value={kilosEntrada}
            onChange={(e) =>
                setKilosEntrada(
                e.target.value === ''
                    ? ''
                    : Number(e.target.value)
                )
            }
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Kg Salida
            </label>

            <input
            type="number"
            min="0"
            step="0.01"
            value={kilosSalida}
            onChange={(e) =>
                setKilosSalida(
                e.target.value === ''
                    ? ''
                    : Number(e.target.value)
                )
            }
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        </div>

        {/* Resumen */}
        {(kilosEntrada !== '' || kilosSalida !== '') && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-4">

            <div>
            <p className="text-xs text-gray-500">
                Merma
            </p>

            <p
                className={`text-lg font-semibold ${
                merma > 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
            >
                {merma.toLocaleString()} kg
            </p>
            </div>

            <div>
            <p className="text-xs text-gray-500">
                Rendimiento
            </p>

            <p
                className={`text-lg font-semibold ${
                rendimiento >= 85
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
            >
                {rendimiento.toFixed(1)}%
            </p>
            </div>

        </div>
        )}

        {/* Observaciones */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
        </label>

        <textarea
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones del proceso..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
            onClick={guardar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
            {procesamientoEditar ? 'Guardar cambios' : 'Guardar proceso'}
        </button>

    </div>

    </div>
</div>
);
}