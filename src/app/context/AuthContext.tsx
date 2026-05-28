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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        obtenerUsuario(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function obtenerUsuario(authId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('AUTH USER:', user);

  if (!user) return;

  setUser({
    id: user.id,
    nombre: user.email || 'Usuario',
    email: user.email || '',
  });
}

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await obtenerUsuario(session.user.id);
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