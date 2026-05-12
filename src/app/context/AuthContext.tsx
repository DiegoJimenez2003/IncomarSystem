import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'administrador' | 'supervisor' | 'calidad' | 'secretaria';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Array<User & { password: string }> = [
  {
    id: '1',
    nombre: 'Carlos Administrador',
    email: 'admin@incomar.cl',
    password: 'admin123',
    rol: 'administrador',
  },
  {
    id: '2',
    nombre: 'Juan Supervisor',
    email: 'supervisor@incomar.cl',
    password: 'super123',
    rol: 'supervisor',
  },
  {
    id: '3',
    nombre: 'María Calidad',
    email: 'calidad@incomar.cl',
    password: 'calidad123',
    rol: 'calidad',
  },
  {
    id: '4',
    nombre: 'Ana Secretaria',
    email: 'secretaria@incomar.cl',
    password: 'secre123',
    rol: 'secretaria',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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
