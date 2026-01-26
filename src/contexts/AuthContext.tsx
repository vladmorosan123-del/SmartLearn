import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName?: string, role?: AppRole) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
