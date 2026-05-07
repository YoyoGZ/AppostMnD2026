"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  role: 'super_admin' | 'captain' | 'player' | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'super_admin' | 'captain' | 'player' | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        setUser(supabaseUser);
        setRole(supabaseUser.user_metadata?.role || 'player');
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error("Error loading user context:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
