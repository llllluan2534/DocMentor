// src/features/chat/components/ChatInput.tsx
import React, { useState } from "react";
import Button from "@/components/common/Button";
import { useDocumentStatus } from "@/hooks/useDocumentStatus";
import { FiLoader, FiSend } from "react-icons/fi";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  selectedDocuments?: Array<{ id: string; title: string }>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedDocuments = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const { isProcessing } = useDocumentStatus(selectedDocuments);
  const isDisabled = isLoading || isProcessing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isDisabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    // ✅ FIX: Nền trong suốt mờ (backdrop-blur) và border nhẹ
    <div className="p-4 border-t border-white/5 bg-[#100D20]/80 backdrop-blur-md">
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mb-2 flex items-center gap-2 text-xs text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg animate-pulse w-fit border border-secondary/20">
          <FiLoader className="animate-spin" /> Hệ thống đang đọc tài liệu...
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-[#1A162D] border border-white/5 rounded-2xl p-2 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 shadow-inner"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isProcessing ? "Đang xử lý..." : "Hỏi về tài liệu đã chọn..."
          }
          className="flex-1 px-3 py-3 text-white bg-transparent outline-none placeholder:text-gray-600 disabled:opacity-50"
          disabled={isDisabled}
        />

        <Button
          type="submit"
          disabled={isDisabled || !inputValue.trim()}
          className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:bg-gray-700 transition-all shadow-lg shadow-primary/20 mb-0.5 mr-0.5"
        >
          {isLoading ? (
            <FiLoader className="w-5 h-5 animate-spin" />
          ) : (
            <FiSend className="w-5 h-5" />
          )}
        </Button>
      </form>

      <p className="text-[10px] text-gray-600 text-center mt-3">
        DocMentor có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
      </p>
    </div>
  );
};
