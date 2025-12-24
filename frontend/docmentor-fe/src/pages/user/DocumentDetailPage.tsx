import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiFileText, FiCpu } from "react-icons/fi";
import { documentService } from "@/services/document/documentService";
import { Document } from "@/types/document.types";
import { DocumentViewer } from "@/features/documents/components/user/DocumentViewer";
import { DocumentMeta } from "@/features/documents/components/user/DocumentMeta";
import Button from "@/components/common/Button";

const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
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

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0e1a]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 rounded-full border-primary/30"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-4 rounded-full border-t-primary animate-spin"></div>
        </div>
        <p className="mt-4 font-medium text-gray-400 animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0e1a] gap-6 p-4">
        <div className="p-6 rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <FiAlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Đã có lỗi xảy ra
          </h2>
          <p className="text-gray-400">
            {error || "Không tìm thấy dữ liệu tài liệu này."}
          </p>
        </div>
        <Button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white border bg-white/5 border-white/10 hover:bg-white/10"
        >
          Quay lại thư viện
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0e1a] pb-12 animate-fade-in">
      {/* 1. TOP NAVIGATION & BANNER */}
      <div className="relative pt-6 pb-12 overflow-hidden bg-gradient-to-b from-[#1A162D] to-[#0f0e1a] border-b border-white/5">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="relative px-4 mx-auto max-w-7xl md:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-400 transition-colors hover:text-white group w-fit"
          >
            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
              <FiArrowLeft className="w-4 h-4" />
            </div>
            Quay lại thư viện
          </button>

          {/* Title Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-primary border border-primary/20 uppercase tracking-wide">
                  {document.type}
                </span>
                {document.processed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <FiCpu className="w-3 h-3" /> AI Ready
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-tight text-white md:text-4xl line-clamp-2">
                {document.title}
              </h1>
              <p className="max-w-3xl mt-2 text-base text-gray-400 line-clamp-2">
                {document.summary || "Chưa có bản tóm tắt cho tài liệu này."}
              </p>
            </div>

            {/* Quick Actions (Desktop) */}
            <div className="flex-shrink-0 hidden gap-3 mt-4 md:flex md:mt-0">
              {/* Nút này có thể mở modal chat hoặc scroll xuống */}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="px-4 mx-auto -mt-8 max-w-7xl md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: VIEWER (8/12) */}
          <div className="lg:col-span-8 animate-slide-up">
            <div className="overflow-hidden bg-[#141126] border rounded-2xl border-white/10 shadow-2xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1A162D]/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <FiFileText className="text-primary" />
                  <span className="font-medium">Xem trước tài liệu</span>
                </div>
              </div>
              <div className="flex-1 bg-gray-900/50">
                <DocumentViewer document={document} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: META & ACTIONS (4/12) */}
          <div className="space-y-6 lg:col-span-4 animate-slide-up [animation-delay:200ms]">
            <DocumentMeta document={document} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
