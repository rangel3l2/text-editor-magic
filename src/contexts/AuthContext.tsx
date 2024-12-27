import { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType } from './auth/types';
import { useAuthSession } from './auth/useAuthSession';
import { handleGoogleSignIn, handleSignOut } from './auth/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const navigate = useNavigate();

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
      navigate('/');
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