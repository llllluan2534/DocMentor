import React, { useState, useMemo } from "react";
import {
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiFile,
  FiBookOpen,
  FiEdit3,
  FiCheck,
  FiExternalLink,
  FiUser,
  FiCpu,
} from "react-icons/fi";

// --- TYPES ---
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
  status?: "sending" | "sent" | "error" | "loading";
  attachment?: { fileName: string; fileSize: number; fileType: string };
  attachedDocuments?: Array<{ id: string; title: string }>;
  sources?: SourceReference[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  onEditMessage?: (messageId: string, newText: string) => void;
}

// 1. Citation Badge (Fix Z-Index & Style)
const CitationBadge: React.FC<{
  citation: string;
  sources: SourceReference[];
  isUser: boolean;
}> = ({ citation, sources, isUser }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="relative inline-block align-baseline mx-0.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <sup
        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full cursor-help transition-all ${isUser ? "bg-white/30 text-white" : "bg-primary text-white hover:bg-primary/80"}`}
      >
        {citation}
      </sup>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#0f0e1a] border border-gray-700 shadow-2xl rounded-xl z-[9999] animate-fade-in">
          <div className="pb-2 mb-2 text-xs font-bold tracking-wider text-gray-300 uppercase border-b border-gray-700">
            Nguồn tham khảo
          </div>
          <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
            {sources.length > 0 ? (
              sources.map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-1 rounded hover:bg-white/5"
                >
                  <span className="flex-shrink-0 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 line-clamp-2">
                      {source.documentTitle || "Tài liệu không tên"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 rounded">
                        {source.pageNumber
                          ? `Trang ${source.pageNumber}`
                          : "Toàn văn"}
                      </span>
                      {source.similarityScore && (
                        <span className="text-[10px] text-green-500">
                          {Math.round(source.similarityScore * 100)}% khớp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-center text-gray-500">
                Chi tiết nguồn chưa được lập chỉ mục
              </p>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f0e1a]"></div>
        </div>
      )}
    </span>
  );
};

// ✅ 2. ENHANCED MARKDOWN RENDERER
const MarkdownRenderer: React.FC<{ content: string; isUser: boolean; sources?: SourceReference[]; }> = ({ content, isUser, sources = [] }) => {
  
  // Helper to parse inline styles (bold, italic, citations)
  const parseInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\[(\d+(?:,\s*\d+)*)\])|(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) { // Citation
        const nums = match[2].split(",").map(n => parseInt(n.trim()));
        const relevantSources = nums.map(n => sources[n - 1]).filter(Boolean);
        parts.push(<CitationBadge key={match.index} citation={match[2]} sources={relevantSources} isUser={isUser} />);
      } else if (match[3]) { // Bold
        parts.push(<strong key={match.index} className="font-bold">{match[3].slice(2, -2)}</strong>);
      } else if (match[4]) { // Italic
        parts.push(<em key={match.index} className="italic">{match[4].slice(1, -1)}</em>);
      } else if (match[5]) { // Code
        parts.push(<code key={match.index} className="px-1 font-mono text-sm rounded bg-black/30">{match[5].slice(1, -1)}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts;
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];
    
    // --- HEADERS ---
    if (line.trim().startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\s*/, '');
        const sizes = ["text-xl", "text-lg", "text-base"];
        const className = `${sizes[level-1] || "text-base"} font-bold mt-4 mb-2 ${isUser ? "text-white" : "text-gray-100"}`;
        elements.push(<div key={i} className={className}>{parseInline(text)}</div>);
        i++; continue;
    }

    // --- LISTS (Nested Support) ---
    if (/^(\s*)([-*]|\d+\.)\s/.test(line)) {
        const listItems = [];
        let currentIndent = 0;
        
        while (i < lines.length) {
            const match = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
            if (!match) break;
            
            const indent = match[1].length;
            const marker = match[2];
            const text = match[3];
            const isOrdered = /^\d+\./.test(marker);
            
            // Basic nesting logic: Indent based on spaces (approximate)
            const marginLeft = indent > 0 ? "ml-6" : "ml-0"; 
            
            listItems.push(
                <li key={i} className={`${marginLeft} mb-1 flex items-start gap-2`}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                    <span className="leading-relaxed">{parseInline(text)}</span>
                </li>
            );
            i++;
        }
        elements.push(<ul key={`list-${i}`} className="mb-3">{listItems}</ul>);
        continue;
    }

    // --- TABLES ---
    if (line.trim().startsWith('|')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
            tableRows.push(lines[i]);
            i++;
        }
        
        if (tableRows.length >= 2) { // Need at least header + separator
            const rows = tableRows.map(r => r.split('|').slice(1, -1).map(c => c.trim()));
            const header = rows[0];
            const body = rows.slice(2); // Skip separator row
            
            elements.push(
                <div key={`table-${i}`} className="my-4 overflow-hidden border border-gray-700 rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="font-bold bg-white/10">
                            <tr>{header.map((h, idx) => <th key={idx} className="px-3 py-2 text-left border-b border-gray-700">{parseInline(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {body.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/5">
                                    {row.map((c, cIdx) => <td key={cIdx} className="px-3 py-2">{parseInline(c)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }
    }

    // --- PARAGRAPH ---
    if (line.trim()) {
        elements.push(<div key={i} className="mb-2 leading-relaxed">{parseInline(line)}</div>);
    }
    i++;
  }

  return <div className={`space-y-1 ${isUser ? "text-white" : "text-gray-200"}`}>{elements}</div>;
};

// 3. MAIN COMPONENT (MessageBubble)
export default function MessageBubble({
  message,
  onEditMessage,
}: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const isLoading = message.status === "loading";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);

  // Clean text: Xóa artifacts nếu có
  const displayText = useMemo(
    () =>
      message.text.replace(/\[(?:Nguồn|Source)\s*\d+:\s*.*?\]/gi, "").trim(),
    [message.text]
  );
  const activeSources = useMemo(() => message.sources || [], [message.sources]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full gap-4 ${isUser ? "justify-end" : "justify-start"} group mb-6 animate-fade-in`}
    >
      {!isUser && (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mt-1 rounded-full shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <FiCpu
            className={`w-4 h-4 text-white ${isLoading ? "animate-pulse" : ""}`}
          />
        </div>
      )}

      <div
        className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}
      >
        <span className="text-[10px] text-gray-500 mb-1 px-1 opacity-70">
          {isUser ? "Bạn" : "DocMentor AI"} •{" "}
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div
          className={`relative px-5 py-4 shadow-md text-sm transition-all ${
            isUser
              ? "bg-primary text-white rounded-2xl rounded-tr-sm"
              : "bg-[#1A162D] border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm"
          }`}
        >
          {isLoading ? (
            <div className="flex gap-1.5 items-center h-5 px-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          ) : (
            <>
              {/* Attachments */}
              {isUser && (message.attachment || message.attachedDocuments) && (
                <div className="mb-3 space-y-2">
                  {message.attachment && (
                    <div className="flex items-center gap-2 p-2 text-xs border rounded bg-white/10 border-white/10">
                      <FiFile /> {message.attachment.fileName}
                    </div>
                  )}
                  {message.attachedDocuments?.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 text-xs border rounded bg-white/10 border-white/10"
                    >
                      <FiBookOpen /> {doc.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Editing Mode */}
              {isEditing ? (
                <div className="min-w-[300px]">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-2 text-white border rounded bg-black/30 border-white/20 focus:outline-none"
                    rows={4}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 text-xs rounded hover:bg-white/10"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        onEditMessage?.(message.id, editedText);
                        setIsEditing(false);
                      }}
                      className="px-3 py-1 text-xs font-bold bg-white rounded text-primary"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer
                  content={displayText}
                  isUser={isUser}
                  sources={activeSources}
                />
              )}

              {/* Sources Footer */}
              {!isUser && activeSources.length > 0 && (
                <div className="pt-3 mt-4 border-t border-white/10">
                  <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <FiBookOpen size={10} /> Nguồn tham khảo
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {activeSources.map((src, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-1.5 rounded bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 transition-colors cursor-pointer group"
                      >
                        <span className="w-4 h-4 bg-gray-700 group-hover:bg-primary group-hover:text-white transition-colors rounded-full flex items-center justify-center text-[9px] font-bold text-gray-300">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-xs text-gray-400 truncate group-hover:text-gray-200">
                          {src.documentTitle}
                        </span>
                        <FiExternalLink
                          size={10}
                          className="text-gray-600 group-hover:text-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!isLoading && (
          <div className="flex items-center gap-1 px-1 mt-1 transition-opacity opacity-0 group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
              title="Sao chép"
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
            {!isUser && (
              <>
                <button className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-green-400">
                  <FiThumbsUp size={14} />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-red-400">
                  <FiThumbsDown size={14} />
                </button>
              </>
            )}
            {isUser && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white"
              >
                <FiEdit3 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mt-1 bg-gray-700 rounded-full">
          <FiUser className="text-gray-300" />
        </div>
      )}
    </div>
  );
}
