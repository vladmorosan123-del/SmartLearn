import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'student' | 'profesor' | 'admin' | null;
export type Subject = 'informatica' | 'romana' | 'matematica' | 'fizica';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  subject: Subject | null;
  setSubject: (subject: Subject | null) => void;
  userName: string;
  setUserName: (name: string) => void;
  // Persistence helpers
  clearSession: () => void;
}

const STORAGE_KEYS = {
  role: 'lm_user_role',
  subject: 'lm_subject',
  userName: 'lm_user_name',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state without persistence — fresh on every tab/refresh
  const [role, setRoleState] = useState<UserRole>(null);
  const [subject, setSubjectState] = useState<Subject | null>(null);
  const [userName, setUserNameState] = useState<string>('');

  // Clear any old persisted values on mount
  useEffect(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const setSubject = (newSubject: Subject | null) => {
    setSubjectState(newSubject);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
  };

  const clearSession = () => {
    setRoleState(null);
    setSubjectState(null);
    setUserNameState('');
  };

  return (
    <AppContext.Provider value={{ 
      role, 
      setRole, 
      subject, 
      setSubject, 
      userName, 
      setUserName,
      clearSession 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
