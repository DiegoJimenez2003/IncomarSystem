import { useEffect, useState } from 'react';
import {
Search,
Plus,
Eye,
Download,
Edit2,
Trash2,
FileText,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';

import { DocumentoModal } from '../components/Productos/DocumentoModal';

/* ==========================================================
INTERFACES
========================================================== */

interface DocumentoPage {
id: string;

nombre: string;
descripcion: string | null;

archivo_nombre: string;
archivo_url: string;

archivo_tipo: string | null;
archivo_size: number | null;

version: number;
visibilidad: string;
activo: boolean;

categoria_id: string;

categoria?: {
nombre: string;
};
}

/* ==========================================================
COMPONENTE
========================================================== */

export function DocumentosPage() {
const { user } = useAuth();

/* ==========================================================
    ESTADOS
========================================================== */

const [documentos, setDocumentos] =
useState<DocumentoPage[]>([]);

const [loading, setLoading] =
useState(true);

const [searchTerm, setSearchTerm] =
useState('');

const [mostrarModal, setMostrarModal] =
useState(false);

const [documentoEditar, setDocumentoEditar] =
useState<DocumentoPage | null>(null);

/* ==========================================================
    CARGAR DOCUMENTOS
========================================================== */

useEffect(() => {
cargarDocumentos();
}, []);

async function cargarDocumentos() {
try {
    setLoading(true);

    const { data, error } = await supabase
    .from('documentos')
    .select(`
        *,
        categoria:categoria_id(
        nombre
        )
    `)
    .order('created_at', {
        ascending: false,
    });

    if (error) {
    console.error(error);
    return;
    }

    setDocumentos(data ?? []);
} finally {
    setLoading(false);
}
}

/* ==========================================================
    FILTRO
========================================================== */

const documentosFiltrados =
documentos.filter((doc) => {

    const texto = searchTerm.toLowerCase();

    return (

    doc.nombre
        .toLowerCase()
        .includes(texto)

    ||

    doc.descripcion
        ?.toLowerCase()
        .includes(texto)

    ||

    doc.categoria?.nombre
        ?.toLowerCase()
        .includes(texto)

    );
});

/* ==========================================================
    DESCARGAR
========================================================== */

function descargarDocumento(
documento: DocumentoPage
) {
window.open(
    documento.archivo_url,
    '_blank'
);
}

/* ==========================================================
    VER DOCUMENTO
========================================================== */

function verDocumento(
documento: DocumentoPage
) {
window.open(
    documento.archivo_url,
    '_blank'
);
}

/* ==========================================================
    ELIMINAR
========================================================== */

async function eliminarDocumento(
documento: DocumentoPage
) {

const confirmar = confirm(
    `¿Eliminar "${documento.nombre}"?`
);

if (!confirmar) return;

const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', documento.id);

if (error) {
    console.error(error);
    alert('No fue posible eliminar.');
    return;
}

cargarDocumentos();
}

/* ==========================================================
    FORMATO TAMAÑO
========================================================== */

function formatearPeso(
bytes: number | null
) {

if (!bytes) return '-';

if (bytes < 1024)
    return `${bytes} B`;

if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;

return `${(
    bytes /
    1024 /
    1024
).toFixed(2)} MB`;
}

/* ==========================================================
    PERMISOS
========================================================== */

const puedeGestionar =
user?.rol === 'administrador' ||
user?.rol === 'calidad';

/* ==========================================================
    RETURN
========================================================== */

return (
<div className="space-y-6">

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

    <div>

        <h1 className="text-gray-900 mb-2">
        Gestión de Documentos
        </h1>

        <p className="text-gray-600">
        Biblioteca documental del sistema
        </p>

</div>

    {puedeGestionar && (

        <button
        onClick={() => {
            setDocumentoEditar(null);
            setMostrarModal(true);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
        <Plus className="w-5 h-5" />
        Nuevo Documento
        </button>

    )}

    </div>

    <div className="bg-white p-6 rounded-xl border border-gray-200">

        <div className="mb-6">

            <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
                type="text"
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) =>
                setSearchTerm(
                    e.target.value
                )
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

        </div>

    </div>

    <div className="overflow-x-auto">

        <table className="w-full">

        <thead>

            <tr className="border-b border-gray-200">

            <th className="text-left py-3 px-4 text-gray-700">
                Documento
            </th>

            <th className="text-left py-3 px-4 text-gray-700">
                Categoría
            </th>

            <th className="text-left py-3 px-4 text-gray-700">
                Versión
            </th>

            <th className="text-left py-3 px-4 text-gray-700">
                Visibilidad
            </th>

            <th className="text-left py-3 px-4 text-gray-700">
                Tamaño
            </th>

            <th className="text-left py-3 px-4 text-gray-700">
                Acciones
            </th>

            </tr>

        </thead>

        <tbody>

            {documentosFiltrados.map((doc) => (

            <tr
                key={doc.id}
                className="border-b border-gray-100 hover:bg-gray-50"
            >

                <td className="py-3 px-4">

                <div className="flex items-center gap-3">

                    <FileText className="w-5 h-5 text-blue-600" />

                    <div>

                    <p className="font-medium text-gray-900">
                        {doc.nombre}
                    </p>

                    <p className="text-sm text-gray-500">
                        {doc.descripcion}
                    </p>

                    </div>

                </div>

                </td>

                <td className="py-3 px-4">
                {doc.categoria?.nombre}
                </td>

                <td className="py-3 px-4">
                v{doc.version}
                </td>

                <td className="py-3 px-4">

                <span
                    className={`px-3 py-1 rounded-full text-xs ${
                    doc.visibilidad === 'Público'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                >
                    {doc.visibilidad}
                </span>

                </td>

                <td className="py-3 px-4">

                {formatearPeso(
                    doc.archivo_size
                )}

                </td>

                <td className="py-3 px-4">

                <div className="flex items-center gap-2">

                    <button
                    onClick={() =>
                        verDocumento(doc)
                    }
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Ver documento"
                    >
                    <Eye className="w-4 h-4" />
                    </button>

                    <button
                    onClick={() =>
                        descargarDocumento(doc)
                    }
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Descargar"
                    >
                    <Download className="w-4 h-4" />
                    </button>

                    {puedeGestionar && (

                    <>
                        <button
                        onClick={() => {
                            setDocumentoEditar(doc);
                            setMostrarModal(true);
                        }}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                        >
                        <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                        onClick={() =>
                            eliminarDocumento(doc)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </>

                    )}

                </div>

                </td>

            </tr>

            ))}

        </tbody>

        </table>

    </div>

    {documentosFiltrados.length === 0 && (

        <div className="text-center py-12">

        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />

        <p className="text-gray-500">

            No se encontraron documentos.

        </p>

        </div>

    )}

    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    <div className="bg-white p-5 rounded-xl border border-gray-200">

        <p className="text-gray-600 mb-2">
        Total documentos
        </p>

        <p className="text-gray-900">
        {documentos.length}
        </p>

    </div>

    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">

        <p className="text-gray-700 mb-2">
        Categorías
        </p>

        <p className="text-blue-700">

        {
            new Set(
            documentos.map(
                d => d.categoria?.nombre
            )
            ).size
        }

        </p>

    </div>

    <div className="bg-green-50 p-5 rounded-xl border border-green-100">

        <p className="text-gray-700 mb-2">
        Activos
        </p>

        <p className="text-green-700">

        {
            documentos.filter(
            d => d.activo
            ).length
        }

        </p>

    </div>

    <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">

        <p className="text-gray-700 mb-2">
        Versiones
        </p>

        <p className="text-yellow-700">

        {
            documentos.reduce(
            (acc, d) => acc + d.version,
            0
            )
        }

        </p>

    </div>

    </div>

    {mostrarModal && (

    <DocumentoModal

        documento={documentoEditar}

        onClose={() => {

        setMostrarModal(false);

        setDocumentoEditar(null);

        }}

        onSuccess={() => {

        cargarDocumentos();

        }}

    />

    )}

</div>

);

}