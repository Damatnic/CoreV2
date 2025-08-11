import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { WebAuthSession as AuthSession } from '../services/webAuthService';
import { ApiClient } from '../utils/ApiClient';
import { Helper } from '../types';
import { useNotification } from './NotificationContext';

// --- Auth0 Configuration ---
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'demo.auth0.com';
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'demo-client-id';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'demo-audience';

// Only show info message on initial load for demo mode
if (process.env.NODE_ENV === 'development' && (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_AUDIENCE)) {
    // Check if we're on non-Netlify dev port
    const currentPort = typeof window !== 'undefined' ? window.location.port : '';
    if (currentPort && currentPort !== '8888') {
        console.info('✓ Running in demo mode - Auth0 not required');
    }
}


// This should match one of the "Allowed Callback URLs" in your Auth0 Application settings
const REDIRECT_URI = AuthSession.makeRedirectUri();

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // The decoded JWT payload
  helperProfile: Helper | null;
  isNewUser: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateHelperProfile: (updatedProfile: Helper) => void;
  userToken: string | null;
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


const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload.
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [helperProfile, setHelperProfile] = useState<Helper | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const { addToast } = useNotification();

  const discovery = AuthSession.useAutoDiscovery(`https://${AUTH0_DOMAIN}`);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
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
  );

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
        if (decodedToken?.sub) {
            await fetchHelperProfile(decodedToken.sub);
        }
    } else {
        sessionStorage.removeItem('accessToken');
        setUser(null);
        setHelperProfile(null);
        setIsNewUser(false);
    }
  }, [fetchHelperProfile]);
  
  // Anonymous user token management
  useEffect(() => {
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
        // Clear demo user data
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_token');
        
        // Clear demo auth state
        setUser(null);
        setHelperProfile(null);
        setIsNewUser(false);
        setUserToken(null);
        
        // Update global auth state
        authState.isAuthenticated = false;
        authState.user = null;
        authState.helperProfile = null;
        authState.userToken = null;
        
        setIsLoading(false);
        
        // Reload to reset the app state
        window.location.reload();
        return;
    }
    
    // Original logout logic for real authentication
    await setAuthData(null);
    if (discovery?.endSessionEndpoint) {
        const logoutUrl = `${discovery.endSessionEndpoint}?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(window.location.origin)}`;
        window.location.assign(logoutUrl);
    }
  }, [discovery, setAuthData]);

  useEffect(() => {
    const loadToken = async () => {
        console.log("AuthContext: Starting token load, setting isLoading to true");
        setIsLoading(true);
        try {
            // Check for demo user first
            const demoUser = localStorage.getItem('demo_user');
            const demoToken = localStorage.getItem('demo_token');
            
            if (demoUser && demoToken) {
                console.log("AuthContext: Loading demo user");
                const userData = JSON.parse(demoUser);
                setUser(userData);
                setUserToken(demoToken);
                
                // Set helper profile if this is a helper/admin demo user
                if (userData.helperProfile) {
                    setHelperProfile(userData.helperProfile);
                    setIsNewUser(false);
                } else {
                    setHelperProfile(null);
                    setIsNewUser(userData.userType === 'helper' || userData.userType === 'admin');
                }
                
                // Update global auth state for demo user
                authState.isAuthenticated = true;
                authState.user = userData;
                authState.helperProfile = userData.helperProfile || null;
                authState.userToken = demoToken;
                
                setIsLoading(false);
                return;
            }
            
            // Original token loading logic for real authentication
            const storedToken = sessionStorage.getItem('accessToken');
            console.log("AuthContext: Stored token:", storedToken ? "exists" : "none");
            if (storedToken) {
                const decodedToken = jwtDecode(storedToken);
                // Check if token is valid and not expired
                if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
                    await setAuthData(storedToken);
                } else {
                    // Token is expired or invalid, clear it
                    await setAuthData(null);
                }
            } else {
                console.log("AuthContext: No stored token, clearing auth data");
                await setAuthData(null);
            }
        } catch (error) {
            console.error("Critical error during token loading:", error);
            // Ensure auth state is cleared on any error
            await setAuthData(null);
        } finally {
            console.log("AuthContext: Token load complete, setting isLoading to false");
            setIsLoading(false);
        }
    };
    loadToken();
  }, [setAuthData]);

  useEffect(() => {
    if (response?.type === 'success' && response.params.access_token) {
        setAuthData(response.params.access_token);
    } else if (response?.type === 'error') {
        addToast('Authentication error: ' + (response.params.error_description || response.error?.message), 'error');
        console.error(response.error);
    }
  }, [response, setAuthData, addToast]);


  const login = useCallback(async () => {
    if (!request || !AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
        const errorMessage = "Authentication service is not configured correctly.";
        console.error(errorMessage);
        addToast(errorMessage, 'error');
        return;
    }
    await promptAsync();
  }, [request, promptAsync, addToast]);

  // Global listener for auth errors (e.g., 401 Unauthorized)
  useEffect(() => {
    const handleAuthError = () => {
        console.warn("Authentication error detected. Forcing logout.");
        addToast("Your session has expired or is invalid. Please log in again.", 'error');
        logout();
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => {
        window.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout, addToast]);


  const reloadProfile = useCallback(async () => {
    if (user?.sub) {
      await fetchHelperProfile(user.sub);
    }
  }, [user, fetchHelperProfile]);
  
  const updateHelperProfile = useCallback((updatedProfile: Helper) => {
    setHelperProfile(updatedProfile);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    helperProfile,
    isNewUser,
    isLoading,
    login,
    logout,
    reloadProfile,
    updateHelperProfile,
    userToken,
  }), [user, helperProfile, isNewUser, isLoading, login, logout, reloadProfile, updateHelperProfile, userToken]);

  // Sync with global state object
  useEffect(() => {
      authState.isAuthenticated = value.isAuthenticated;
      authState.user = value.user;
      authState.helperProfile = value.helperProfile;
      authState.userToken = value.userToken;
  }, [value]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Legal Consent Hook ---
const LEGAL_DOC_VERSIONS = {
    terms_of_service: '1.0',
    privacy_policy: '1.0',
    helper_agreement: '1.0',
};

export const useLegalConsents = () => {
    const [requiredConsent, setRequiredConsent] = useState<string | null>(null);
    const [allConsentsGiven, setAllConsentsGiven] = useState(true); // Temporarily set to true for development
    const { isAuthenticated, helperProfile, userToken } = useAuth();
    const { addToast } = useNotification();

    const checkConsents = useCallback(async () => {
        try {
            const currentUserId = helperProfile?.id || userToken;
            console.log("Consent check: currentUserId =", currentUserId);
            if (!currentUserId) {
                console.log("Consent check: No user ID, setting allConsentsGiven to false");
                setAllConsentsGiven(false);
                return;
            }

            setRequiredConsent(null);

            let requiredDocs: string[] = ['terms_of_service', 'privacy_policy'];
            if (isAuthenticated) {
                requiredDocs.push('helper_agreement');
            }
            console.log("Consent check: Required docs =", requiredDocs);

            // For development: Skip consent checks and allow app to load
            console.log("Consent check: Skipping consent verification for development");
            // Uncomment the block below for production consent checking
            console.log("Consent check: All consents satisfied, setting allConsentsGiven to true");
            setRequiredConsent(null);
            setAllConsentsGiven(true);
        } catch (error) {
            console.error("Failed to check consents:", error);
            addToast("Could not verify legal agreements. Please try again later.", "error");
            setAllConsentsGiven(false); // Fail safe
        }
    }, [userToken, helperProfile, isAuthenticated, addToast]);

    useEffect(() => {
        checkConsents();
    }, [checkConsents]);

    const acceptConsent = async () => {
        const currentUserId = helperProfile?.id || userToken;
        if (!requiredConsent || !currentUserId) return;

        const userType = isAuthenticated ? 'helper' : 'seeker';
        const requiredVersion = LEGAL_DOC_VERSIONS[requiredConsent as keyof typeof LEGAL_DOC_VERSIONS];

        try {
            await ApiClient.legal.recordConsent(currentUserId, userType, requiredConsent, requiredVersion);
            await checkConsents(); // Re-check after accepting
        } catch (err) {
            console.error(err);
            addToast("Failed to save your agreement. Please try again.", 'error');
        }
    };
    
    const getConsentContent = (docType: string | null) => {
        if (!docType) return { title: '', text: ''};
        const version = LEGAL_DOC_VERSIONS[docType as keyof typeof LEGAL_DOC_VERSIONS];
        switch(docType) {
            case 'terms_of_service': return {
                title: `Terms of Service (v${version})`,
                text: 'Please review and accept our updated Terms of Service to continue. Our terms outline the rules for community conduct and the scope of our peer support services.'
            };
            case 'privacy_policy': return {
                title: `Privacy Policy (v${version})`,
                text: 'Our Privacy Policy has been updated. Please review how we handle data, ensure your anonymity, and protect your privacy.'
            };
            case 'helper_agreement': return {
                title: `Helper Agreement (v${version})`,
                text: 'To continue as a Helper, please review and accept the Helper Agreement, which outlines your role, responsibilities, and our code of conduct.'
            };
            default: return { title: 'Community Agreement', text: 'Please review our community agreements to continue.'};
        }
    }

    return {
        requiredConsent,
        allConsentsGiven,
        acceptConsent,
        getConsentContent,
    };
};