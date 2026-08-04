import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, CheckCircle } from 'lucide-react';
import logo from "../../assets/logo_sin_nombre.png";
import { supabase } from '../../utils/supabase';

export function ResetPasswordPage() {
const navigate = useNavigate();

const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
const [loading, setLoading] = useState(false);

const handleSubmit = async (
e: React.FormEvent<HTMLFormElement>
) => {
e.preventDefault();

setError('');

if (password.length < 6) {
    setError('La contraseña debe tener al menos 6 caracteres');
    return;
}

if (password !== confirmPassword) {
    setError('Las contraseñas no coinciden');
    return;
}

setLoading(true);

const { error } = await supabase.auth.updateUser({ password });

setLoading(false);

if (error) {
    setError('No se pudo actualizar la contraseña. El enlace puede haber expirado, solicita uno nuevo.');
    return;
}

setSuccess(true);

setTimeout(() => {
    navigate('/login');
}, 2500);
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

    <div className="text-center mb-6">
        <div className="flex justify-center">
        <img
            src={logo}
            alt="Incomar"
            className="w-28 h-28 object-contain"
        />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mt-2">
        INCOMAR
        </h1>

        <p className="text-gray-600 mt-1">
        Restablecer contraseña
        </p>
    </div>

    {success ? (
        <div className="text-center space-y-4">
        <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
            Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...
        </div>
        </div>
    ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

        <div>
            <label className="block text-gray-700 mb-2">
            Nueva contraseña
            </label>

            <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
            />
            </div>
        </div>

        <div>
            <label className="block text-gray-700 mb-2">
            Confirmar contraseña
            </label>

            <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
            />
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-center">
            {error}
            </div>
        )}

        <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
        </form>
    )}
    </div>
</div>
);
}