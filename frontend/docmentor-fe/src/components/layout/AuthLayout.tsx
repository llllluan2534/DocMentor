import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, #8A42FF 0%, transparent 60%)",
          }}
        />
        {/* Secondary gradient */}
        <div
          className="absolute bottom-0 right-0 w-[100%] h-[100%] opacity-10"
          style={{
            background:
              "radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(138, 66, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(138, 66, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl border-primary/10">
        <div className="container px-4 py-4 mx-auto">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80 w-fit"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <img
                src="/assets/logo.png"
                alt="DocMentor"
                className="object-contain w-10 h-10"
              />
            </div>
            <span className="text-2xl font-bold text-white">DocMentor</span>
          </Link>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="relative z-10 flex items-center justify-center flex-1 px-4 py-20 overflow-y-auto">
        <div className="w-full max-w-md my-8">
          {/* Card Container */}
          <div className="p-6 space-y-5 text-gray-900 border shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:p-8 border-gray-200/50">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 sm:text-base">{subtitle}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="pt-2">{children}</div>
          </div>

          {/* Footer Text */}
          <p className="px-4 mt-6 text-xs text-center text-gray-400 sm:text-sm">
            By continuing, you agree to DocMentor's{" "}
            <Link
              to="/terms"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
