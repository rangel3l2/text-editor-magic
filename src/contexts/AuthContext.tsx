import { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from './auth/types';
import { useAuthSession } from './auth/useAuthSession';
import { handleGoogleSignIn, handleSignOut } from './auth/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onSignOut?: () => void;
}

export function AuthProvider({ children, onSignOut }: AuthProviderProps) {
  const { user } = useAuthSession();

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google login...");
      await handleGoogleSignIn();
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
    }
  };

  const signOut = async () => {
    try {
      await handleSignOut();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  console.log("Current user in AuthContext:", user);

  const value = {
    user,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};