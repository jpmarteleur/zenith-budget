import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export const GUEST_EMAIL = 'guest@demo.com';
export const GUEST_USER_ID = 'local-guest-user';

// A mock user object for guest sessions that satisfies the User type.
const GUEST_USER_OBJECT: User = {
    id: GUEST_USER_ID,
    email: GUEST_EMAIL,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone: '',
    identities: [],
};

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signup: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      // Check for guest status in local storage on initial load
      return window.localStorage.getItem('zenith-is-guest') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // If guest mode is active, set up the guest user and skip supabase listeners.
    if (isGuest) {
      setCurrentUser(GUEST_USER_OBJECT);
      setSession(null);
      setLoading(false);
      return;
    }

    // Standard Supabase auth logic for registered users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Initial check for an existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isGuest]);

  const authValue = useMemo(() => {
    const handleAuthAction = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });
        if (error) throw error;
    };
      
    const login = (email: string) => handleAuthAction(email);
    const signup = (email: string) => handleAuthAction(email);
    
    const loginAsGuest = () => {
        localStorage.setItem('zenith-is-guest', 'true');
        setIsGuest(true);
    };

    const logout = async () => {
      if (isGuest) {
          localStorage.removeItem('zenith-is-guest');
          localStorage.removeItem('zenith-guest-budget'); // Clear guest data on logout
          setIsGuest(false);
          setCurrentUser(null);
      } else {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
      }
    };
      
    return {
        currentUser,
        session,
        loading,
        signup,
        login,
        logout,
        loginAsGuest,
    };
  }, [currentUser, session, loading, isGuest]);

  return (
    <AuthContext.Provider value={authValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
