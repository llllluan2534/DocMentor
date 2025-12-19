import React from "react";
import ReactMarkdown from "react-markdown";
import { FiX, FiCopy, FiCheck } from "react-icons/fi";

interface SummaryViewerProps {
  summary: string;
  onClose: () => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#141126] border-t border-white/5 animate-slide-up">
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h4 className="text-xs font-bold text-green-400 uppercase">
          Tóm tắt tài liệu
        </h4>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-white"
            title="Sao chép"
          >
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-sm text-gray-300 custom-scrollbar">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>
            {summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
