    import { useState } from "react";
    import { X } from "lucide-react";
    import { supabase } from '../../../utils/supabase';

    interface Embarque {
    id: string;
    codigo_embarque: string;
    cliente: string | null;
    destino: string | null;
    transporte: string | null;
    fecha_embarque: string | null;
    observaciones: string | null;
    }

    interface Props {
    embarque: Embarque;
    onClose: () => void;
    onSuccess: () => void;
    }

    export function EditarEmbarqueModal({ embarque, onClose, onSuccess }: Props) {
    const [cliente, setCliente] = useState(embarque.cliente ?? "");
    const [destino, setDestino] = useState(embarque.destino ?? "");
    const [transporte, setTransporte] = useState(embarque.transporte ?? "");
    const [fechaEmbarque, setFechaEmbarque] = useState(
        embarque.fecha_embarque ? embarque.fecha_embarque.slice(0, 10) : ""
    );
    const [observaciones, setObservaciones] = useState(embarque.observaciones ?? "");

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function guardarCambios() {
        if (!cliente.trim()) {
        setError("El cliente es obligatorio");
        return;
        }

        setGuardando(true);
        setError(null);

        const { error: errorUpdate } = await supabase
        .from("embarques")
        .update({
            cliente: cliente.trim(),
            destino: destino.trim() || null,
            transporte: transporte.trim() || null,
            fecha_embarque: fechaEmbarque || null,
            observaciones: observaciones.trim() || null,
        })
        .eq("id", embarque.id);

        if (errorUpdate) {
        console.error("Error actualizando embarque:", errorUpdate);
        setError("No se pudo guardar los cambios");
        setGuardando(false);
        return;
        }

        setGuardando(false);
        onSuccess();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Editar Embarque</h2>
                <p className="text-sm text-gray-500 mt-1">{embarque.codigo_embarque}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
            </button>
            </div>

            <div className="p-6 space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs">
                Los lotes, kilos y cajas asignados a este embarque no se pueden editar aquí, ya
                que modificarlos afectaría los movimientos de inventario ya registrados. Si hubo
                un error en las cantidades, elimine el embarque y créelo de nuevo.
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporte</label>
                <input
                    type="text"
                    value={transporte}
                    onChange={(e) => setTransporte(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de embarque</label>
                <input
                    type="date"
                    value={fechaEmbarque}
                    onChange={(e) => setFechaEmbarque(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>

                <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
            </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
                Cancelar
            </button>
            <button
                onClick={guardarCambios}
                disabled={guardando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
                {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
            </div>
        </div>
        </div>
    );
    }