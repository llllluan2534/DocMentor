// frontend/docmentor-fe/src/services/auth/authService.ts

import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  role: "user" | "admin";
  avatar?: string;
  authProvider?: "email" | "google"; // ✨ NEW
}

interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

// ✨ NEW: Google Auth Response
interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  is_new_user: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

const api = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class RealAuthService {
  private delay(ms: number = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ✨ NEW: Google OAuth Login
  async loginWithGoogle(credential: string): Promise<GoogleAuthResponse> {
    console.log("🔑 Google OAuth login attempt");

    try {
      await this.delay(500);
      const response = await api.post("/auth/google", { credential });

      if (!response.data.access_token) {
        throw new Error("Google authentication failed");
      }

      const { access_token, user, is_new_user } = response.data;

      // ✅ QUAN TRỌNG: Lưu token với key đúng
      localStorage.setItem("auth_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ THÊM: Clear sessionStorage để tránh conflict
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user");

      console.log("✅ Google login successful:", {
        user: user.email,
        isNewUser: is_new_user,
        tokenPrefix: access_token.substring(0, 20) + "...", // Log token prefix for debugging
      });

      // ✅ THÊM: Verify token được lưu
      console.log("🔍 Token stored:", {
        localStorage: !!localStorage.getItem("auth_token"),
        sessionStorage: !!sessionStorage.getItem("auth_token"),
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      throw new Error(
        error.response?.data?.detail || "Google authentication failed"
      );
    }
  }

  // Traditional email/password login
  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<LoginResponse> {
    console.log("🔑 Email/password login attempt:", { email, rememberMe });

    try {
      await this.delay(500);
      const response = await api.post("/auth/login", { email, password });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Email hoặc mật khẩu không đúng"
        );
      }

      const { user, token, message } = response.data;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("auth_token", token);
      storage.setItem("user", JSON.stringify(user));

      console.log("✅ Email login successful:", {
        user: user.email,
        role: user.role,
      });

      return { success: true, user, token, message };
    } catch (error: any) {
      console.error("❌ Email login error:", error);
      throw new Error(error.response?.data?.message || "Lỗi đăng nhập");
    }
  }

  async register(data: RegisterData): Promise<void> {
    console.log("📝 Registration attempt:", data.email);
    try {
      await this.delay(500);
      await api.post("/auth/register", data);
      console.log("✅ Registration successful");
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg ||
          error.response?.data?.detail ||
          "Đăng ký thất bại"
      );
    }
  }

  async logout(): Promise<void> {
    console.log("🚪 Logging out...");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    console.log("✅ Logout complete");
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    const user = await this.getCurrentUser();

    const isAuth = !!(token && user);
    console.log("🔍 Auth check:", {
      hasToken: !!token,
      hasUser: !!user,
      isAuthenticated: isAuth,
    });

    return isAuth;
  }

  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      await api.get("/auth/me");
      console.log("✅ Token verified");
      return true;
    } catch (error: any) {
      console.error("❌ Token verification failed:", error.message);

      if (error.response?.status === 401) {
        console.log("🔒 Token invalid, logging out");
        await this.logout();
        return false;
      }

      console.log("⚠️ Network error, keeping session");
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) {
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      console.log("👤 Current user:", user.email);
      return user;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      return null;
    }
  }

  getToken(): string | null {
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  }
}

export const realAuthService = new RealAuthService();
export type { User, LoginResponse, RegisterData, GoogleAuthResponse };
