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
  // Initialize from localStorage
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.role);
    return (saved as UserRole) || null;
  });
  
  const [subject, setSubjectState] = useState<Subject | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.subject);
    return (saved as Subject) || null;
  });
  
  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.userName) || '';
  });

  // Persist to localStorage
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem(STORAGE_KEYS.role, newRole);
    } else {
      localStorage.removeItem(STORAGE_KEYS.role);
    }
  };

  const setSubject = (newSubject: Subject | null) => {
    setSubjectState(newSubject);
    if (newSubject) {
      localStorage.setItem(STORAGE_KEYS.subject, newSubject);
    } else {
      localStorage.removeItem(STORAGE_KEYS.subject);
    }
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (name) {
      localStorage.setItem(STORAGE_KEYS.userName, name);
    } else {
      localStorage.removeItem(STORAGE_KEYS.userName);
    }
  };

  const clearSession = () => {
    setRoleState(null);
    setSubjectState(null);
    setUserNameState('');
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
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
