import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import { useCart } from './cart';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { syncCart } = useCart();

  useEffect(() => {
    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        syncCart(); // Sync cart when session is found
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        syncCart(); // Sync cart when auth state changes
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    // Check admin session
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      setIsAdmin(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [syncCart]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Connexion réussie'
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : 'Une erreur est survenue lors de la connexion'
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_email: email,
        p_password: password
      });

      if (error) throw error;

      if (!data || !data.length) {
        return {
          success: false,
          message: 'Identifiants invalides'
        };
      }

      const { success, message, admin_id } = data[0];

      if (success && admin_id) {
        setIsAdmin(true);
        localStorage.setItem('adminId', admin_id);
      }

      return { success, message };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la connexion'
      };
    }
  };

  const adminLogout = async () => {
    localStorage.removeItem('adminId');
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        signIn,
        signOut,
        adminLogin,
        adminLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}