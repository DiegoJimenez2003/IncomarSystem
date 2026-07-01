import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

interface EstadoProducto {
id: string;
nombre: string;
descripcion: string | null;
color: string | null;
activo: boolean;
}

interface Props {
onClose: () => void;
onSuccess: () => void;
estado?: EstadoProducto | null;
}

const colores = [
'red',
'green',
'blue',
'yellow',
'gray',
'purple',
'orange',
];

export function EstadoProductoModal({
onClose,
onSuccess,
estado,
}: Props) {
const [nombre, setNombre] = useState('');
const [descripcion, setDescripcion] = useState('');
const [color, setColor] = useState('gray');
const [activo, setActivo] = useState(true);

const [guardando, setGuardando] = useState(false);

useEffect(() => {
if (!estado) return;

setNombre(estado.nombre);
setDescripcion(estado.descripcion ?? '');
setColor(estado.color ?? 'gray');
setActivo(estado.activo);
}, [estado]);

function getColorClass(c: string) {
const colors = {
    red: 'bg-red-100 border-red-300 text-red-700',
    green: 'bg-green-100 border-green-300 text-green-700',
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    gray: 'bg-gray-100 border-gray-300 text-gray-700',
    purple: 'bg-purple-100 border-purple-300 text-purple-700',
    orange: 'bg-orange-100 border-orange-300 text-orange-700',
};

return colors[c as keyof typeof colors];
}

async function guardarEstado() {
if (!nombre.trim()) {
    alert('Debe ingresar un nombre.');
    return;
}

try {
    setGuardando(true);

    const datos = {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    color,
    activo,
    };

    if (estado) {
    const { error } = await supabase
        .from('estados_producto')
        .update(datos)
        .eq('id', estado.id);

    if (error) throw error;
    } else {
    const { error } = await supabase
        .from('estados_producto')
        .insert(datos);

    if (error) throw error;
    }

    onSuccess();
    onClose();
} catch (error) {
    console.error(error);
    alert('Error guardando el estado.');
} finally {
    setGuardando(false);
}
}

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-lg">

    <h2 className="text-2xl font-semibold mb-6">
        {estado ? 'Editar Estado' : 'Nuevo Estado'}
    </h2>

    <div className="space-y-5">

        <div>
        <label className="block mb-2 font-medium">
            Nombre
        </label>

        <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="Ej: Aprobado"
        />
        </div>

        <div>
        <label className="block mb-2 font-medium">
            Descripción
        </label>

        <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="Descripción del estado..."
        />
        </div>

        <div>
        <label className="block mb-3 font-medium">
            Color
        </label>

        <div className="grid grid-cols-4 gap-3">

            {colores.map((c) => (

            <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                p-3
                rounded-lg
                border-2
                transition-all
                ${getColorClass(c)}
                ${
                    color === c
                    ? 'ring-2 ring-blue-500 scale-105'
                    : ''
                }
                `}
            >
                <span className="capitalize text-sm">
                {c}
                </span>

            </button>

            ))}

        </div>
        </div>

        <div className="flex items-center gap-3">

        <input
            id="activo"
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="w-4 h-4"
        />

        <label htmlFor="activo">
            Estado activo
        </label>

        </div>

    </div>

    <div className="flex justify-end gap-3 mt-8">

        <button
        onClick={onClose}
        className="px-5 py-2 border rounded-lg"
        >
        Cancelar
        </button>

        <button
        onClick={guardarEstado}
        disabled={guardando}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
        {guardando
            ? 'Guardando...'
            : estado
            ? 'Actualizar'
            : 'Guardar'}
        </button>

    </div>

    </div>

</div>
);
}