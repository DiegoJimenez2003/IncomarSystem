import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface Especie {
id: string;
nombre: string;
}

interface ProductoEditar {
id: string;
especie_id: string;
exportable: boolean;
tipo_pac: string;
}

interface ProductoModalProps {
onClose: () => void;
onSuccess: () => void;

// ==========================================================
// Si viene un producto, el modal trabajará en modo edición
// ==========================================================
producto?: ProductoEditar | null;
}

export function ProductoModal({
onClose,
onSuccess,
producto,
}: ProductoModalProps) {
const [especies, setEspecies] = useState<Especie[]>([]);
const [especieId, setEspecieId] = useState('');
const [exportable, setExportable] = useState(true);
const [tipoPac, setTipoPac] = useState('PAC');
const [guardando, setGuardando] = useState(false);

// ==========================================================
// Cargar especies
// ==========================================================
useEffect(() => {
cargarEspecies();
}, []);

// ==========================================================
// Si estamos editando, rellenar formulario
// ==========================================================
useEffect(() => {
if (!producto) return;

setEspecieId(producto.especie_id);
setExportable(producto.exportable);
setTipoPac(producto.tipo_pac);
}, [producto]);

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

if (!producto && data && data.length > 0) {
    setEspecieId(data[0].id);
}
}

async function guardarProducto() {
try {
    setGuardando(true);

    // ======================================================
    // MODO EDITAR
    // ======================================================
    if (producto) {
    const { error } = await supabase
        .from('productos')
        .update({
        especie_id: especieId,
        exportable,
        tipo_pac: tipoPac,
        })
        .eq('id', producto.id);

    if (error) {
        console.error(error);

        alert(
        'Error al actualizar producto:\n\n' +
        JSON.stringify(error, null, 2)
        );

        return;
    }
    }

    // ======================================================
    // MODO CREAR
    // ======================================================
    else {
    const { error } = await supabase
        .from('productos')
        .insert({
        especie_id: especieId,
        exportable,
        tipo_pac: tipoPac,
        });

    if (error) {
        console.error(error);

        alert(
        'Error al guardar producto:\n\n' +
        JSON.stringify(error, null, 2)
        );

        return;
    }
    }

    onSuccess();
    onClose();

} catch (err) {
    console.error(err);
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-md">

    <h2 className="text-xl mb-6">
        {producto ? 'Editar Producto' : 'Nuevo Producto'}
    </h2>

    <div className="space-y-4">

        <div>
        <label className="block mb-2 text-sm text-gray-600">
            Especie
        </label>

        <select
            value={especieId}
            onChange={(e) => setEspecieId(e.target.value)}
            className="w-full border rounded-lg p-2"
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
        </div>

        <div>
        <label className="block mb-2 text-sm text-gray-600">
            Exportable
        </label>

        <select
            value={exportable ? 'si' : 'no'}
            onChange={(e) =>
            setExportable(e.target.value === 'si')
            }
            className="w-full border rounded-lg p-2"
        >
            <option value="si">Sí</option>
            <option value="no">No</option>
        </select>
        </div>

        <div>
        <label className="block mb-2 text-sm text-gray-600">
            Tipo PAC
        </label>

        <select
            value={tipoPac}
            onChange={(e) => setTipoPac(e.target.value)}
            className="w-full border rounded-lg p-2"
        >
            <option value="PAC">PAC</option>
            <option value="NO_PAC">NO PAC</option>
            <option value="AMBOS">PAC / NO PAC</option>
        </select>
        </div>

    </div>

    <div className="flex justify-end gap-3 mt-6">

        <button
        onClick={onClose}
        className="px-4 py-2 border rounded-lg"
        >
        Cancelar
        </button>

        <button
        onClick={guardarProducto}
        disabled={guardando}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
        {guardando
            ? 'Guardando...'
            : producto
            ? 'Actualizar'
            : 'Guardar'}
        </button>

    </div>

    </div>

</div>
);
}