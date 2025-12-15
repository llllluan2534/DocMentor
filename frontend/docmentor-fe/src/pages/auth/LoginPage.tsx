// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import LoginForm from "../../features/auth/components/LoginForm";
import { useAuth } from "../../app/providers/AuthProvider";
import { realAuthService } from "@/services/auth/authService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth(); // ✨ NEW: loginWithGoogle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Traditional email/password login
  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError("");

      await login(data.email, data.password, data.rememberMe);
      navigate("/user");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ NEW: Google OAuth login handler
  const handleGoogleSuccess = async (googleResponse: any) => {
    try {
      setError("");
      // Không set isLoading ở đây nữa vì AuthProvider đã xử lý rồi,
      // nhưng nếu muốn loading UI thì cứ giữ

      console.log("🔹 Google Credential:", googleResponse.credential);

      // 👇 GỌI AUTH PROVIDER: Chỉ truyền credential string
      await loginWithGoogle(googleResponse.credential);

      // Nếu không lỗi thì chuyển trang
      navigate("/user");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đăng nhập Google thất bại");
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Đăng nhập vào tài khoản của bạn để tiếp tục"
    >
      <LoginForm
        onSubmit={handleLogin}
        onGoogleSuccess={handleGoogleSuccess}
        isLoading={isLoading}
        error={error}
      />
    </AuthLayout>
  );
};

export default LoginPage;
