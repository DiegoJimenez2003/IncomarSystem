import { useState } from 'react';
import { Navigate } from 'react-router';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from "../../assets/logo_sin_nombre.png";
import { supabase } from '../../utils/supabase';

export function LoginPage() {
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para alternar entre login y "olvidé mi contraseña"
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Si ya está autenticado → dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos');
      setLoading(false);
      return;
    }

    // Forzar recarga completa para que AuthContext se actualice correctamente
    window.location.href = '/dashboard';
  };

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setResetError('No se pudo enviar el correo. Intenta nuevamente.');
      return;
    }

    setResetMessage('Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center p-4">
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
            Sistema de Trazabilidad y Gestión Pesquera
          </p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-gray-700 mb-2">
                Correo Electrónico
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="correo@incomar.cl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Contraseña
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
                />
              </div>

              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setResetEmail(email);
                    setResetMessage('');
                    setResetError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
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
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">

            <button
              type="button"
              onClick={() => {
                setView('login');
                setResetError('');
                setResetMessage('');
              }}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a iniciar sesión
            </button>

            <div>
              <label className="block text-gray-700 mb-2">
                Ingresa tu correo electrónico
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="correo@incomar.cl"
                  required
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            {resetError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-center">
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-center">
                {resetMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}