import { useEffect, useState } from "react";

interface Rack {
id?: number;
codigo: string;
ubicacion: string;
capacidad_kg: number;
activo: boolean;
}

interface RackModalProps {
isOpen: boolean;
onClose: () => void;
onSave: (rack: Rack) => void;
rackEditar?: Rack | null;
}

export default function RackModal({
isOpen,
onClose,
onSave,
rackEditar,
}: RackModalProps) {
const [codigo, setCodigo] = useState("");
const [ubicacion, setUbicacion] = useState("");
const [capacidadKg, setCapacidadKg] = useState<number | "">("");
const [activo, setActivo] = useState(true);

const esEdicion = !!rackEditar;

useEffect(() => {
if (isOpen) {
    if (rackEditar) {
    setCodigo(rackEditar.codigo);
    setUbicacion(rackEditar.ubicacion);
    setCapacidadKg(rackEditar.capacidad_kg);
    setActivo(rackEditar.activo);
    } else {
    setCodigo("");
    setUbicacion("");
    setCapacidadKg("");
    setActivo(true);
    }
}
}, [isOpen, rackEditar]);

if (!isOpen) return null;

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

    <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
        {esEdicion ? "Editar Rack" : "Nuevo Rack"}
        </h2>
    </div>

    <div className="p-6 space-y-4">

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Código
        </label>

        <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación
        </label>

        <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacidad (kg)
        </label>

        <input
            type="number"
            value={capacidadKg}
            onChange={(e) =>
            setCapacidadKg(
                e.target.value === "" ? "" : Number(e.target.value)
            )
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        </div>

        {esEdicion && (
        <div className="flex items-center gap-2">
            <input
            type="checkbox"
            id="activo"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="w-4 h-4"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
            Rack activo / disponible
            </label>
        </div>
        )}

    </div>

    <div className="flex justify-end gap-3 px-6 py-4 border-t">

        <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
        Cancelar
        </button>

        <button
        onClick={() =>
            onSave({
            ...(rackEditar?.id ? { id: rackEditar.id } : {}),
            codigo,
            ubicacion,
            capacidad_kg: Number(capacidadKg),
            activo,
            })
        }
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
        {esEdicion ? "Guardar cambios" : "Guardar"}
        </button>

    </div>

    </div>

</div>
);
}