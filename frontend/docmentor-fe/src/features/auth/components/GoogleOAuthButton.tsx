// frontend/docmentor-fe/src/features/auth/components/GoogleOAuthButton.tsx
import React, { useEffect, useRef } from "react";

interface GoogleOAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError: (message: string) => void;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ==========================================
    // 👇 ĐOẠN CODE DEBUG (MÁY DÒ LỖI) 👇
    // ==========================================
    console.log("🔴 DEBUG ENV - Toàn bộ biến:", import.meta.env);
    console.log("🔴 DEBUG ENV - Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    
    // Kiểm tra xem biến có bị undefined hay chuỗi rỗng không
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId.trim() === "") {
      console.error("❌ LỖI: Không tìm thấy VITE_GOOGLE_CLIENT_ID. Hãy kiểm tra lại file .env");
      onError("Google Client ID chưa được cấu hình trong .env");
      return;
    }
    // ==========================================

    // 2. Hàm load script Google Identity Services
    const loadGoogleScript = () => {
      const scriptId = "google-client-script";
      // Tránh load script nhiều lần
      if (document.getElementById(scriptId)) {
        initializeGoogle(clientId); // Truyền clientId vào hàm init
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogle(clientId);
      script.onerror = () => onError("Không thể tải Google Sign-In script");
      document.body.appendChild(script);
    };

    // 3. Khởi tạo và Render nút
    const initializeGoogle = (validClientId: string) => {
      if (!window.google) return;

      try {
        window.google.accounts.id.initialize({
          client_id: validClientId,
          callback: (response: any) => {
            if (response.credential) {
              // Trả về credential string cho parent component xử lý
              onSuccess(response.credential);
            } else {
              onError("Đăng nhập thất bại, không nhận được token.");
            }
          },
          // auto_select: false -> Tắt tự động login để user luôn thấy nút bấm
          auto_select: false,
        });

        // VẼ NÚT VÀO THẺ DIV (Quan trọng)
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(
            buttonRef.current,
            {
              theme: "outline", // Hoặc 'filled_blue', 'filled_black'
              size: "large", // Kích thước lớn
              type: "standard", // Kiểu nút tiêu chuẩn
              shape: "rectangular", // Hình chữ nhật (hoặc 'pill' cho bo tròn)
              text: "continue_with", // "Tiếp tục với Google"
              logo_alignment: "left",
              width: "400", // Cố gắng full width container (Google giới hạn max width)
            } as any // cast any để tránh lỗi type width string nếu dùng TS cũ
          );
        }
      } catch (error: any) {
        onError(error.message || "Lỗi khởi tạo Google Sign-In");
      }
    };

    loadGoogleScript();

    // Cleanup (Optional)
    return () => {
      // Chúng ta không remove script để tránh phải load lại khi user chuyển trang qua lại
    };
  }, [onSuccess, onError]);

  // Container để Google inject iframe nút bấm vào
  return (
    <div
      ref={buttonRef}
      className="w-full flex justify-center min-h-[40px]"
      style={{ width: "100%" }} // Force container width
    />
  );
};

export default GoogleOAuthButton;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          // Thêm định nghĩa cho renderButton
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with";
              logo_alignment?: "left" | "center";
              width?: string;
            }
          ) => void;
        };
      };
    };
  }
}