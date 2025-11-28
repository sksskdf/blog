import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // localStorage에서 관리자 모드 상태 복원
    const savedAdminState = localStorage.getItem('isAdmin');
    if (savedAdminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const toggleAdmin = () => {
    const newState = !isAdmin;
    setIsAdmin(newState);
    localStorage.setItem('isAdmin', newState.toString());
  };

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

