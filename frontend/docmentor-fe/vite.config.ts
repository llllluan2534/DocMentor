import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  // ❌ XÓA HOẶC COMMENT ĐOẠN NÀY ĐI
  // define: {
  //   'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify("..."),
  //   'import.meta.env.VITE_API_BASE_URL': JSON.stringify("http://127.0.0.1:8000"),
  // }
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