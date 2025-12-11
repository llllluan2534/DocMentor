// src/features/documents/components/user/DocumentList.tsx
import React, { useState } from "react";
import { Document } from "@/types/document.types";
import { DocumentCard } from "@/features/documents/components/user/DocumentCard";
import { FiLoader, FiAlertCircle, FiX } from "react-icons/fi";
import { documentService } from "@/services/document/documentService";

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  editingId?: string | null;
  editingTitle?: string;
  onStartEdit?: (doc: Document) => void;
  onSaveEdit?: (id: string) => void;
  onCancelEdit?: () => void;
  onEditingTitleChange?: (title: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onView,
  editingId,
  editingTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTitleChange,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = async (doc: Document) => {
    setSelectedDoc(doc);
    setIsLoadingPreview(true);
    setPreviewError(null);
    setPreviewText("");

    try {
      const blob = await documentService.getDocumentContent(String(doc.id));
      const fileType = doc.type.toLowerCase();

      if (fileType === "txt") {
        const text = await blob.text();
        const lines = text.split("\n").slice(0, 20).join("\n");
        setPreviewText(
          lines.substring(0, 2000) + (lines.length > 2000 ? "..." : "")
        );
      } else if (fileType === "pdf") {
        setPreviewText("📄 PDF Document\n\nNhấn vào tài liệu để xem chi tiết");
      } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)) {
        setPreviewText("🖼️ Image File\n\nNhấn vào tài liệu để xem chi tiết");
      } else {
        setPreviewText(
          `📎 ${fileType.toUpperCase()} File\n\nNhấn vào tài liệu để xem chi tiết`
        );
      }
    } catch (err) {
      console.error("❌ Preview error:", err);
      setPreviewError("Không thể tải xem trước");
      setPreviewText(doc.summary || "Không có nội dung");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onMouseEnter={() => loadPreview(doc)}
            onMouseLeave={() => setSelectedDoc(null)}
          >
            <DocumentCard
              document={doc}
              view="list"
              onDelete={onDelete}
              onView={onView}
              isSelected={false}
              onSelectionChange={() => {}}
              editingId={editingId}
              editingTitle={editingTitle}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditingTitleChange={onEditingTitleChange}
            />
          </div>
        ))}
      </div>

      {/* Preview Panel - Right Bottom */}
      {selectedDoc && (
        <div className="fixed right-6 bottom-6 w-96 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-md rounded-xl border border-primary/30 p-6 flex flex-col shadow-2xl z-50 max-h-[70vh] animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/10">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg line-clamp-2">
                {selectedDoc.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {selectedDoc.type.toUpperCase()} •{" "}
                {(selectedDoc.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setSelectedDoc(null)}
              className="p-2 rounded-lg text-gray-400 hover:bg-slate-700/50 hover:text-white transition-all flex-shrink-0"
              title="Đóng"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto min-h-0 mb-4">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center gap-3 h-40">
                <FiLoader className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-gray-400">
                  Đang tải xem trước...
                </span>
              </div>
            ) : previewError ? (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-semibold">Lỗi</p>
                  <p className="text-xs text-red-300 mt-1">{previewError}</p>
                </div>
              </div>
            ) : (
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono break-words">
                {previewText || "Không có nội dung"}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => onView(String(selectedDoc.id))}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Xem đầy đủ
            </button>
          </div>
        </div>
      )}
    </>
  );
};
