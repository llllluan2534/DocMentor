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
  FiEdit3,
  FiCheck,
  FiX,
  FiExternalLink,
} from "react-icons/fi";

interface MessageBubbleProps {
  message: ChatMessage;
  onEditMessage?: (messageId: string, newText: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (fileName: string, isUserBubble: boolean) => {
  const name = fileName || "";
  if (name.toLowerCase().endsWith("pdf"))
    return (
      <FiFileText
        className={`w-5 h-5 ${isUserBubble ? "text-white" : "text-red-500"}`}
      />
    );
  if (name.match(/\.(doc|docx)$/i))
    return (
      <FiFileText
        className={`w-5 h-5 ${isUserBubble ? "text-white" : "text-blue-500"}`}
      />
    );
  return (
    <FiFile
      className={`w-5 h-5 ${isUserBubble ? "text-white/90" : "text-gray-500"}`}
    />
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onEditMessage,
}) => {
  const isUser = message.sender === "user";
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedText(message.text);
  }, [message.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // ✅ Xử lý text và sources thông minh
  const { displayText, activeSources } = useMemo(() => {
    if (isUser) return { displayText: message.text, activeSources: [] };

    let sources = message.sources ? [...message.sources] : [];
    let text = message.text || "";

    // Parse inline citations [1], [2], [1, 2]
    const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
    const citationsInText = new Set<number>();
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const nums = match[1].split(",").map((n) => parseInt(n.trim()));
      nums.forEach((n) => citationsInText.add(n));
    }

    // Tự động extract sources từ text nếu chưa có
    if (sources.length === 0) {
      const sourceRegex =
        /\[(?:Nguồn|Source)\s*(\d+):\s*(.*?)(?:,\s*Page\s*(\d+))?\]/gi;
      while ((match = sourceRegex.exec(text)) !== null) {
        sources.push({
          documentId: `gen-${match[1]}`,
          documentTitle: match[2].trim(),
          pageNumber: match[3] ? parseInt(match[3]) : null,
        });
      }
    }

    // Clean text: xóa phần [Nguồn X: ...] nhưng giữ [1], [2]
    const cleanedText = text
      .replace(/\[(?:Nguồn|Source)\s*\d+:\s*[\s\S]*?\]/gi, "")
      .trim();

    // Filter sources theo citations thực tế
    const usedSources = sources.filter(
      (_, idx) => citationsInText.size === 0 || citationsInText.has(idx + 1)
    );

    return { displayText: cleanedText, activeSources: usedSources };
  }, [message.text, message.sources, isUser]);

  const handleCopy = () => {
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

  const handleSaveEdit = () => {
    if (editedText.trim() !== message.text) {
      onEditMessage?.(message.id, editedText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(message.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Render User's attached files
  const renderUserFiles = () => {
    if (!isUser) return null;
    const filesToRender = [];

    if (message.attachment) {
      filesToRender.push({
        id: "att-direct",
        name: message.attachment.fileName,
        type: message.attachment.fileType,
        size: message.attachment.fileSize,
        label: "📎 File tải lên",
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
          label: "📚 Tài liệu",
        });
      });
    }

    if (filesToRender.length === 0) return null;

    return (
      <div className="flex flex-col w-full gap-2 mb-3">
        {filesToRender.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 transition-all border rounded-lg bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 hover:border-white/30"
          >
            <div className="flex-shrink-0">{getFileIcon(file.name, true)}</div>
            <div className="flex-grow min-w-0">
              <p
                className="text-sm font-medium text-white truncate"
                title={file.name}
              >
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-100/70">
                <span>{file.label}</span>
                {file.size > 0 && <span>• {formatBytes(file.size)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ Render Sources với design mới
  const renderSources = () => {
    if (isUser || !activeSources || activeSources.length === 0) return null;

    return (
      <div className="pt-4 mt-4 border-t border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <FiBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300">
            Nguồn tham khảo ({activeSources.length})
          </span>
        </div>
        <div className="space-y-2">
          {activeSources.map((source, index) => {
            // Handle both old and new field names
            const docTitle =
              source.documentTitle ||
              (source as any).document_title ||
              "Unknown";
            const pageNum =
              source.pageNumber ?? (source as any).page_number ?? null;

            return (
              <div
                key={`${source.documentId}-${index}`}
                className="flex items-start gap-3 p-3 transition-all border rounded-lg cursor-pointer group bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 border-blue-100/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate transition-colors dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {docTitle}
                  </p>
                  {pageNum && pageNum > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      📄 Trang {pageNum}
                    </p>
                  )}
                  {source.similarityScore && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Độ liên quan: {(source.similarityScore * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
                <FiExternalLink className="w-4 h-4 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUserActions = () => {
    if (!isUser || isEditing) return null;
    return (
      <div className="flex items-center justify-end gap-1 mt-2 transition-opacity opacity-0 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-white/20 text-blue-100 hover:text-white transition-colors"
          title="Sao chép"
        >
          {copiedId === message.id ? (
            <FiCheck className="w-3.5 h-3.5" />
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

  const renderAIActions = () => {
    if (isUser) return null;
    return (
      <div className="flex items-center gap-1 mt-3 transition-opacity opacity-0 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
          title="Sao chép"
        >
          {copiedId === message.id ? (
            <FiCheck className="w-4 h-4 text-green-500" />
          ) : (
            <FiCopy className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleShare}
          className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
          title="Chia sẻ"
        >
          <FiShare2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 mx-1 bg-gray-300 dark:bg-gray-600"></div>
        <button
          onClick={() => setFeedback(feedback === "like" ? null : "like")}
          className={`p-2 rounded-lg transition-colors ${
            feedback === "like"
              ? "text-green-600 bg-green-50 dark:bg-green-900/20"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Hữu ích"
        >
          <FiThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
          className={`p-2 rounded-lg transition-colors ${
            feedback === "dislike"
              ? "text-red-600 bg-red-50 dark:bg-red-900/20"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Không hữu ích"
        >
          <FiThumbsDown className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-3 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg shadow-md bg-gradient-to-br from-blue-500 to-purple-600">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}

      <div
        className={`group relative max-w-[85%] md:max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
          isUser
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm"
        }`}
      >
        {renderUserFiles()}

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
          <>
            {(isUser ? message.text : displayText) && (
              <div className="prose-sm prose max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {isUser ? message.text : displayText}
                </div>
              </div>
            )}
          </>
        )}

        {renderSources()}
        {renderUserActions()}
        {renderAIActions()}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-semibold text-white rounded-lg bg-gradient-to-br from-gray-600 to-gray-700">
          U
        </div>
      )}
    </div>
  );
};
