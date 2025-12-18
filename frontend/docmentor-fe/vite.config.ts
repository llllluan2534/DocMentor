import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  // 👇 THÊM ĐOẠN NÀY: Ép cứng biến môi trường vào đây
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify("779060565190-geo68kefsmfojn2868rco7cta47o7ngq.apps.googleusercontent.com"),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify("http://127.0.0.1:8000"),
  },
  // 👆 HẾT ĐOẠN THÊM

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },
});