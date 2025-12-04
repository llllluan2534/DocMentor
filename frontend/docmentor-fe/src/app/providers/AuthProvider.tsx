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
  logout: () => Promise<void>; // Làm logout async để phù hợp với real service
  // 👈 ĐÃ THÊM: Định nghĩa hàm register
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
        // ✅ FIX: Check token tồn tại trước
        const token = realAuthService.getToken();
        if (!token) {
          console.log("🔍 No token found");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // ✅ FIX: Lấy user từ storage trước (không cần call API)
        const currentUser = await realAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true); // ✅ Tin tưởng token trong storage

          // ✅ Optional: Verify token với backend (background)
          // Nếu fail thì logout, nhưng không block UI
          realAuthService.isAuthenticated().catch(() => {
            console.log("⚠️ Token invalid, logging out");
            logout();
          });
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await realAuthService.register(data);
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await realAuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
