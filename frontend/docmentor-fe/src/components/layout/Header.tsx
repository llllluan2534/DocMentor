import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { realAuthService, User } from "@/services/auth/authService";

interface HeaderProps {
  hideAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ hideAuthButtons }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Lấy thông tin user khi load header
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await realAuthService.getCurrentUser();
      setUser(currentUser);
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

  const settingsItems = [{ label: "Cài đặt", path: "/user/settings" }];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-sm shadow-lg py-3 border-b border-accent"
          : "bg-background py-5"
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-10 h-10 transition-transform rounded-lg bg-primary group-hover:scale-110">
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="object-contain w-10 h-10"
              />
            </div>
            <span className="text-2xl font-bold text-white">DocMentor</span>
          </div>

          {/* ✅ Desktop section */}
          <div className="items-center hidden gap-6 md:flex">
            {user ? (
              <>
                {/* Menu khi login */}
                <nav className="flex items-center gap-6">
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`text-sm font-medium transition-colors ${
                        location.pathname.startsWith(item.path)
                          ? "text-primary border-b-2 border-primary pb-1"
                          : "text-text-muted hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Avatar dropdown */}
                <div className="relative group">
                  <div className="overflow-hidden rounded-full cursor-pointer w-9 h-9 bg-gradient-to-br from-primary to-purple-600">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 hidden mt-3 border rounded-lg shadow-lg group-hover:block w-44 bg-background border-accent">
                    {settingsItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="w-full px-4 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-white"
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-left text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : !hideAuthButtons ? (
              // Nếu chưa đăng nhập
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 font-semibold transition-colors rounded-lg text-text-muted hover:text-white"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all shadow-[0_0_15px_rgba(138,66,255,0.5)] hover:shadow-[0_0_25px_rgba(138,66,255,0.7)]"
                >
                  Đăng ký
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white rounded-lg md:hidden"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ✅ Mobile menu */}
        {isMobileMenuOpen && (
          <div className="pb-4 mt-4 rounded-lg shadow-lg md:hidden bg-accent">
            <nav className="flex flex-col">
              {user ? (
                <>
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="px-4 py-3 font-medium text-left transition-colors text-text-muted hover:bg-background/50 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="pt-2 mt-2 border-t border-background">
                    <button
                      onClick={() => navigate("/user/settings")}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-background/50"
                    >
                      Cài đặt
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-left text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                !hideAuthButtons && (
                  <div className="px-4 pt-2 mt-2 space-y-2 border-t border-background">
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full px-4 py-2 font-semibold text-center transition-colors rounded-lg text-text-muted hover:bg-background/50"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      className="w-full px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-primary hover:bg-opacity-90"
                    >
                      Đăng ký
                    </button>
                  </div>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
