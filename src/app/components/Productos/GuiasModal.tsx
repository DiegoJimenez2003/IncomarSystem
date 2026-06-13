import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface Especie {
id: string;
nombre: string;
}

interface Guia {
id: string;
numero_guia: string;
lote_origen: string;
especie_id: string;
barco: string;
origen: string;
destino: string;
kilos: number;
fecha_guia: string;
observaciones: string;
}

interface GuiasModalProps {
onClose: () => void;
onSuccess: () => void;
guia?: Guia | null;
}

export function GuiasModal({
onClose,
onSuccess,
guia,
}: GuiasModalProps) {

const [especies, setEspecies] = useState<Especie[]>([]);

const [numeroGuia, setNumeroGuia] = useState('');
const [loteOrigen, setLoteOrigen] = useState('');
const [especieId, setEspecieId] = useState('');
const [barco, setBarco] = useState('');
const [origen, setOrigen] = useState('');
const [destino, setDestino] = useState('');
const [kilos, setKilos] = useState('');
const [fechaGuia, setFechaGuia] = useState('');
const [observaciones, setObservaciones] = useState('');

const [guardando, setGuardando] = useState(false);

useEffect(() => {
cargarEspecies();
}, []);

useEffect(() => {

if (!guia) return;

setNumeroGuia(guia.numero_guia);
setLoteOrigen(guia.lote_origen);
setEspecieId(guia.especie_id);
setBarco(guia.barco);
setOrigen(guia.origen);
setDestino(guia.destino);
setKilos(String(guia.kilos));
setObservaciones(guia.observaciones ?? '');

if (guia.fecha_guia) {
    setFechaGuia(
    new Date(guia.fecha_guia)
        .toISOString()
        .slice(0, 16)
    );
}

}, [guia]);

async function cargarEspecies() {

const { data, error } = await supabase
    .from('especies')
    .select('id, nombre')
    .order('nombre');

if (error) {
    console.error(error);
    return;
}

setEspecies(data ?? []);

if (!guia && data && data.length > 0) {
    setEspecieId(data[0].id);
}
}

async function guardarGuia() {

if (!numeroGuia.trim()) {
    alert('Debe ingresar el número de guía');
    return;
}

if (!loteOrigen.trim()) {
    alert('Debe ingresar el lote origen');
    return;
}

if (!especieId) {
    alert('Debe seleccionar una especie');
    return;
}

try {

    setGuardando(true);

    const datos = {
    numero_guia: numeroGuia.trim(),
    lote_origen: loteOrigen.trim(),
    especie_id: especieId,
    barco: barco.trim(),
    origen: origen.trim(),
    destino: destino.trim(),
    kilos: Number(kilos),
    fecha_guia: fechaGuia,
    observaciones: observaciones.trim()
    };

    // EDITAR
    if (guia) {

    const { error } = await supabase
        .from('guias')
        .update(datos)
        .eq('id', guia.id);

    if (error) {
    console.error(error);

        alert(`
    Codigo: ${error.code}
    Mensaje: ${error.message}
    Detalle: ${error.details}
    Hint: ${error.hint}
        `);

        return;
    }

    }

    // CREAR
    else {

    const { error } = await supabase
        .from('guias')
        .insert(datos);

    if (error) {
    console.error(error);

        alert(`
    Codigo: ${error.code}
    Mensaje: ${error.message}
    Detalle: ${error.details}
    Hint: ${error.hint}
        `);

        return;
    }

    }

    onSuccess();
    onClose();

} catch (err) {

    console.error(err);
    alert('Ocurrió un error');

} finally {

    setGuardando(false);

}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

    <h2 className="text-2xl font-semibold mb-6">

        {guia
        ? 'Editar Guía'
        : 'Nueva Guía'}

    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
        type="text"
        placeholder="Número Guía"
        value={numeroGuia}
        onChange={(e) =>
            setNumeroGuia(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <input
        type="text"
        placeholder="Lote Origen"
        value={loteOrigen}
        onChange={(e) =>
            setLoteOrigen(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <select
        value={especieId}
        onChange={(e) =>
            setEspecieId(e.target.value)
        }
        className="border rounded-lg p-2"
        >

        {especies.map((especie) => (

            <option
            key={especie.id}
            value={especie.id}
            >
            {especie.nombre}
            </option>

        ))}

        </select>

        <input
        type="text"
        placeholder="Barco"
        value={barco}
        onChange={(e) =>
            setBarco(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <input
        type="text"
        placeholder="Origen"
        value={origen}
        onChange={(e) =>
            setOrigen(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <input
        type="text"
        placeholder="Destino"
        value={destino}
        onChange={(e) =>
            setDestino(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <input
        type="number"
        placeholder="Kilos"
        value={kilos}
        onChange={(e) =>
            setKilos(e.target.value)
        }
        className="border rounded-lg p-2"
        />

        <input
        type="datetime-local"
        value={fechaGuia}
        onChange={(e) =>
            setFechaGuia(e.target.value)
        }
        className="border rounded-lg p-2"
        />

    </div>

    <textarea
        placeholder="Observaciones"
        value={observaciones}
        onChange={(e) =>
        setObservaciones(e.target.value)
        }
        rows={4}
        className="w-full border rounded-lg p-3 mt-4"
    />

    <div className="flex justify-end gap-3 mt-6">

        <button
        onClick={onClose}
        className="px-4 py-2 border rounded-lg"
        >
        Cancelar
        </button>

        <button
        onClick={guardarGuia}
        disabled={guardando}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
        {guardando
            ? 'Guardando...'
            : guia
            ? 'Actualizar'
            : 'Guardar'}
        </button>

    </div>

    </div>

</div>
);
}