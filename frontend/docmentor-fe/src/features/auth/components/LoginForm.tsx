// frontend/docmentor-fe/src/features/auth/components/LoginForm.tsx
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";

interface LoginFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void;
  onGoogleSuccess: (data: any) => void; // ✨ NEW
  isLoading?: boolean;
  error?: string;
}

// ✨ NEW: Google OAuth Button Component
const GoogleOAuthButton: React.FC<{
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}> = ({ onSuccess, onError, isLoading }) => {
  const handleCredentialResponse = React.useCallback(
    (response: any) => {
      try {
        // Kiểm tra xem Google có trả về credential không
        if (response.credential) {
          // Truyền nguyên cục response của Google ra ngoài cho LoginPage xử lý
          onSuccess(response);
        } else {
          onError("Không nhận được phản hồi từ Google");
        }
      } catch (error: any) {
        onError(error.message);
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    console.log("🔑 Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log("🌍 Origin:", window.location.origin);

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        console.log("✅ Google Sign-In initialized");
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleCredentialResponse]);

  const handleGoogleLogin = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      onError("Google Sign-In not loaded");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="flex items-center justify-center w-full gap-2 px-4 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="text-sm font-medium text-gray-700">
        Tiếp tục với Google
      </span>
    </button>
  );
};

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSuccess, // ✨ NEW
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [googleError, setGoogleError] = useState(""); // ✨ NEW

  const validateEmail = (email: string): string => {
    if (!email) return "Email là bắt buộc";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Mật khẩu là bắt buộc";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return "";
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const newErrors = { ...errors };

    if (field === "email") {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
      else delete newErrors.email;
    }
    if (field === "password") {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      else delete newErrors.password;
    }

    setErrors(newErrors);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError }),
      });
      setTouched({ email: true, password: true });
      return;
    }

    onSubmit(formData);
  };

  // ✨ NEW: Handle Google error
  const handleGoogleError = (errorMsg: string) => {
    setGoogleError(errorMsg);
    setTimeout(() => setGoogleError(""), 5000);
  };

  return (
    <div className="space-y-4">
      {/* ✨ NEW: Google Login Button - Primary Option */}
      <GoogleOAuthButton
        onSuccess={onGoogleSuccess}
        onError={handleGoogleError}
        isLoading={isLoading}
      />

      {/* ✨ NEW: Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 text-gray-500 bg-white rounded-full">
            Hoặc đăng nhập với email
          </span>
        </div>
      </div>

      {/* Server Error */}
      {(error || googleError) && (
        <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 animate-fade-in">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || googleError}
          </p>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
              touched.email && errors.email
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-primary/30 focus:border-primary"
            }`}
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>
        {touched.email && errors.email && (
          <p className="text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
              touched.password && errors.password
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-primary/30 focus:border-primary"
            }`}
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute text-gray-500 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {touched.password && errors.password && (
          <p className="text-xs text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange("rememberMe", e.target.checked)}
            className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary focus:ring-2"
            disabled={isLoading}
          />
          <span className="text-gray-700 transition-colors group-hover:text-gray-900">
            Ghi nhớ đăng nhập
          </span>
        </label>
        <a
          href="/forgot-password"
          className="font-medium transition-colors text-primary hover:text-primary/80"
        >
          Quên mật khẩu?
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-2.5 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            <span>Đang đăng nhập...</span>
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            <span>Đăng nhập</span>
          </>
        )}
      </button>

      {/* Sign Up Link */}
      <p className="pt-2 text-sm text-center text-gray-600">
        Chưa có tài khoản?{" "}
        <a
          href="/register"
          className="font-medium transition-colors text-primary hover:text-primary/80"
        >
          Đăng ký ngay
        </a>
      </p>
    </div>
  );
};

export default LoginForm;

// ✨ NEW: Type definitions for Google Sign-In
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
