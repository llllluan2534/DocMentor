import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import AppSidebar from "./AppSidebar";

const UserLayout: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname.includes("/user/chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      {/* Header cố định */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-xl border-primary/10">
        <Header hideAuthButtons={true} />
      </div>

      {/* Layout chính */}
      <div
        className={`relative z-10 pt-16 ${isChatPage ? "h-screen overflow-hidden" : "min-h-screen"}`}
      >
        {isChatPage ? (
          // ChatPage sẽ tự lo layout sidebar của nó
          <main className="flex flex-col w-full h-full">
            <Outlet />
          </main>
        ) : (
          // Các trang Dashboard/Docs dùng Sidebar mặc định
          <div className="w-full min-h-[calc(100vh-4rem)]">
            <AppSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
            {/* ✅ Thêm lg:ml-72 để chừa chỗ cho Sidebar mới (width w-72) */}
            <main
              className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}
            >
              <div className="h-full animate-fade-in">
                <Outlet />
              </div>
            </main>
          </div>
        )}
      </div>

      {/* Decorative grid pattern overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(138, 66, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138, 66, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
};

export default UserLayout;
