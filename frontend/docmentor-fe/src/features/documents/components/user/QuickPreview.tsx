// src/features/documents/components/user/QuickPreview.tsx
import React, { useState, useEffect } from "react";
import { Document } from "@/types/document.types";
import { documentService } from "@/services/document/documentService";
import { FiFile, FiLoader, FiAlertCircle } from "react-icons/fi";

interface QuickPreviewProps {
  document: Document;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const QuickPreview: React.FC<QuickPreviewProps> = ({
  document,
  isVisible,
  position,
}) => {
  const [previewText, setPreviewText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !document.id) {
      setPreviewText("");
      setError(null);
      return;
    }

    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const blob = await documentService.getDocumentContent(
          String(document.id)
        );

        const fileType = document.type.toLowerCase();

        if (fileType === "txt") {
          const text = await blob.text();
          // Lấy 3 dòng đầu tiên
          const lines = text.split("\n").slice(0, 3).join("\n");
          setPreviewText(
            lines.substring(0, 200) + (lines.length > 200 ? "..." : "")
          );
        } else if (fileType === "pdf") {
          setPreviewText("📄 PDF - Nhấn để xem chi tiết");
        } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)) {
          setPreviewText("🖼️ Hình ảnh - Nhấn để xem chi tiết");
        } else {
          setPreviewText(
            `📎 File ${fileType.toUpperCase()} - Nhấn để xem chi tiết`
          );
        }
      } catch (err) {
        console.error("❌ Preview error:", err);
        setError("Không thể tải xem trước");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce để tránh fetch quá nhiều khi hover nhanh
    const timer = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timer);
  }, [document.id, document.type, isVisible]);

  if (!isVisible) return null;

  // Calculate optimal position to avoid overflow
  const getOptimalPosition = () => {
    const TOOLTIP_WIDTH = 320; // w-80 = 320px
    const TOOLTIP_HEIGHT = 280; // Estimated height
    const VIEWPORT_PADDING = 16;
    const ARROW_SIZE = 10;

    let top = position.y - TOOLTIP_HEIGHT - ARROW_SIZE;
    let left = position.x - TOOLTIP_WIDTH / 2;

    // Adjust if too high
    if (top < VIEWPORT_PADDING) {
      top = position.y + ARROW_SIZE;
    }

    // Adjust if too far left
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    // Adjust if too far right
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING;
    if (left > maxLeft) {
      left = maxLeft;
    }

    return { top, left };
  };

  const { top, left } = getOptimalPosition();

  return (
    <div
      className="fixed z-50 w-80 max-h-80 p-4 border shadow-2xl bg-accent/95 backdrop-blur-md rounded-xl border-primary/30 animate-fade-in pointer-events-auto overflow-hidden flex flex-col"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
          <FiFile className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {document.title}
          </h4>
          <p className="text-xs text-text-muted uppercase truncate">
            {document.type} • {(document.fileSize / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="text-sm text-text-muted flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 h-16">
            <FiLoader className="w-4 h-4 animate-spin text-primary" />
            <span>Đang tải xem trước...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 py-2 text-red-400">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-300 break-words">
            {previewText || document.summary || "Không có nội dung xem trước"}
          </pre>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-text-muted text-center flex-shrink-0">
        Nhấn vào tài liệu để xem đầy đủ
      </div>
    </div>
  );
};
