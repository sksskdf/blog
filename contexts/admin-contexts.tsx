"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const toggleAdmin = () => {
    setIsAdmin((prev) => !prev);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
