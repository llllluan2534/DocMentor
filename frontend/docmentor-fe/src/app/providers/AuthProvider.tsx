// src/app/providers/AuthProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  realAuthService,
  User,
  RegisterData,
  GoogleAuthResponse,
} from "../../services/auth/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  loginWithGoogle: (googleData: GoogleAuthResponse) => Promise<void>; // ✨ NEW
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = realAuthService.getToken();
        const currentUser = await realAuthService.getCurrentUser();

        if (token && currentUser) {
          console.log("✅ User authenticated:", currentUser.email);
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Traditional email/password login
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    try {
      const response = await realAuthService.login(email, password, rememberMe);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  // ✨ NEW: Google OAuth login
  const loginWithGoogle = async (googleData: GoogleAuthResponse) => {
    try {
      // Data is already processed by authService.loginWithGoogle()
      // which is called before this function
      setUser(googleData.user);
      setIsAuthenticated(true);

      console.log("✅ Google auth state updated:", {
        email: googleData.user.email,
        isNewUser: googleData.is_new_user,
      });
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await realAuthService.register(data);
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await realAuthService.logout();
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle, // ✨ NEW
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
