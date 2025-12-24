import React, { useState, useEffect } from "react";
import { Document } from "@/types/document.types";
import { documentService } from "@/services/document/documentService";
import { FiFile, FiDownload, FiAlertCircle, FiLoader } from "react-icons/fi";

interface DocumentViewerProps {
  document: Document;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileType = document.type ? document.type.toLowerCase() : "unknown";

  // Link public từ Supabase
  const directUrl =
    document.file_path && document.file_path.startsWith("http")
      ? document.file_path
      : null;

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (fileType === "txt") {
          const blob = await documentService.getDocumentContent(
            String(document.id)
          );
          if (isMounted) {
            const text = await blob.text();
            setTextContent(text);
            setIsLoading(false);
          }
        }
        // ✅ Nhóm file Office: DOCX, DOC, PPTX, XLSX...
        else if (
          ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(fileType)
        ) {
          if (!directUrl) throw new Error("Missing file URL");
          // Với Office file, ta dùng Google Docs Viewer, nên chỉ cần set loading false
          setIsLoading(false);
        }
        // ✅ Nhóm PDF và Ảnh
        else if (
          fileType === "pdf" ||
          ["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)
        ) {
          if (!directUrl) throw new Error("Missing file URL");
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Viewer Error:", err);
        if (isMounted) {
          setError("Không thể tải nội dung. Vui lòng tải xuống để xem.");
          setIsLoading(false);
        }
      }
    };

    loadContent();
    return () => {
      isMounted = false;
    };
  }, [document.id, fileType, directUrl]);

  // --- RENDERERS ---

  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <FiLoader className="w-8 h-8 mb-3 text-primary animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Đang tải tài liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30 p-6">
        <FiAlertCircle className="w-10 h-10 mb-3 text-red-500" />
        <p className="mb-4 font-medium text-red-500">{error}</p>
        {directUrl && (
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Tải file gốc
          </a>
        )}
      </div>
    );
  }

  // 1. Render PDF (Native)
  if (fileType === "pdf" && directUrl) {
    return (
      <div className="w-full h-[85vh] bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
        <iframe
          src={directUrl}
          className="w-full h-full border-0"
          title={document.title}
        />
      </div>
    );
  }

  // 2. Render Office Files (Google Docs Viewer) - ✅ QUAN TRỌNG
  if (
    ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(fileType) &&
    directUrl
  ) {
    // Tạo link Google Viewer: https://docs.google.com/viewer?url=...&embedded=true
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(directUrl)}&embedded=true`;

    return (
      <div className="w-full h-[85vh] bg-white rounded-lg overflow-hidden border border-gray-300">
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title={document.title}
          onError={() => setError("Google Viewer không thể mở file này.")}
        />
      </div>
    );
  }

  // 3. Render Image
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType) && directUrl) {
    return (
      <div className="w-full h-auto min-h-[50vh] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
        <img
          src={directUrl}
          alt={document.title}
          className="max-w-full max-h-[80vh] object-contain shadow-md rounded"
        />
      </div>
    );
  }

  // 4. Render Text
  if (fileType === "txt" && textContent !== null) {
    return (
      <div className="w-full h-[80vh] overflow-auto bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-300">
          {textContent}
        </pre>
      </div>
    );
  }

  // 5. Fallback
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <FiFile className="w-16 h-16 mb-4 text-primary/50" />
      <p className="mb-6 text-gray-500">
        Định dạng {fileType} không hỗ trợ xem trước.
      </p>
      {directUrl && (
        <a
          href={directUrl}
          download
          className="flex items-center gap-2 px-6 py-3 text-white bg-primary rounded-xl hover:bg-primary/90"
        >
          <FiDownload /> Tải xuống
        </a>
      )}
    </div>
  );
};
