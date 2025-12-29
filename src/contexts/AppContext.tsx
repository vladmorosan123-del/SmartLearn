import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'profesor' | null;
export type Subject = 'informatica' | 'romana' | 'matematica' | 'fizica' | null;

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  subject: Subject;
  setSubject: (subject: Subject) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>(null);
  const [subject, setSubject] = useState<Subject>(null);
  const [userName, setUserName] = useState<string>('');

  return (
    <AppContext.Provider value={{ role, setRole, subject, setSubject, userName, setUserName }}>
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
