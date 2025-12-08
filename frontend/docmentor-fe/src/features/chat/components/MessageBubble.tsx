import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/chat.types";
import {
  FiCopy,
  FiShare2,
  FiThumbsUp,
  FiThumbsDown,
  FiFileText,
  FiFile,
  FiBookOpen,
  FiArrowUpRight,
  FiEdit3, // Icon sửa
  FiCheck, // Icon lưu
  FiX, // Icon hủy
} from "react-icons/fi";

interface MessageBubbleProps {
  message: ChatMessage;
  // ✅ Callback để xử lý lưu tin nhắn sau khi sửa (Optional)
  onEditMessage?: (messageId: string, newText: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (fileName: string, isUserBubble: boolean) => {
  const colorClass = isUserBubble ? "text-white/90" : "text-blue-500";
  const name = fileName || "";

  if (name.toLowerCase().endsWith("pdf"))
    return (
      <FiFileText
        className={`w-6 h-6 ${isUserBubble ? "text-white" : "text-red-500"}`}
      />
    );
  if (name.match(/\.(doc|docx)$/i))
    return (
      <FiFileText
        className={`w-6 h-6 ${isUserBubble ? "text-white" : "text-blue-500"}`}
      />
    );

  return <FiFile className={`w-6 h-6 ${colorClass}`} />;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onEditMessage,
}) => {
  const isUser = message.sender === "user";
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- STATES CHO CHỨC NĂNG EDIT ---
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset text khi message gốc thay đổi
  useEffect(() => {
    setEditedText(message.text);
  }, [message.text]);

  // Auto focus vào textarea khi bấm sửa
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Đặt con trỏ về cuối dòng
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // --- LOGIC TEXT & NGUỒN (AI) ---
  const { displayText, activeSources } = useMemo(() => {
    if (isUser) return { displayText: message.text, activeSources: [] };

    let sources = message.sources ? [...message.sources] : [];
    let text = message.text || "";
    const regex = /\[(?:Nguồn|Source):\s*(.*?)\]/gi;
    let match;

    if (sources.length === 0) {
      const textToScan = text;
      while ((match = regex.exec(textToScan)) !== null) {
        if (match[1]) {
          sources.push({
            documentId: `gen-${Math.random().toString(36).substr(2, 9)}`,
            documentTitle: match[1].trim(),
            pageNumber: null,
          });
        }
      }
    }

    const cleanedText = text
      .replace(/\[(?:Nguồn|Source):\s*[\s\S]*?\]/gi, "")
      .trim();
    return { displayText: cleanedText, activeSources: sources };
  }, [message.text, message.sources, isUser]);

  // --- ACTIONS ---
  const handleCopy = () => {
    // Copy text đang hiển thị hoặc text gốc
    const textToCopy = isUser ? message.text : displayText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async () => {
    const textToShare = isUser ? message.text : displayText;
    if (navigator.share && textToShare) {
      await navigator.share({ title: "DocMentor", text: textToShare });
    } else {
      navigator.clipboard.writeText(textToShare || "");
      alert("Đã sao chép nội dung!");
    }
  };

  // --- EDIT ACTIONS ---
  const handleSaveEdit = () => {
    if (editedText.trim() !== message.text) {
      // Gọi callback để parent component xử lý logic API/State
      onEditMessage?.(message.id, editedText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(message.text); // Revert lại text cũ
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Bấm Enter để lưu, Shift+Enter để xuống dòng
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    // Bấm Escape để hủy
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // --- RENDER SECTIONS ---

  const renderUserFiles = () => {
    if (!isUser) return null;
    const filesToRender = [];

    if (message.attachment) {
      filesToRender.push({
        id: "att-direct",
        name: message.attachment.fileName,
        type: message.attachment.fileType,
        size: message.attachment.fileSize,
        label: "File tải lên",
      });
    }

    const attachedDocs = message.attachedDocuments || [];
    if (attachedDocs.length > 0) {
      attachedDocs.forEach((doc, idx) => {
        filesToRender.push({
          id: `att-doc-${doc.id || idx}`,
          name: doc.title || "Tài liệu không tên",
          type: "document",
          size: 0,
          label: "Tài liệu đính kèm",
        });
      });
    }

    if (filesToRender.length === 0) return null;

    return (
      <div className="flex flex-col gap-2 mb-3 w-full">
        {filesToRender.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 overflow-hidden"
          >
            <div className="flex-shrink-0">{getFileIcon(file.name, true)}</div>
            <div className="flex-grow min-w-0">
              <p
                className="font-semibold text-sm text-white truncate"
                title={file.name}
              >
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-100/80">
                <span className="uppercase tracking-wide">{file.label}</span>
                {file.size > 0 && <span>• {formatBytes(file.size)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSources = () => {
    if (isUser || !activeSources || activeSources.length === 0) return null;

    return (
      <div className="mt-4 pt-3 border-t border-gray-300/50 dark:border-gray-600/50 w-full">
        <div className="flex items-center gap-2 mb-3">
          <FiBookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Nguồn tham khảo
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {activeSources.map((source, index) => (
            <div
              key={index}
              className="group flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                  <span className="text-[10px] font-bold">{index + 1}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {source.documentTitle}
                  </span>
                  {source.pageNumber && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Trang {source.pageNumber}
                    </span>
                  )}
                </div>
              </div>
              <FiArrowUpRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Render Buttons cho User (Copy & Edit)
  const renderUserActions = () => {
    if (!isUser || isEditing) return null; // Ẩn khi đang edit

    return (
      <div className="flex items-center gap-1 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-white/20 text-blue-100 hover:text-white transition-colors"
          title="Sao chép"
        >
          {copiedId === message.id ? (
            <span className="text-xs font-bold text-white">✓</span>
          ) : (
            <FiCopy className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-md hover:bg-white/20 text-blue-100 hover:text-white transition-colors"
          title="Chỉnh sửa"
        >
          <FiEdit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ✅ Render Buttons cho AI (Copy, Share, Like...)
  const renderAIActions = () => {
    if (isUser) return null;
    return (
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {copiedId === message.id ? (
            <span className="text-xs font-bold text-green-500">✓</span>
          ) : (
            <FiCopy className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <FiShare2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFeedback(feedback === "like" ? null : "like")}
          className={`p-2 rounded transition-colors ${feedback === "like" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          <FiThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
          className={`p-2 rounded transition-colors ${feedback === "dislike" ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          <FiThumbsDown className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group relative max-w-[85%] md:max-w-xl rounded-2xl px-5 py-4 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-transparent dark:border-gray-700"
        }`}
      >
        {renderUserFiles()}

        {/* --- NỘI DUNG CHÍNH: Xử lý Edit Mode --- */}
        {isEditing ? (
          <div className="w-full">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/10 text-white border border-white/30 rounded-md p-2 text-sm focus:outline-none focus:border-white/50 resize-none min-h-[60px]"
              rows={Math.max(2, Math.min(10, editedText.split("\n").length))}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Hủy"
              >
                <FiX className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="p-1.5 rounded-full bg-green-500 hover:bg-green-400 text-white shadow-sm transition-colors"
                title="Lưu"
              >
                <FiCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Chế độ hiển thị bình thường */
          <>
            {(isUser ? message.text : displayText) && (
              <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                {isUser ? message.text : displayText}
              </div>
            )}
          </>
        )}

        {renderSources()}

        {/* Nút hành động (Tách biệt User và AI) */}
        {renderUserActions()}
        {renderAIActions()}
      </div>
    </div>
  );
};
