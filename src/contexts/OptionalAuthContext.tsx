import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { WebAuthSession as AuthSession } from '../services/webAuthService';
import { ApiClient } from '../utils/ApiClient';
import { Helper } from '../types';
import { useNotification } from './NotificationContext';
import { localStorageService } from '../services/localStorageService';

// Auth0 Configuration (Optional)
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || '';
const AUTH_OPTIONAL = import.meta.env.VITE_AUTH_OPTIONAL === 'true';
const ALLOW_ANONYMOUS = import.meta.env.VITE_ALLOW_ANONYMOUS === 'true';

const REDIRECT_URI = AUTH0_DOMAIN ? AuthSession.makeRedirectUri() : '';

export interface OptionalAuthContextType {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: any;
  helperProfile: Helper | null;
  isNewUser: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email?: string, password?: string, name?: string) => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateHelperProfile: (updatedProfile: Helper) => void;
  userToken: string | null;
  anonymousId: string | null;
  authState?: any;
}

// Global state object
export const authState: {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: any;
  helperProfile: Helper | null;
  userToken: string | null;
  anonymousId: string | null;
} = {
  isAuthenticated: false,
  isAnonymous: true,
  user: null,
  helperProfile: null,
  userToken: null,
  anonymousId: null,
};

const OptionalAuthContext = createContext<OptionalAuthContextType | undefined>(undefined);

export { OptionalAuthContext };

// Helper to decode JWT payload
const jwtDecode = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error("Invalid JWT: Missing payload part.");
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
};

