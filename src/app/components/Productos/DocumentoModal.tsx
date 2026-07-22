import { useEffect, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { supabase } from "../../../utils/supabase";

interface Categoria {
id: string;
nombre: string;
}

interface Documento {
id: string;
nombre: string;
descripcion: string | null;

categoria_id: string;

archivo_nombre: string;
archivo_url: string;

archivo_tipo: string | null;
archivo_size: number | null;
}

interface Props {
onClose: () => void;
onSuccess: () => void;
documento?: Documento | null;
}

export function DocumentoModal({
onClose,
onSuccess,
documento,
}: Props) {

const [categorias, setCategorias] = useState<Categoria[]>([]);

const [nombre, setNombre] = useState("");
const [descripcion, setDescripcion] = useState("");
const [categoriaId, setCategoriaId] = useState("");

const [archivo, setArchivo] = useState<File | null>(null);

const [guardando, setGuardando] = useState(false);
// ==========================================
// Referencia al input oculto para seleccionar archivos
// ==========================================

const inputArchivoRef = useRef<HTMLInputElement>(null);

useEffect(() => {
cargarCategorias();
}, []);

useEffect(() => {

if (!documento) return;

setNombre(documento.nombre);
setDescripcion(documento.descripcion ?? "");
setCategoriaId(documento.categoria_id);

}, [documento]);

async function cargarCategorias() {

const { data } = await supabase
    .from("categorias_documentos")
    .select("id,nombre")
    .eq("activo", true)
    .order("nombre");

setCategorias(data ?? []);

}

async function guardarDocumento() {

if (!nombre.trim()) {
    alert("Ingrese un nombre.");
    return;
}

if (!categoriaId) {
    alert("Seleccione una categoría.");
    return;
}

if (!documento && !archivo) {
    alert("Seleccione un archivo.");
    return;
}

try {

    setGuardando(true);

    let rutaArchivo =
    documento?.archivo_url ?? "";

    let nombreArchivo =
    documento?.archivo_nombre ?? "";

    let tipoArchivo =
    documento?.archivo_tipo ?? "";

    let tamañoArchivo =
    documento?.archivo_size ?? null;

    // ============================
    // SUBIR NUEVO ARCHIVO
    // ============================

    if (archivo) {

    const ruta =
        `${Date.now()}_${archivo.name}`;

    const { error: errorStorage } =
        await supabase.storage
        .from("documentos")
        .upload(ruta, archivo);

    if (errorStorage)
        throw errorStorage;

    rutaArchivo = ruta;

    nombreArchivo = archivo.name;

    tipoArchivo = archivo.type;

    tamañoArchivo = archivo.size;

    }

    const datos = {

    nombre,

    descripcion,

    categoria_id: categoriaId,

    archivo_nombre: nombreArchivo,

    archivo_url: rutaArchivo,

    archivo_tipo: tipoArchivo,

    archivo_size: tamañoArchivo,

    };

    if (documento) {

    const { error } = await supabase

        .from("documentos")

        .update(datos)

        .eq("id", documento.id);

    if (error) throw error;

    } else {

    const { error } = await supabase

        .from("documentos")

        .insert(datos);

    if (error) throw error;

    }

    onSuccess();

    onClose();

}

catch (error) {

    console.error(error);

    alert("Error guardando documento.");

}

finally {

    setGuardando(false);

}

}

return (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-xl">

    <h2 className="text-2xl font-semibold mb-6">

        {documento
        ? "Editar Documento"
        : "Nuevo Documento"}

    </h2>

    <div className="space-y-5">

        <div>

        <label className="block mb-2 font-medium">

            Nombre

        </label>

        <input
            type="text"
            value={nombre}
            onChange={(e) =>
            setNombre(e.target.value)
            }
            className="w-full border rounded-lg p-2"
        />

        </div>

        <div>

        <label className="block mb-2 font-medium">

            Descripción

        </label>

        <textarea
            rows={3}
            value={descripcion}
            onChange={(e) =>
            setDescripcion(e.target.value)
            }
            className="w-full border rounded-lg p-3"
        />

        </div>

        <div>

        <label className="block mb-2 font-medium">

            Categoría

        </label>

        <select
            value={categoriaId}
            onChange={(e) =>
            setCategoriaId(e.target.value)
            }
            className="w-full border rounded-lg p-2"
        >

            <option value="">
            Seleccione...
            </option>

            {categorias.map((c) => (

            <option
                key={c.id}
                value={c.id}
            >
                {c.nombre}
            </option>

            ))}

        </select>

        </div>

    {/* ===========================================================
    ARCHIVO DEL DOCUMENTO
    =========================================================== */}

<div>

    <label className="block mb-3 font-medium">
        Documento
    </label>

    {/* Input oculto */}

    <input
        ref={inputArchivoRef}
        type="file"
        className="hidden"
        onChange={(e) =>
            setArchivo(e.target.files?.[0] ?? null)
        }
    />

    {/* Si estamos editando mostramos el archivo existente */}

    {documento && !archivo && (

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">

            <p className="text-sm text-gray-500 mb-2">
                Archivo actual
            </p>

            <div className="flex items-center gap-3">

                <FileText className="w-6 h-6 text-red-500" />

                <span className="font-medium">
                    {documento.archivo_nombre}
                </span>

            </div>

        </div>

    )}

    {/* Si el usuario eligió otro archivo */}

    {archivo && (

        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">

            <p className="text-sm text-green-700 mb-2">

                Nuevo archivo seleccionado

            </p>

            <div className="flex items-center gap-3">

                <FileText className="w-6 h-6 text-green-600" />

                <span className="font-medium">

                    {archivo.name}

                </span>

            </div>

        </div>

    )}

    <button
        type="button"
        onClick={() => inputArchivoRef.current?.click()}
        className="
            w-full
            flex
            items-center
            justify-center
            gap-3
            rounded-lg
            border-2
            border-dashed
            border-blue-300
            bg-blue-50
            py-4
            hover:bg-blue-100
            transition
        "
    >

        <Upload className="w-5 h-5" />

        <span>

            {documento
                ? "Cambiar archivo"
                : "Seleccionar archivo"}

        </span>

    </button>

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

        onClick={guardarDocumento}

        disabled={guardando}

        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"

        >

        {guardando
            ? "Guardando..."
            : documento
            ? "Actualizar"
            : "Guardar"}

        </button>

    </div>

    </div>

</div>

);

}