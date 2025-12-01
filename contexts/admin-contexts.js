import { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  // 런타임 메모리만 사용 (localStorage 제거)
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleAdmin = () => {
    setIsAdmin((prev) => !prev);
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

