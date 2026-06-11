import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

// ==========================================================
// Modelo de especie
// ==========================================================
interface Especie {
id: string;
nombre: string;
nombre_cientifico: string;
}

interface EspeciesModalProps {
onClose: () => void;
}

export function EspeciesModal({
onClose,
}: EspeciesModalProps) {

// ==========================================================
// Lista de especies
// ==========================================================
const [especies, setEspecies] = useState<Especie[]>([]);

// ==========================================================
// Formulario
// ==========================================================
const [nombre, setNombre] = useState('');
const [nombreCientifico, setNombreCientifico] = useState('');

// ==========================================================
// Especie en edición
// ==========================================================
const [editandoId, setEditandoId] = useState<string | null>(null);

// ==========================================================
// Estado de guardado
// ==========================================================
const [guardando, setGuardando] = useState(false);

// ==========================================================
// Cargar especies
// ==========================================================
useEffect(() => {
cargarEspecies();
}, []);

// ==========================================================
// Obtener especies desde Supabase
// ==========================================================
async function cargarEspecies() {

const { data, error } = await supabase
    .from('especies')
    .select('*')
    .order('nombre');

if (error) {
    console.error(error);
    return;
}

setEspecies(data ?? []);
}

// ==========================================================
// Limpiar formulario
// ==========================================================
function limpiarFormulario() {
setNombre('');
setNombreCientifico('');
setEditandoId(null);
}

// ==========================================================
// Guardar especie
// ==========================================================
async function guardarEspecie() {

if (!nombre.trim()) {
    alert('Debe ingresar un nombre');
    return;
}

try {

    setGuardando(true);

    // ======================================================
    // Validar duplicados ignorando mayúsculas/minúsculas
    // ======================================================
    const { data: existente } = await supabase
    .from('especies')
    .select('id')
    .ilike('nombre', nombre.trim())
    .maybeSingle();

    if (
    existente &&
    existente.id !== editandoId
    ) {
    alert(
        'Ya existe una especie con ese nombre'
    );
    return;
    }

    // ======================================================
    // EDITAR
    // ======================================================
    if (editandoId) {

    const { error } = await supabase
        .from('especies')
        .update({
        nombre: nombre.trim(),
        nombre_cientifico:
            nombreCientifico.trim()
        })
        .eq('id', editandoId);

    if (error) {
        console.error(error);
        alert('Error actualizando especie');
        return;
    }
    }

    // ======================================================
    // CREAR
    // ======================================================
    else {

    const { error } = await supabase
        .from('especies')
        .insert({
        nombre: nombre.trim(),
        nombre_cientifico:
            nombreCientifico.trim()
        });

    if (error) {
        console.error(error);
        alert('Error creando especie');
        return;
    }
    }

    limpiarFormulario();
    cargarEspecies();

} catch (err) {
    console.error(err);
} finally {
    setGuardando(false);
}
}

// ==========================================================
// Preparar edición
// ==========================================================
function editarEspecie(especie: Especie) {

setEditandoId(especie.id);

setNombre(especie.nombre);

setNombreCientifico(
    especie.nombre_cientifico
);
}

// ==========================================================
// Eliminar especie
// ==========================================================
async function eliminarEspecie(id: string) {

const confirmar = confirm(
    '¿Deseas eliminar esta especie?'
);

if (!confirmar) return;

const { error } = await supabase
    .from('especies')
    .delete()
    .eq('id', id);

if (error) {
    console.error(error);

    alert(
    'No se puede eliminar una especie asociada a productos.'
    );

    return;
}

cargarEspecies();
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

    {/* ====================================================
        Título
    ==================================================== */}
    <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-semibold">
        Gestión de Especies
        </h2>

        <button
        onClick={onClose}
        className="px-3 py-2 border rounded-lg"
        >
        Cerrar
        </button>

    </div>

    {/* ====================================================
        Formulario
    ==================================================== */}
    <div className="border rounded-xl p-4 mb-6">

        <h3 className="mb-4 font-medium">

        {editandoId
            ? 'Editar especie'
            : 'Nueva especie'}

        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
            type="text"
            placeholder="Nombre común"
            value={nombre}
            onChange={(e) =>
            setNombre(e.target.value)
            }
            className="border rounded-lg p-2"
        />

        <input
            type="text"
            placeholder="Nombre científico"
            value={nombreCientifico}
            onChange={(e) =>
            setNombreCientifico(e.target.value)
            }
            className="border rounded-lg p-2"
        />

        </div>

        <div className="flex gap-2 mt-4">

        <button
            onClick={guardarEspecie}
            disabled={guardando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
            {guardando
            ? 'Guardando...'
            : editandoId
            ? 'Actualizar'
            : 'Guardar'}
        </button>

        {editandoId && (
            <button
            onClick={limpiarFormulario}
            className="px-4 py-2 border rounded-lg"
            >
            Cancelar edición
            </button>
        )}

        </div>

    </div>

    {/* ====================================================
        Lista de especies
    ==================================================== */}
    <div className="space-y-3">

        {especies.map((especie) => (

        <div
            key={especie.id}
            className="border rounded-xl p-4 flex justify-between items-center"
        >

            <div>

            <h4 className="font-medium">
                {especie.nombre}
            </h4>

            <p className="text-sm text-gray-500 italic">
                {especie.nombre_cientifico}
            </p>

            </div>

            <div className="flex gap-2">

            <button
                onClick={() =>
                editarEspecie(especie)
                }
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg"
            >
                Editar
            </button>

            <button
                onClick={() =>
                eliminarEspecie(especie.id)
                }
                className="px-3 py-2 bg-red-600 text-white rounded-lg"
            >
                Eliminar
            </button>

            </div>

        </div>

        ))}

    </div>

    </div>

</div>
);
}