import React, { useState, useMemo, useRef, useEffect } from "react";
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

// Types
interface SourceReference {
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  similarityScore?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  status?: "sent" | "error" | "sending" | "loading";
  attachment?: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  attachedDocuments?: Array<{
    id: string;
    title: string;
  }>;
  sources?: SourceReference[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  onEditMessage?: (messageId: string, newText: string) => void;
}

// Utility functions
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

// Markdown Parser Component
const MarkdownRenderer: React.FC<{
  content: string;
  isUser: boolean;
  sources?: SourceReference[];
}> = ({ content, isUser, sources = [] }) => {
  const renderContent = () => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    let elementCounter = 0; // ✅ Unique key counter

    while (i < lines.length) {
      const line = lines[i];
      const currentKey = `element-${elementCounter++}`; // ✅ Generate unique key

      // Headers
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={currentKey}
            className={`text-lg font-bold mt-4 mb-2 ${
              isUser ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {parseInlineFormatting(line.substring(4), isUser, sources)}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={currentKey}
            className={`text-xl font-bold mt-5 mb-3 ${
              isUser ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {parseInlineFormatting(line.substring(3), isUser, sources)}
          </h2>
        );
        i++;
        continue;
      }

      // Code blocks
      if (line.startsWith("```")) {
        const codeLines: string[] = [];
        const lang = line.substring(3).trim();
        const codeStartKey = currentKey;
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <div key={codeStartKey} className="my-4">
            <div
              className={`text-xs px-3 py-1 rounded-t-lg font-mono ${
                isUser
                  ? "bg-black/30 text-blue-200"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {lang || "code"}
            </div>
            <pre
              className={`p-4 rounded-b-lg overflow-x-auto ${
                isUser ? "bg-black/40 text-white" : "bg-gray-900 text-gray-100"
              }`}
            >
              <code className="font-mono text-sm">{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Tables
      if (line.includes("|") && line.trim().startsWith("|")) {
        const tableLines: string[] = [];
        const tableStartKey = currentKey;
        while (i < lines.length && lines[i].includes("|")) {
          tableLines.push(lines[i]);
          i++;
        }

        const rows = tableLines.map((l) =>
          l
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean)
        );

        if (rows.length > 0) {
          elements.push(
            <div key={tableStartKey} className="my-4 overflow-x-auto">
              <table
                className={`min-w-full border-collapse ${
                  isUser
                    ? "border border-white/30"
                    : "border border-gray-300 dark:border-gray-600"
                }`}
              >
                <thead
                  className={
                    isUser ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
                  }
                >
                  <tr>
                    {rows[0].map((header, idx) => (
                      <th
                        key={idx}
                        className={`px-4 py-2 text-left text-sm font-semibold border ${
                          isUser
                            ? "border-white/30 text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(2).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={
                        isUser
                          ? "hover:bg-white/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={`px-4 py-2 text-sm border ${
                            isUser
                              ? "border-white/30 text-white/90"
                              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {parseInlineFormatting(cell, isUser)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Unordered lists
      if (line.match(/^[•\-\*]\s+/)) {
        const listItems: string[] = [];
        const listStartKey = currentKey;
        while (i < lines.length && lines[i].match(/^[•\-\*]\s+/)) {
          listItems.push(lines[i].replace(/^[•\-\*]\s+/, ""));
          i++;
        }
        elements.push(
          <ul
            key={listStartKey}
            className={`my-3 space-y-2 ${
              isUser ? "text-white/95" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {listItems.map((item, idx) => (
              <li
                key={`${listStartKey}-item-${idx}`}
                className="flex items-start gap-2"
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isUser ? "bg-white/70" : "bg-blue-500"
                  }`}
                />
                <span className="text-[15px] leading-relaxed">
                  {parseInlineFormatting(item, isUser, sources)}
                </span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered lists
      if (line.match(/^\d+\.\s+/)) {
        const listItems: string[] = [];
        const listStartKey = currentKey;
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
          i++;
        }
        elements.push(
          <ol
            key={listStartKey}
            className={`my-3 space-y-2 ${
              isUser ? "text-white/95" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {listItems.map((item, idx) => (
              <li
                key={`${listStartKey}-item-${idx}`}
                className="flex items-start gap-3"
              >
                <span
                  className={`font-semibold flex-shrink-0 ${
                    isUser
                      ? "text-white/80"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {idx + 1}.
                </span>
                <span className="text-[15px] leading-relaxed">
                  {parseInlineFormatting(item, isUser, sources)}
                </span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Horizontal rules
      if (line.match(/^━{3,}$/)) {
        elements.push(
          <hr
            key={currentKey}
            className={`my-4 border-t-2 ${
              isUser
                ? "border-white/30"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
        );
        i++;
        continue;
      }

      // Regular paragraphs
      if (line.trim()) {
        elements.push(
          <p
            key={currentKey}
            className={`text-[15px] leading-relaxed mb-3 ${
              isUser ? "text-white/95" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {parseInlineFormatting(line, isUser, sources)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  return <div className="space-y-1">{renderContent()}</div>;
};

// ✅ Enhanced inline formatting with tooltip support
const parseInlineFormatting = (
  text: string,
  isUser: boolean,
  sources: SourceReference[] = []
) => {
  const parts: React.ReactNode[] = [];
  let currentText = "";
  let i = 0;
  let partCounter = 0;

  while (i < text.length) {
    // Bold text **text**
    if (text.substring(i, i + 2) === "**") {
      if (currentText) {
        parts.push(<span key={`text-${partCounter++}`}>{currentText}</span>);
        currentText = "";
      }
      i += 2;
      let boldText = "";
      while (i < text.length && text.substring(i, i + 2) !== "**") {
        boldText += text[i];
        i++;
      }
      parts.push(
        <strong key={`bold-${partCounter++}`} className="font-semibold">
          {boldText}
        </strong>
      );
      i += 2;
      continue;
    }

    // ✅ Citations [1], [2], [1, 2] with tooltip
    if (text[i] === "[" && text.substring(i).match(/^\[\d+(?:,\s*\d+)*\]/)) {
      if (currentText) {
        parts.push(<span key={`text-${partCounter++}`}>{currentText}</span>);
        currentText = "";
      }
      const match = text.substring(i).match(/^\[(\d+(?:,\s*\d+)*)\]/);
      if (match) {
        const citation = match[1];
        const citationNumbers = citation
          .split(",")
          .map((n) => parseInt(n.trim()));

        // Get source info for tooltip
        const citationSources = citationNumbers
          .map((num) => sources[num - 1])
          .filter(Boolean);

        parts.push(
          <CitationBadge
            key={`cite-${partCounter++}`}
            citation={citation}
            sources={citationSources}
            isUser={isUser}
          />
        );
        i += match[0].length;
        continue;
      }
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    parts.push(<span key={`text-${partCounter++}`}>{currentText}</span>);
  }

  return parts;
};

// ✅ NEW: Citation Badge with Tooltip
const CitationBadge: React.FC<{
  citation: string;
  sources: SourceReference[];
  isUser: boolean;
}> = ({ citation, sources, isUser }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Only show single number if it's just one citation
  const displayText = citation.includes(",") ? citation : citation;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <sup
        className={`mx-0.5 px-1.5 py-0.5 text-xs font-medium rounded cursor-help transition-colors ${
          isUser
            ? "bg-white/30 text-white hover:bg-white/40"
            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40"
        }`}
      >
        {displayText}
      </sup>

      {/* ✅ Tooltip */}
      {showTooltip && sources.length > 0 && (
        <div
          className="absolute z-50 p-3 mb-2 text-xs text-white -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl pointer-events-none bottom-full left-1/2 w-72 dark:bg-gray-800"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <div className="space-y-2">
            {sources.map((source, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-500 rounded-full text-[10px] font-bold">
                  {citation.split(",")[idx]?.trim() || idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {source.documentTitle}
                  </p>
                  {source.pageNumber && (
                    <p className="text-gray-400 text-[10px]">
                      Trang {source.pageNumber}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -mt-px -translate-x-1/2 top-full left-1/2">
            <div className="w-0 h-0 border-t-4 border-l-4 border-r-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </div>
      )}
    </span>
  );
};

// Parse inline formatting (legacy - now uses enhanced version above)
const parseInlineFormattingLegacy = (text: string, isUser: boolean) => {
  const parts: React.ReactNode[] = [];
  let currentText = "";
  let i = 0;

  while (i < text.length) {
    // Bold text **text**
    if (text.substring(i, i + 2) === "**") {
      if (currentText) {
        parts.push(currentText);
        currentText = "";
      }
      i += 2;
      let boldText = "";
      while (i < text.length && text.substring(i, i + 2) !== "**") {
        boldText += text[i];
        i++;
      }
      parts.push(
        <strong key={i} className="font-semibold">
          {boldText}
        </strong>
      );
      i += 2;
      continue;
    }

    // Citations [1], [2], [1, 2]
    if (text[i] === "[" && text.substring(i).match(/^\[\d+(?:,\s*\d+)*\]/)) {
      if (currentText) {
        parts.push(currentText);
        currentText = "";
      }
      const match = text.substring(i).match(/^\[(\d+(?:,\s*\d+)*)\]/);
      if (match) {
        const citation = match[1];
        parts.push(
          <sup
            key={i}
            className={`mx-0.5 px-1.5 py-0.5 text-xs font-medium rounded ${
              isUser
                ? "bg-white/30 text-white"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            }`}
          >
            {citation}
          </sup>
        );
        i += match[0].length;
        continue;
      }
    }

    currentText += text[i];
    i++;
  }

  return parts;
};

// Main Component
export default function MessageBubble({
  message,
  onEditMessage,
}: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add CSS animation for tooltip
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  const { displayText, activeSources } = useMemo(() => {
    if (isUser) return { displayText: message.text, activeSources: [] };

    let sources = message.sources ? [...message.sources] : [];
    let text = message.text || "";

    const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
    const citationsInText = new Set<number>();
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const nums = match[1].split(",").map((n) => parseInt(n.trim()));
      nums.forEach((n) => citationsInText.add(n));
    }

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

    const cleanedText = text
      .replace(/\[(?:Nguồn|Source)\s*\d+:\s*[\s\S]*?\]/gi, "")
      .trim();

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
              <MarkdownRenderer
                content={isUser ? message.text : displayText}
                isUser={isUser}
                sources={activeSources}
              />
            )}
          </>
        )}

        {renderSources()}
        {renderUserActions()}
        {renderAIActions()}
      </div>

      {isUser && (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-semibold text-white rounded-lg bg-gradient-to-br from-gray-600 to-gray-700">
          U
        </div>
      )}
    </div>
  );
}
