import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabase";
import { Eye, EyeOff } from "lucide-react";

interface Rol {
id: string;
nombre: string;
}

interface Usuario {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
    rol_id: string;
    activo: boolean;

    roles: {
        nombre: string;
    };
}

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    usuario?: Usuario | null;
    }

export function UsuarioModal({
    onClose,
    onSuccess,
usuario,
}: Props) {
const [roles, setRoles] = useState<Rol[]>([]);

const [nombre, setNombre] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [mostrarPassword, setMostrarPassword] = useState(false);
const [telefono, setTelefono] = useState("");
const [rolId, setRolId] = useState("");
const [activo, setActivo] = useState(true);

const [guardando, setGuardando] = useState(false);

useEffect(() => {
    cargarRoles();
    }, []);

useEffect(() => {
if (!usuario) return;

    setNombre(usuario.nombre ?? "");
    setEmail(usuario.email ?? "");
    setTelefono(usuario.telefono ?? "");
    setRolId(usuario.rol_id ?? "");
    setActivo(usuario.activo ?? true);

}, [usuario]);

async function cargarRoles() {

const { data, error } = await supabase
    .from("roles")
    .select("id,nombre")
    .order("nombre");

if (!error) {
    setRoles(data ?? []);
}

}

// =====================================================
// GUARDAR USUARIO
// =====================================================
async function guardarUsuario() {

    if (!nombre.trim()) {
    alert("Ingrese el nombre.");
    return;
    }

    if (!email.trim() && !usuario) {
    alert("Ingrese el correo.");
    return;
    }

    if (!usuario && password.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
    }

    if (!rolId) {
    alert("Seleccione un rol.");
    return;
    }

    try {

    setGuardando(true);

    if (usuario) {

        const { error } = await supabase
        .from("usuarios")
        .update({
            nombre,
            telefono,
            rol_id: rolId,
            activo,
        })
        .eq("id", usuario.id);

        if (error) throw error;

    } else {

        const { data, error } =
        await supabase.functions.invoke(
            "crear-usuario",
            {
            body: {
                nombre,
                email,
                password,
                telefono,
                rol_id: rolId,
                activo,
            },
            }
        );

        if (error) throw error;

        if (!data.success) {
        alert(data.message);
        return;
        }

    }

    onSuccess();
    onClose();

    }

    catch (err) {

    console.error(err);

    alert("Error guardando usuario.");

    }

    finally {

    setGuardando(false);

    }

    }

return (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">
                {usuario ? "Editar Usuario" : "Nuevo Usuario"}
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
                />

                </div>
                <div>
                <label className="block mb-2 font-medium">
                    Correo Electrónico
                </label>

                <input
                    type="email"
                    value={email}
                    disabled={!!usuario}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg p-2 disabled:bg-gray-100"
                />

                </div>

                {!usuario && (
                <div>

                    <label className="block mb-2 font-medium">
                    Contraseña Temporal
                    </label>
                    <div className="relative">
                        <input
                            type={mostrarPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-lg p-2 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() =>
                            setMostrarPassword(!mostrarPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {mostrarPassword
                            ? <EyeOff className="w-5 h-5"/>
                            : <Eye className="w-5 h-5"/>}
                        </button>
                        </div>
                </div>

                )}

                <div>

                <label className="block mb-2 font-medium">
                    Teléfono
                </label>

                <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border rounded-lg p-2"
                />

                </div>

                <div>

                <label className="block mb-2 font-medium">

                    Rol

                </label>

                <select
                    value={rolId}
                    onChange={(e) => setRolId(e.target.value)}
                    className="w-full border rounded-lg p-2"
                >

                    <option value="">
                    Seleccione...
                    </option>

                    {roles.map((rol) => (

                    <option
                        key={rol.id}
                        value={rol.id}
                    >
                        {rol.nombre}
                    </option>

                    ))}

                </select>

                </div>

                <div className="flex items-center gap-3">

                <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                />

                <label>

                    Usuario Activo

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
        onClick={guardarUsuario}
        disabled={guardando}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >

        {guardando
            ? "Guardando..."
            : usuario
            ? "Actualizar"
            : "Guardar"}

        </button>

    </div>

    </div>

</div>

);

}

