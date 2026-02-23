import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
}

interface SimpleUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: SimpleUser | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  role: AppRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: any }>;
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
