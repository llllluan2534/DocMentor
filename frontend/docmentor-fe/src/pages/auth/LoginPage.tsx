// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import LoginForm from "../../features/auth/components/LoginForm";
import { useAuth } from "../../app/providers/AuthProvider";

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
  const handleGoogleSuccess = async (googleData: any) => {
    try {
      setIsLoading(true);
      setError("");

      await loginWithGoogle(googleData);

      // Show welcome message for new users
      if (googleData.is_new_user) {
        console.log("🎉 Welcome new user!");
        // You can show a toast notification here
      }

      navigate("/user");
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Đăng nhập vào tài khoản của bạn để tiếp tục"
    >
      <LoginForm
        onSubmit={handleLogin}
        onGoogleSuccess={handleGoogleSuccess} // ✨ NEW
        isLoading={isLoading}
        error={error}
      />
    </AuthLayout>
  );
};

export default LoginPage;
