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

  // Chuẩn hóa loại file
  const fileType = document.type ? document.type.toLowerCase() : "unknown";

  // Lấy link trực tiếp từ Supabase (đã lưu trong DB)
  // Nếu file_path bắt đầu bằng http thì dùng luôn, nếu không thì null
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
        // TRƯỜNG HỢP 1: File TXT - Phải tải về để đọc nội dung text
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
        // TRƯỜNG HỢP 2: PDF hoặc Ảnh - Dùng luôn link trực tiếp, không cần tải blob
        else if (
          fileType === "pdf" ||
          ["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)
        ) {
          if (!directUrl) {
            throw new Error(
              "Không tìm thấy đường dẫn file (File Path is missing)."
            );
          }
          // Với link trực tiếp, ta chỉ cần set loading false là xong
          // iframe/img sẽ tự load từ url
          setIsLoading(false);
        }
        // TRƯỜNG HỢP 3: Các file khác (DOCX, PPTX...)
        else {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Viewer Error:", err);
        if (isMounted) {
          setError("Không thể tải nội dung. Vui lòng thử tải xuống file.");
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

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <FiLoader className="w-8 h-8 mb-3 text-primary animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">
          Đang kết nối tới Supabase...
        </p>
      </div>
    );
  }

  // 2. Error State
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
            Mở file gốc
          </a>
        )}
      </div>
    );
  }

  // 3. Render PDF (Dùng Direct URL)
  if (fileType === "pdf" && directUrl) {
    return (
      <div className="w-full h-[85vh] bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
        <iframe
          src={directUrl} // <--- Dùng link trực tiếp Supabase
          className="w-full h-full border-0"
          title={document.title}
        />
      </div>
    );
  }

  // 4. Render Image (Dùng Direct URL)
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType) && directUrl) {
    return (
      <div className="w-full h-auto min-h-[50vh] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
        <img
          src={directUrl} // <--- Dùng link trực tiếp Supabase
          alt={document.title}
          className="max-w-full max-h-[80vh] object-contain shadow-md rounded"
        />
      </div>
    );
  }

  // 5. Render Text (.txt)
  if (fileType === "txt" && textContent !== null) {
    return (
      <div className="w-full h-[80vh] overflow-auto bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-300">
          {textContent}
        </pre>
      </div>
    );
  }

  // 6. Render Fallback (DOCX, PPTX...)
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-primary/10">
        <FiFile className="w-10 h-10 text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-800 uppercase dark:text-white">
        {fileType}
      </h3>
      <p className="max-w-md mb-6 text-gray-500 dark:text-gray-400">
        Trình duyệt không hỗ trợ xem trước trực tiếp định dạng này.
      </p>

      {directUrl && (
        <a
          href={directUrl}
          download={document.title}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-colors shadow-lg bg-primary rounded-xl hover:bg-primary/90 shadow-primary/20"
        >
          <FiDownload className="w-5 h-5" />
          Tải xuống / Mở file
        </a>
      )}
    </div>
  );
};
