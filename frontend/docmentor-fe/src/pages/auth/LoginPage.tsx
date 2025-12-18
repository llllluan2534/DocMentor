import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import GoogleOAuthButton from "../../features/auth/components/GoogleOAuthButton";
import { useAuth } from "../../app/providers/AuthProvider";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const [error, setError] = useState<string>("");

  // Tự động chuyển trang nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/user/chat", { replace: true }); // Chuyển về Dashboard hoặc trang chủ
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Bắt đầu quản lý tài liệu học tập thông minh"
    >
      <div className="w-full space-y-6">
        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Nút Google to bự - Option chính */}
        <div className="py-2">
          <GoogleOAuthButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Divider tinh tế */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-gray-500 bg-white">
              Tài khoản Sinh viên / Giảng viên
            </span>
          </div>
        </div>

        {/* Note nhỏ thay vì form đăng ký */}
        <p className="px-4 text-xs text-center text-gray-500">
          Bằng việc tiếp tục, hệ thống sẽ tự động tạo tài khoản mới nếu bạn chưa
          đăng ký. Hồ sơ sẽ được đồng bộ từ Google.
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
