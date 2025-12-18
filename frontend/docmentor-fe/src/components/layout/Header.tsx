// src/components/layout/Header.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { realAuthService, User } from "@/services/auth/authService";
import { FiLogOut, FiSettings, FiMenu, FiX } from "react-icons/fi";

interface HeaderProps {
  hideAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ hideAuthButtons }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [location]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await realAuthService.getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    realAuthService.logout();
    setUser(null);
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Chat AI", path: "/user/chat" },
    { label: "Tài liệu của tôi", path: "/user/documents" },
  ];

  return (
    // ✅ FIX 1: h-16 cố định chiều cao
    // ✅ FIX 2: bg-[#100D20] đặc (không trong suốt) để che nội dung khi scroll
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b border-white/5 bg-[#100D20] ${
        isScrolled ? "shadow-lg shadow-black/20" : ""
      }`}
    >
      {/* ✅ FIX 3: Dùng w-full px-4 (hoặc px-6) thay vì container mx-auto để thẳng hàng với Sidebar */}
      <div className="w-full h-full px-4 lg:px-6">
        <div className="flex items-center justify-between h-full">
          {/* LEFT: Logo & Brand */}
          <div
            className="flex items-center w-64 gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="flex items-center justify-center w-8 h-8 transition-transform rounded-lg shadow-lg bg-gradient-to-br from-primary to-secondary group-hover:scale-105 shadow-primary/20">
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="object-contain w-5 h-5 filter brightness-0 invert"
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              DocMentor
            </span>
          </div>

          {/* CENTER: Navigation */}
          <div className="items-center justify-center flex-1 hidden md:flex">
            {user && (
              <nav className="flex items-center gap-1 p-1 border bg-white/5 rounded-xl border-white/5">
                {menuItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-md"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* RIGHT: User Profile (Aligned with Right Sidebar) */}
          <div className="flex items-center justify-end w-auto gap-4 lg:w-80">
            {" "}
            {/* Cố định width nếu cần */}
            {user ? (
              <div className="relative flex items-center gap-3 pl-6 group">
                <div className="hidden text-right lg:block">
                  <p className="text-sm font-bold leading-none text-white">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">{user.email}</p>
                </div>
                <div className="w-9 h-9 rounded-full p-[1px] bg-gradient-to-tr from-primary to-secondary cursor-pointer">
                  <div className="w-full h-full rounded-full bg-[#100D20] flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="User"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {(user.full_name || "U").charAt(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A162D] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-1">
                    <button
                      onClick={() => navigate("/user/settings")}
                      className="w-full px-4 py-2.5 text-xs text-left text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                    >
                      <FiSettings /> Cài đặt
                    </button>
                    <div className="h-px my-1 bg-white/5"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-xs text-left text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                    >
                      <FiLogOut /> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : !hideAuthButtons ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 text-sm font-bold text-white transition-all shadow-lg bg-primary rounded-xl hover:bg-primary/90 shadow-primary/20"
                >
                  Đăng ký
                </button>
              </div>
            ) : null}
            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 md:hidden"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Logic cũ giữ nguyên */}
    </header>
  );
};

export default Header;
