/**
 * Simple Authentication Service
 * Replaces Auth0 with JWT-based authentication using our Netlify function
 */

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

class SimpleAuthService {
  private token: string | null = null;
  private user: User | null = null;
  private baseUrl = '/.netlify/functions/auth';

  constructor() {
    // Load token from localStorage on init
    this.loadFromStorage();
  }

  /**
   * Load auth data from localStorage
   */
  private loadFromStorage(): void {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      this.token = storedToken;
      try {
        this.user = JSON.parse(storedUser);
      } catch {
        this.clearStorage();
      }
    }
  }

  /**
   * Save auth data to localStorage
   */
  private saveToStorage(): void {
    if (this.token && this.user) {
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(this.user));
    }
  }

  /**
   * Clear auth data from localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.token = null;
    this.user = null;
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, method = 'GET', body?: any): Promise<unknown> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/login', 'POST', { email, password });
      
      // Type guard for response
      const authResponse = response as AuthResponse;
      if (authResponse.success && authResponse.token && authResponse.user) {
        this.token = authResponse.token;
        this.user = authResponse.user;
        this.saveToStorage();
        
        // Dispatch auth event for React components
        window.dispatchEvent(new CustomEvent('auth:login', { detail: this.user }));
      }
      
      return authResponse;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string, role = 'seeker'): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/register', 'POST', { 
        email, 
        password, 
        name, 
        role 
      });
      
      // Type guard for response
      const authResponse = response as AuthResponse;
      if (authResponse.success && authResponse.token && authResponse.user) {
        this.token = authResponse.token;
        this.user = authResponse.user;
        this.saveToStorage();
        
        // Dispatch auth event for React components
        window.dispatchEvent(new CustomEvent('auth:register', { detail: this.user }));
      }
      
      return authResponse;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, mainly for server-side cleanup)
      if (this.token) {
        await this.apiRequest('/logout', 'POST');
      }
    } catch {
      // Ignore logout API errors
    } finally {
      // Always clear local auth state
      this.clearStorage();
      
      // Dispatch auth event for React components
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Redirect to home
      window.location.href = '/';
    }
  }

  /**
   * Verify current token
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.apiRequest('/verify', 'GET');
      
      // Type guard for response
      const authResponse = response as AuthResponse;
      if (authResponse.success && authResponse.user) {
        this.user = authResponse.user;
        this.saveToStorage();
        return true;
      }
      
      this.clearStorage();
      return false;
    } catch {
      this.clearStorage();
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    // If we have a cached user, return it
    if (this.user) {
      return this.user;
    }

    // Otherwise fetch from API
    try {
      const response = await this.apiRequest('/me', 'GET');
      
      // Type guard for response
      const authResponse = response as AuthResponse;
      if (authResponse.success && authResponse.user) {
        this.user = authResponse.user;
        this.saveToStorage();
        return this.user;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  /**
   * Update user profile (placeholder for future implementation)
   */
  async updateProfile(_updates: Partial<User>): Promise<AuthResponse> {
    // TODO: Implement profile update endpoint
    return { 
      success: false, 
      error: 'Profile update not implemented yet' 
    };
  }

  /**
   * Request password reset (placeholder for future implementation)
   */
  async requestPasswordReset(_email: string): Promise<AuthResponse> {
    // TODO: Implement password reset endpoint
    return { 
      success: false, 
      error: 'Password reset not implemented yet' 
    };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const handleLogin = (event: CustomEvent) => callback(event.detail);
    const handleLogout = () => callback(null);
    const handleRegister = (event: CustomEvent) => callback(event.detail);
    
    window.addEventListener('auth:login', handleLogin as EventListener);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:register', handleRegister as EventListener);
    
    // Return unsubscribe function
    return () => {
      window.removeEventListener('auth:login', handleLogin as EventListener);
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:register', handleRegister as EventListener);
    };
  }
}

// Export singleton instance
export const simpleAuthService = new SimpleAuthService();

// Export for convenience
export default simpleAuthService;