// frontend/docmentor-fe/src/features/auth/components/LoginForm.tsx
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import GoogleOAuthButton from "./GoogleOAuthButton"; // Import component mới

interface LoginFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void;
  // Sửa type data thành object chứa credential cho khớp với logic mới
  onGoogleSuccess: (data: { credential: string }) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSuccess,
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
  const [googleError, setGoogleError] = useState("");

  // --- Validate Functions (Giữ nguyên như cũ) ---
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
  // ---------------------------------------------

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    // Logic validate giữ nguyên...
    const newErrors = { ...errors };
    if (field === "email") {
      const err = validateEmail(formData.email);
      err ? (newErrors.email = err) : delete newErrors.email;
    }
    if (field === "password") {
      const err = validatePassword(formData.password);
      err ? (newErrors.password = err) : delete newErrors.password;
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

  // Callback khi Google login thành công
  const handleGoogleSuccessInternal = (credential: string) => {
    // Gọi hàm từ props cha, truyền đúng format backend cần
    onGoogleSuccess({ credential });
  };

  const handleGoogleErrorInternal = (msg: string) => {
    setGoogleError(msg);
    setTimeout(() => setGoogleError(""), 5000);
  };

  return (
    <div className="space-y-4">
      {/* --- PHẦN LOGIN GOOGLE MỚI --- */}
      <div className="w-full">
        <GoogleOAuthButton
          onSuccess={handleGoogleSuccessInternal}
          onError={handleGoogleErrorInternal}
        />
      </div>

      {/* Divider */}
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

      {/* Hiển thị lỗi chung hoặc lỗi Google */}
      {(error || googleError) && (
        <div className="p-3 border border-red-200 rounded-lg bg-red-50 animate-fade-in">
          <p className="text-sm text-red-600">{error || googleError}</p>
        </div>
      )}

      {/* --- FORM EMAIL/PASS GIỮ NGUYÊN --- */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="relative">
          <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition ${
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

      <div className="space-y-1.5">
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
            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition ${
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

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange("rememberMe", e.target.checked)}
            className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
            disabled={isLoading}
          />
          <span className="text-gray-700 group-hover:text-gray-900">
            Ghi nhớ đăng nhập
          </span>
        </label>
        <a
          href="/forgot-password"
          className="font-medium text-primary hover:text-primary/80"
        >
          Quên mật khẩu?
        </a>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-2.5 rounded-lg font-medium hover:opacity-90 shadow-lg shadow-primary/30 disabled:opacity-50"
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

      <p className="pt-2 text-sm text-center text-gray-600">
        Chưa có tài khoản?{" "}
        <a
          href="/register"
          className="font-medium text-primary hover:text-primary/80"
        >
          Đăng ký ngay
        </a>
      </p>
    </div>
  );
};

export default LoginForm;