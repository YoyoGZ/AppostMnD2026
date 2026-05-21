"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;
  brandTheme: any;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ 
  children,
  brandTheme = null
}: { 
  children: React.ReactNode;
  brandTheme?: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpenState] = useState(false);

  // Sincronización del estado del chat con el historial del navegador (botón atrás en móviles)
  useEffect(() => {
    // Verificación inicial por si la URL ya trae el hash
    if (window.location.hash === "#chat") {
      setIsChatOpenState(true);
    }

    const handlePopState = () => {
      // Sincronizar el estado de React estrictamente con la presencia del hash
      setIsChatOpenState(window.location.hash === "#chat");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setIsChatOpen = useCallback((value: boolean) => {
    setIsChatOpenState(value);
    
    if (typeof window === "undefined") return;

    if (value) {
      // Si abrimos el chat, agregamos un estado al historial
      if (window.location.hash !== "#chat") {
        window.history.pushState(null, "", window.location.pathname + window.location.search + "#chat");
      }
    } else {
      // Si lo cerramos por UI, retrocedemos en el historial para no acumular basura
      if (window.location.hash === "#chat") {
        window.history.back();
      }
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      setIsCollapsed, 
      isChatOpen, 
      setIsChatOpen,
      brandTheme
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
