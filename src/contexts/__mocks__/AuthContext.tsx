import React, { createContext, useContext, ReactNode } from 'react';
import { Helper } from '../../types';

// Mock Auth Context for testing
export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  helperProfile: Helper | null;
  isNewUser: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateHelperProfile: (updatedProfile: Helper) => void;
  userToken: string | null;
  isAnonymous?: boolean;
  authState?: any;
  register?: () => Promise<void>;
}

// Global state object to bridge context and stores
export const authState: {
  isAuthenticated: boolean;
  user: any;
  helperProfile: Helper | null;
  userToken: string | null;
} = {
  isAuthenticated: false,
  user: null,
  helperProfile: null,
  userToken: null,
};

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  helperProfile: null,
  isNewUser: false,
  isLoading: false,
  login: jest.fn(() => Promise.resolve()),
  logout: jest.fn(() => Promise.resolve()),
  reloadProfile: jest.fn(() => Promise.resolve()),
  updateHelperProfile: jest.fn(),
  userToken: null,
  isAnonymous: false,
  authState: authState,
  register: jest.fn(() => Promise.resolve()),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={defaultAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};

export default AuthContext;