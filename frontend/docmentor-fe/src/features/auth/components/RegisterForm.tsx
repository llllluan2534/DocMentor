// frontend/docmentor-fe/src/features/auth/components/RegisterForm.tsx
import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";

interface RegisterFormProps {
  onSubmit: (data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
  }) => void;
  onGoogleSuccess: (data: any) => void; // ✨ NEW
  isLoading?: boolean;
  error?: string;
}

// ✨ NEW: Google OAuth Button Component (same as LoginForm)
const GoogleOAuthButton: React.FC<{
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}> = ({ onSuccess, onError, isLoading }) => {
  useEffect(() => {
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
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const result = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.detail || "Google authentication failed");
      }

      onSuccess(data);
    } catch (error: any) {
      onError(error.message);
    }
  };

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
        Đăng ký với Google
      </span>
    </button>
  );
};

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onGoogleSuccess, // ✨ NEW
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [googleError, setGoogleError] = useState(""); // ✨ NEW

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name) return "Tên đầy đủ là bắt buộc";
    if (name.trim().length < 2) return "Tên phải có ít nhất 2 ký tự";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email) return "Email là bắt buộc";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Mật khẩu là bắt buộc";
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    if (!/[A-Z]/.test(password)) return "Phải có ít nhất 1 chữ hoa";
    if (!/[a-z]/.test(password)) return "Phải có ít nhất 1 chữ thường";
    if (!/[0-9]/.test(password)) return "Phải có ít nhất 1 số";
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string): string => {
    if (!confirmPassword) return "Vui lòng xác nhận mật khẩu";
    if (confirmPassword !== formData.password) return "Mật khẩu không khớp";
    return "";
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const newErrors = { ...errors };
    let errorMsg = "";

    switch (field) {
      case "fullName":
        errorMsg = validateFullName(formData.fullName);
        break;
      case "email":
        errorMsg = validateEmail(formData.email);
        break;
      case "password":
        errorMsg = validatePassword(formData.password);
        break;
      case "confirmPassword":
        errorMsg = validateConfirmPassword(formData.confirmPassword);
        break;
    }

    if (errorMsg) newErrors[field] = errorMsg;
    else delete newErrors[field];
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

    const newErrors: Record<string, string> = {};
    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "Bạn phải đồng ý với điều khoản";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        fullName: true,
        email: true,
        username: true,
        password: true,
        confirmPassword: true,
        agreeToTerms: true,
      });
      return;
    }

    onSubmit(formData);
  };

  // ✨ NEW: Handle Google error
  const handleGoogleError = (errorMsg: string) => {
    setGoogleError(errorMsg);
    setTimeout(() => setGoogleError(""), 5000);
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition text-sm ${
      touched[field] && errors[field]
        ? "border-red-300 focus:ring-red-200"
        : "border-gray-300 focus:ring-primary/30 focus:border-primary"
    }`;

  return (
    <div className="space-y-3">
      {/* ✨ NEW: Google Register Button */}
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
            Hoặc đăng ký với email
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

      {/* Full Name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Họ và tên
        </label>
        <div className="relative">
          <User className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            className={inputClass("fullName")}
            placeholder="Nguyễn Văn A"
            disabled={isLoading}
          />
        </div>
        {touched.fullName && errors.fullName && (
          <p className="text-xs text-red-600">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="relative">
          <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={inputClass("email")}
            placeholder="email@example.com"
            disabled={isLoading}
          />
        </div>
        {touched.email && errors.email && (
          <p className="text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            className={`${inputClass("password")} pr-10`}
            placeholder="Tạo mật khẩu mạnh"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
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

      {/* Confirm Password */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            className={`${inputClass("confirmPassword")} pr-10`}
            placeholder="Nhập lại mật khẩu"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {touched.confirmPassword && errors.confirmPassword && (
          <p className="text-xs text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-1">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
            className="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
            disabled={isLoading}
          />
          <span className="text-xs text-gray-700">
            Tôi đồng ý với{" "}
            <a
              href="/terms"
              className="underline text-primary hover:text-primary/80"
            >
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a
              href="/privacy"
              className="underline text-primary hover:text-primary/80"
            >
              Chính sách bảo mật
            </a>
          </span>
        </label>
        {touched.agreeToTerms && errors.agreeToTerms && (
          <p className="text-xs text-red-600">{errors.agreeToTerms}</p>
        )}
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
            <span>Đang tạo tài khoản...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            <span>Tạo tài khoản</span>
          </>
        )}
      </button>

      {/* Login Link */}
      <p className="pt-2 text-sm text-center text-gray-600">
        Đã có tài khoản?{" "}
        <a
          href="/login"
          className="font-medium transition-colors text-primary hover:text-primary/80"
        >
          Đăng nhập ngay
        </a>
      </p>
    </div>
  );
};

export default RegisterForm;
