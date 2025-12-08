import React, { useState, useEffect } from "react";
import { Document } from "@/types/document.types";
import { documentService } from "@/services/document/documentService";
import { FiFile, FiDownload, FiAlertCircle, FiLoader } from "react-icons/fi";
import Button from "@/components/common/Button";

interface DocumentViewerProps {
  document: Document;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileType = document.type.toLowerCase();

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Gọi API tải file dưới dạng Blob (đã bao gồm Auth Token)
        const blob = await documentService.getDocumentContent(
          String(document.id)
        );

        if (!isMounted) return;

        // 2. Xử lý hiển thị theo loại file
        if (fileType === "txt") {
          const text = await blob.text();
          setTextContent(text);
        } else {
          // Tạo URL tạm thời từ Blob cho PDF và Ảnh
          objectUrl = URL.createObjectURL(blob);
          setFileUrl(objectUrl);
        }
      } catch (err) {
        console.error("Error loading document:", err);
        if (isMounted) setError("Không thể tải nội dung tài liệu này.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchContent();

    // Cleanup: Xóa URL tạm để tránh rò rỉ bộ nhớ
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document.id, fileType]);

  // --- RENDERERS ---

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <FiLoader className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Đang tải tài liệu...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30 p-6">
        <FiAlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-white border border-red-200 text-red-500 hover:bg-red-50"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // 3. Render PDF
  if (fileType === "pdf" && fileUrl) {
    return (
      <div className="w-full h-[85vh] bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title={document.title}
        />
      </div>
    );
  }

  // 4. Render Image (PNG, JPG, etc.)
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType) && fileUrl) {
    return (
      <div className="w-full h-auto min-h-[50vh] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
        <img
          src={fileUrl}
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
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-300">
          {textContent}
        </pre>
      </div>
    );
  }

  // 6. Render Fallback (Office Files & Others)
  // Các file DOCX, PPTX không thể render trực tiếp bằng Blob URL trên trình duyệt
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <FiFile className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 uppercase">
        {fileType}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        Trình duyệt không hỗ trợ xem trước trực tiếp định dạng này. Vui lòng tải
        xuống để xem nội dung đầy đủ.
      </p>

      {fileUrl && (
        <a
          href={fileUrl}
          download={document.title} // Thuộc tính này sẽ kích hoạt tải xuống thay vì mở tab mới
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <FiDownload className="w-5 h-5" />
          Tải xuống tài liệu
        </a>
      )}
    </div>
  );
};
