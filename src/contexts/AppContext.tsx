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
  // Initialize state from sessionStorage for persistence across refresh (clears on browser close)
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.role);
    return (saved as UserRole) || null;
  });
  const [subject, setSubjectState] = useState<Subject | null>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.subject);
    return (saved as Subject) || null;
  });
  const [userName, setUserNameState] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.userName) || '';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) sessionStorage.setItem(STORAGE_KEYS.role, newRole);
    else sessionStorage.removeItem(STORAGE_KEYS.role);
  };

  const setSubject = (newSubject: Subject | null) => {
    setSubjectState(newSubject);
    if (newSubject) sessionStorage.setItem(STORAGE_KEYS.subject, newSubject);
    else sessionStorage.removeItem(STORAGE_KEYS.subject);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (name) sessionStorage.setItem(STORAGE_KEYS.userName, name);
    else sessionStorage.removeItem(STORAGE_KEYS.userName);
  };

  const clearSession = () => {
    setRoleState(null);
    setSubjectState(null);
    setUserNameState('');
    Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
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
