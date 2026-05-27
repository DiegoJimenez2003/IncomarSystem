import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { supabase } from '../../utils/supabase';

export type UserRole =
  | 'administrador'
  | 'supervisor'
  | 'calidad'
  | 'secretaria';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol?: UserRole;
}

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        obtenerUsuario(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function obtenerUsuario(authId: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombre,
        email,
        rol_id,
        roles (
        nombre
        )
      `)
      .eq('auth_id', authId)
      .maybeSingle();

    console.log('USUARIO:', data);
    console.log('ERROR:', error);

    if (error) {
      console.error('Error obteniendo usuario:', error);
      return;
    }

    if (!data) {
      console.error('No existe usuario en tabla usuarios');
      return;
    }

    setUser({
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: Array.isArray(data.roles)
          ? data.roles[0]?.nombre as UserRole
          : (data.roles as any)?.nombre as UserRole,
      });

    setLoading(false);
  }

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await obtenerUsuario(session.user.id);
    } else {
      setLoading(false);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}