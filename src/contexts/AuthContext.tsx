import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  role: 'manager' | 'associate' | null; // Explicit role type
  userId: string | null;               // Expose user ID
}

const AuthContext = createContext<AuthContextType>({ session: null, role: null, userId: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'manager' | 'associate' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        setUserId(session.user.id);
        checkRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        setUserId(session.user.id);
        checkRole(session.user.id);
      } else {
        setRole(null); // Reset role on logout
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching role:', error.message);
        return;
      }

      setRole(data?.role || null);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, role, userId }}>
      {children}
    </AuthContext.Provider>
  );
};
