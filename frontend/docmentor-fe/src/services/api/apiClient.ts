// src/services/api/apiClient.ts

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Cấu hình URL cơ sở
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Tạo instance chung
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 giây timeout cho các request xử lý file nặng
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 1. REQUEST INTERCEPTOR (Gửi Token đi) ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ Storage
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");

    // Nếu có token, đính kèm vào Header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log nhẹ để debug (có thể tắt khi production)
    // console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR (Xử lý lỗi 401 & Logout) ---
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Nếu lỗi là 401 (Unauthorized) và không phải đang ở trang login
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      console.warn(
        "🔒 Hết phiên đăng nhập hoặc Token không hợp lệ. Đang đăng xuất..."
      );

      // 1. Xóa sạch dữ liệu trong Storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedDocIds"); // Xóa cả state tạm nếu có
      sessionStorage.clear();

      // 2. Chuyển hướng về trang Login (Force Reload để reset state React)
      window.location.href = "/login?expired=true";

      return Promise.reject(error);
    }

    // Nếu lỗi khác, trả về để component tự xử lý (ví dụ hiện thông báo đỏ)
    return Promise.reject(error);
  }
);

export default apiClient;
