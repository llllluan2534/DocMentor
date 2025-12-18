// src/features/chat/components/HeroChat.tsx
import React, { useState } from "react";
import { FiSend, FiLoader } from "react-icons/fi";

interface HeroChatProps {
  onStartChat: (message: string) => Promise<void>;
}

const HeroChat: React.FC<HeroChatProps> = ({ onStartChat }) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    setIsLoading(true);
    await onStartChat(inputValue);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="mb-8 animate-fade-in">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
          Doc
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Mentor
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-lg text-gray-400">
          Trợ lý AI học tập thông minh. Chọn tài liệu bên phải và bắt đầu hỏi.
        </p>
      </div>

      <div className="w-full max-w-2xl animate-scale-up">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Bạn muốn tìm hiểu gì hôm nay?"
            className="w-full bg-[#1A162D] border border-white/10 rounded-2xl px-6 py-5 text-lg text-white shadow-2xl shadow-black/50 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute p-3 text-white transition-all -translate-y-1/2 right-3 top-1/2 bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-0 disabled:scale-75"
          >
            {isLoading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroChat;
