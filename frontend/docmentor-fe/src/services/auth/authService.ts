import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatar?: string;
}

interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

// 👈 ĐÃ THÊM: Định nghĩa interface cho dữ liệu đăng ký
interface RegisterData {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000",
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
  // Simulate delay nếu cần (optional, backend thực không cần)
  private delay(ms: number = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  } // Real login: Gọi POST /api/auth/login

  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<LoginResponse> {
    console.log("🔑 Real login attempt:", { email, rememberMe });

    try {
      await this.delay(500); // Optional delay

      const response = await api.post("/auth/login", { email, password });

      if (!response.data.success) {
        console.log(
          "❌ Login failed:",
          response.data.message || "Invalid credentials"
        );
        throw new Error(
          response.data.message || "Email hoặc mật khẩu không đúng"
        );
      }

      const { user, token, message } = response.data; // Store in localStorage or sessionStorage

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("auth_token", token);
      storage.setItem("user", JSON.stringify(user));

      console.log("✅ Real login successful:", {
        user: user.email,
        role: user.role,
        storage: rememberMe ? "localStorage" : "sessionStorage",
      });

      return { success: true, user, token, message };
    } catch (error: any) {
      console.error("❌ Real login error:", error); // Lỗi 401: Unauthorized (mật khẩu sai) sẽ được bắt ở đây
      throw new Error(error.response?.data?.message || "Lỗi đăng nhập");
    }
  } // 👈 ĐÃ THÊM: Hàm đăng ký thực tế
  async register(data: RegisterData): Promise<void> {
    console.log("📝 Real registration attempt:", data.email);
    try {
      await this.delay(500); // Optional delay
      // Backend API: POST /auth/register trả về Token, nhưng ở đây ta chỉ cần nó thành công
      await api.post("/auth/register", data);
      console.log("✅ Real registration successful");
    } catch (error: any) {
      console.error("❌ Real registration error:", error); // Lỗi 409 Conflict (Email đã tồn tại) hoặc 422 (Validation) sẽ bị bắt ở đây
      throw new Error(
        error.response?.data?.detail?.[0]?.msg ||
          error.response?.data?.detail ||
          "Đăng ký thất bại"
      );
    }
  } // Real logout: Gọi POST /api/auth/logout (optional), rồi clear storage

  async logout(): Promise<void> {
    console.log("🚪 Real logging out...");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");

    console.log("✅ Real logout complete");
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      console.log("🔍 No token, not authenticated");
      return false;
    }

    try {
      await api.get("/auth/me"); // Verify token với backend
      console.log("🔍 Token valid, authenticated");
      return true;
    } catch (error) {
      console.log("🔍 Token invalid, clearing storage");
      this.logout(); // Clear nếu token hết hạn
      return false;
    }
  } // Get current user: Lấy từ storage hoặc gọi /api/auth/me nếu cần fresh

  async getCurrentUser(): Promise<User | null> {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) {
      console.log("👤 No user found in storage");
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      console.log("👤 Current user from storage:", user.email);
      return user;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      return null;
    }
  } // Get token

  getToken(): string | null {
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  }
}

export const realAuthService = new RealAuthService();
export type { User, LoginResponse, RegisterData };
