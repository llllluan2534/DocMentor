import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { FiArrowLeft, FiAlertCircle } from "react-icons/fi"; // Thêm icons
import { documentService } from "@/services/document/documentService";
import { Document } from "@/types/document.types";
import { DocumentViewer } from "@/features/documents/components/user/DocumentViewer";
import { DocumentMeta } from "@/features/documents/components/user/DocumentMeta";
import Button from "@/components/common/Button"; // Tận dụng lại Button component

const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate(); // Hook để quay lại trang trước
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      setIsLoading(true);
      try {
        const data = await documentService.getDocument(documentId);
        if (data) {
          setDocument(data);
        } else {
          setError("Không tìm thấy tài liệu.");
        }
      } catch (err) {
        console.error("Fetch detail error:", err);
        setError("Đã xảy ra lỗi khi tải tài liệu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  // --- LOADING STATE (Đồng bộ style xoay vòng với trang trước) ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 border-4 rounded-full border-primary/30 border-t-primary animate-spin"></div>
        <p className="mt-4 text-text-muted">Đang tải nội dung...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <FiAlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {error || "Không có dữ liệu"}
        </h2>
        <Button
          onClick={() => navigate(-1)}
          className="bg-accent border border-primary/30 text-white"
        >
          Quay lại thư viện
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* HEADER WITH BACK BUTTON */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-4 group"
        >
          <div className="p-2 rounded-full bg-accent/50 group-hover:bg-primary/20 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Quay lại thư viện</span>
        </button>

        {/* TITLE HEADER (Giống style trang DocumentsPage) */}
        <div className="relative p-6 overflow-hidden border rounded-2xl bg-gradient-to-br from-accent via-accent to-background border-primary/20 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {document.title}
            </h1>
            <p className="text-text-muted text-sm md:text-base opacity-80 line-clamp-1">
              {document.summary || "Chi tiết tài liệu và nội dung"}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Cột trái - Viewer (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-accent/40 backdrop-blur-sm border border-primary/20 rounded-xl overflow-hidden shadow-xl min-h-[500px] md:min-h-[700px]">
            <DocumentViewer document={document} />
          </div>
        </div>

        {/* Cột phải - Thông tin (Chiếm 1 phần) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-accent/40 backdrop-blur-sm border border-primary/20 rounded-xl p-6 shadow-lg sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
              Thông tin tài liệu
            </h3>
            <DocumentMeta document={document} />

            {/* Ví dụ thêm nút hành động nhanh */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                Chat với tài liệu này
              </Button>
              <Button className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white">
                Tải xuống
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
