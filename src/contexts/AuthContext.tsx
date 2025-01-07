import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, isManager: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkRole(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string | undefined) => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    setIsManager(data?.role === 'manager');
  };

  return (
    <AuthContext.Provider value={{ session, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};