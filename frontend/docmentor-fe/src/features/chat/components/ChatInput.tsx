// src/features/chat/components/ChatInput.tsx
import React, { useState, useRef } from "react";
import Button from "@/components/common/Button";
import { useDocumentStatus } from "@/hooks/useDocumentStatus"; // ✅ Import Hook mới
import {
  FiLoader,
  FiCheckCircle,
  FiPaperclip,
  FiX,
  FiPlus,
} from "react-icons/fi"; // Import icon

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
  onOpenDocumentModal?: () => void;
  selectedDocuments?: Array<{ id: string; title: string }>; // ✅ Nhận thêm props này
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenDocumentModal,
  selectedDocuments = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ Sử dụng Hook để check trạng thái file
  const { isProcessing, docStatuses } = useDocumentStatus(selectedDocuments);

  // ✅ Logic khóa: Khóa khi đang gửi tin nhắn HOẶC đang xử lý file
  const isDisabled = isLoading || isProcessing;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsMenuOpen(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDocumentButtonClick = () => {
    onOpenDocumentModal?.();
    setIsMenuOpen(false);
  };

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || selectedFile) && !isDisabled) {
      onSendMessage(inputValue.trim(), selectedFile || undefined);
      setInputValue("");
      handleClearFile();
    }
  };

  return (
    <div className="p-4 border-t border-primary/20 bg-accent/40 backdrop-blur-sm">
      {/* ✅ PHẦN 1: HIỂN THỊ TRẠNG THÁI XỬ LÝ FILE (MỚI) */}
      {selectedDocuments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedDocuments.map((doc) => {
            const isDone = docStatuses[doc.id];
            return (
              <div
                key={doc.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
                  isDone
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse"
                }`}
              >
                {isDone ? (
                  <FiCheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                )}
                <span className="max-w-[150px] truncate">{doc.title}</span>
                <span className="font-semibold">
                  {isDone ? "Sẵn sàng" : "Đang đọc..."}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Phần hiển thị file đính kèm local (giữ nguyên) */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-2 mb-2 text-sm border rounded-lg bg-accent/80 animate-fade-in border-primary/30">
          <span className="flex items-center gap-2 truncate text-white/80">
            <FiPaperclip />
            Đang đính kèm:{" "}
            <span className="font-medium text-white">{selectedFile.name}</span>
          </span>
          <button
            onClick={handleClearFile}
            className="ml-2 text-lg font-bold text-text-muted hover:text-white"
          >
            <FiX />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept=".pdf,.docx,.txt,.pptx"
        />

        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            // ✅ Placeholder thay đổi theo trạng thái
            placeholder={
              isProcessing
                ? "Hệ thống đang xử lý tài liệu, vui lòng đợi..."
                : "Hỏi bất cứ điều gì về tài liệu của bạn..."
            }
            className={`w-full px-4 py-3 bg-accent/60 border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
              // ✅ Style khi bị disable
              isDisabled
                ? "border-primary/10 opacity-60 cursor-not-allowed bg-accent/40"
                : "border-primary/20"
            }`}
            disabled={isDisabled} // ✅ Disable input
          />

          {/* Menu Button (Plus icon) */}
          <div
            className="absolute -translate-y-1/2 right-3 top-1/2"
            ref={menuRef}
          >
            <Button
              type="button"
              onClick={() => !isProcessing && setIsMenuOpen(!isMenuOpen)}
              className={`p-1.5 text-text-muted hover:text-primary transition-colors duration-300 ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Thêm tài liệu"
              disabled={isProcessing}
            >
              <FiPlus className="w-5 h-5" />
            </Button>

            {/* Dropdown Menu (Giữ nguyên logic cũ) */}
            {isMenuOpen && (
              <div className="absolute right-0 z-50 w-56 mb-2 overflow-hidden border shadow-2xl bottom-full bg-accent/95 backdrop-blur-lg border-primary/30 rounded-xl animate-fade-in">
                <button
                  type="button"
                  onClick={handleDocumentButtonClick}
                  className="flex items-center w-full gap-3 px-4 py-3 text-white transition-colors border-b hover:bg-primary/20 border-primary/10"
                >
                  <div className="text-primary">
                    <FiPaperclip className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Tài liệu của tôi</p>
                    <p className="text-xs text-text-muted">Chọn từ thư viện</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleAttachClick}
                  className="flex items-center w-full gap-3 px-4 py-3 text-white transition-colors hover:bg-primary/20"
                >
                  <div className="text-secondary">
                    <FiPaperclip className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Tải từ máy tính</p>
                    <p className="text-xs text-text-muted">Upload file mới</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          // ✅ Khóa nút gửi chặt chẽ hơn
          disabled={isDisabled || (!inputValue.trim() && !selectedFile)}
          className={`px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all duration-300 ${
            isDisabled
              ? "opacity-50 cursor-not-allowed grayscale"
              : "hover:shadow-primary/50 hover:scale-105"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
              <span>Gửi...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Gửi</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