export const OptionalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [helperProfile, setHelperProfile] = useState<Helper | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const { addToast } = useNotification();

  // Initialize Auth0 discovery only if configured
  const discovery = AUTH0_DOMAIN ? AuthSession.useAutoDiscovery(`https://${AUTH0_DOMAIN}`) : null;

  const [request, response, promptAsync] = AUTH0_DOMAIN ? AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Token,
      scopes: ['openid', 'profile', 'email'],
      extraParams: {
        audience: AUTH0_AUDIENCE,
      },
    },
    discovery
  ) : [null, null, null];

  const fetchHelperProfile = useCallback(async (auth0UserId: string) => {
    if (!auth0UserId) return;
    try {
      const profile = await ApiClient.helpers.getProfile(auth0UserId);
      if (profile) {
        setHelperProfile(profile);
        setIsNewUser(false);
      } else {
        setHelperProfile(null);
        setIsNewUser(true);
      }
    } catch (error) {
      console.error("Failed to fetch helper profile", error);
      setHelperProfile(null);
      setIsNewUser(true);
    }
  }, []);

  const setAuthData = useCallback(async (accessToken: string | null) => {
    if (accessToken) {
      sessionStorage.setItem('accessToken', accessToken);
      const decodedToken = jwtDecode(accessToken);
      setUser(decodedToken);
      setIsAnonymous(false);
      if (decodedToken?.sub) {
        await fetchHelperProfile(decodedToken.sub);
      }
    } else {
      sessionStorage.removeItem('accessToken');
      setUser(null);
      setHelperProfile(null);
      setIsNewUser(false);
      setIsAnonymous(true);
    }
  }, [fetchHelperProfile]);

  // Initialize anonymous user on mount
  useEffect(() => {
    // Generate or retrieve anonymous ID
    let anonId = localStorageService.getAnonymousId();
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorageService.setAnonymousId(anonId);
    }
    setAnonymousId(anonId);
    
    // Generate or retrieve user token for anonymous users
    let token = localStorage.getItem('userToken');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('userToken', token);
    }
    setUserToken(token);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    // Check if this is a demo user logout
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_token');
    }
    
    // Clear auth state but maintain anonymous access
    await setAuthData(null);
    
    // Reset to anonymous state
    setIsAnonymous(true);
    
    // Update global auth state
    authState.isAuthenticated = false;
    authState.isAnonymous = true;
    authState.user = null;
    authState.helperProfile = null;
    
    setIsLoading(false);
    
    // If Auth0 is configured and user was authenticated, perform Auth0 logout
    if (discovery?.endSessionEndpoint && !isAnonymous) {
      const logoutUrl = `${discovery.endSessionEndpoint}?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(window.location.origin)}`;
      window.location.assign(logoutUrl);
    }
  }, [discovery, setAuthData, isAnonymous]);

  // Load existing session on mount
  useEffect(() => {
    const loadToken = async () => {
      console.log("OptionalAuthContext: Starting token load");
      setIsLoading(true);
      try {
        // Check for demo user first
        const demoUser = localStorage.getItem('demo_user');
        const demoToken = localStorage.getItem('demo_token');
        
        if (demoUser && demoToken) {
          console.log("OptionalAuthContext: Loading demo user");
          const userData = JSON.parse(demoUser);
          setUser(userData);
          setUserToken(demoToken);
          setIsAnonymous(false);
          
          if (userData.helperProfile) {
            setHelperProfile(userData.helperProfile);
            setIsNewUser(false);
          } else {
            setHelperProfile(null);
            setIsNewUser(userData.userType === 'helper' || userData.userType === 'admin');
          }
          
          authState.isAuthenticated = true;
          authState.isAnonymous = false;
          authState.user = userData;
          authState.helperProfile = userData.helperProfile || null;
          authState.userToken = demoToken;
          
          setIsLoading(false);
          return;
        }
        
        // Check for existing auth token
        const storedToken = sessionStorage.getItem('accessToken');
        if (storedToken) {
          const decodedToken = jwtDecode(storedToken);
          if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
            await setAuthData(storedToken);
            setIsAnonymous(false);
          } else {
            // Token expired, clear it
            await setAuthData(null);
          }
        }
        
        // If no auth, remain anonymous
        console.log("OptionalAuthContext: No authentication found, using anonymous mode");
      } catch (error) {
        console.error("Error during token loading:", error);
        // Default to anonymous mode on error
        await setAuthData(null);
      } finally {
        console.log("OptionalAuthContext: Token load complete");
        setIsLoading(false);
      }
    };
    loadToken();
  }, [setAuthData]);

  // Handle Auth0 response
  useEffect(() => {
    if (response?.type === 'success' && response.params.access_token) {
      setAuthData(response.params.access_token);
    } else if (response?.type === 'error') {
      addToast('Authentication error: ' + (response.params.error_description || response.error?.message), 'error');
      console.error(response.error);
    }
  }, [response, setAuthData, addToast]);

  const login = useCallback(async () => {
    // If Auth0 is not configured, show a message
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      addToast('Login is optional. You can use all features without signing in!', 'info');
      return;
    }
    
    if (!request) {
      const errorMessage = "Authentication service is not configured correctly.";
      console.error(errorMessage);
      addToast(errorMessage, 'error');
      return;
    }
    
    await promptAsync?.();
  }, [request, promptAsync, addToast]);

  const register = useCallback(async (email?: string, password?: string, name?: string) => {
    // For anonymous mode, registration is optional
    if (!AUTH0_DOMAIN) {
      addToast('Registration is optional. You can use all features without an account!', 'info');
      return;
    }
    
    // If Auth0 is configured, redirect to Auth0 signup
    await login();
  }, [login, addToast]);

  const reloadProfile = useCallback(async () => {
    if (user?.sub) {
      await fetchHelperProfile(user.sub);
    }
  }, [user, fetchHelperProfile]);
  
  const updateHelperProfile = useCallback((updatedProfile: Helper) => {
    setHelperProfile(updatedProfile);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated: !!user && !isAnonymous,
    isAnonymous,
    user,
    helperProfile,
    isNewUser,
    isLoading,
    login,
    logout,
    register,
    reloadProfile,
    updateHelperProfile,
    userToken,
    anonymousId,
    authState: { 
      isAuthenticated: !!user && !isAnonymous, 
      isAnonymous,
      user, 
      helperProfile, 
      userToken,
      anonymousId
    },
  }), [user, isAnonymous, helperProfile, isNewUser, isLoading, login, logout, register, reloadProfile, updateHelperProfile, userToken, anonymousId]);

  // Sync with global state object
  useEffect(() => {
    authState.isAuthenticated = value.isAuthenticated;
    authState.isAnonymous = value.isAnonymous;
    authState.user = value.user;
    authState.helperProfile = value.helperProfile;
    authState.userToken = value.userToken;
    authState.anonymousId = value.anonymousId;
  }, [value]);

  return <OptionalAuthContext.Provider value={value}>{children}</OptionalAuthContext.Provider>;
};

export const useOptionalAuth = (): OptionalAuthContextType => {
  const context = useContext(OptionalAuthContext);
  if (context === undefined) {
    throw new Error('useOptionalAuth must be used within an OptionalAuthProvider');
  }
  return context;
};

// Export a hook that maintains compatibility with existing useAuth calls
export const useAuth = useOptionalAuth;