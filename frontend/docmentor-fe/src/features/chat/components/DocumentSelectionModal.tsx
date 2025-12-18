import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiCheck,
  FiArrowLeft,
  FiX,
} from "react-icons/fi";
import { documentService } from "@/services/document/documentService";
import { Document } from "@/types/document.types";
import Button from "@/components/common/Button";
import { useDebounce } from "@/hooks/common/useDebounce";

interface DocumentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentsSelected: (
    documents: Array<{ id: string; title: string }>
  ) => void;
}

export const DocumentSelectionModal: React.FC<DocumentSelectionModalProps> = ({
  isOpen,
  onClose,
  onDocumentsSelected,
}) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen, debouncedSearchQuery]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await documentService.getDocuments({
        page: 1,
        limit: 50,
        query: debouncedSearchQuery,
      });
      setDocuments(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDoc = (id: string | number) => {
    const strId = String(id);
    setSelectedDocIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };

  const handleConfirm = () => {
    const selected = documents.filter((d) =>
      selectedDocIds.includes(String(d.id))
    );
    onDocumentsSelected(
      selected.map((d) => ({ id: String(d.id), title: d.title }))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#100D20] border border-primary/20 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Chọn ngữ cảnh</h2>
            <p className="mt-1 text-sm text-gray-400">
              Chọn tài liệu để AI phân tích và trả lời
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white bg-white/5 hover:bg-white/10"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-[#1A162D]/50">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#100D20] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Không tìm thấy tài liệu nào
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedDocIds.includes(String(doc.id));
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/40"
                      : "bg-[#1A162D] border-transparent hover:border-white/10 hover:bg-[#201c36]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <FiCheck className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-300"}`}
                    >
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB •{" "}
                      {new Date(doc.uploadDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#1A162D]/50 flex justify-between items-center rounded-b-2xl">
          <button
            onClick={() => navigate("/user/documents")}
            className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-primary"
          >
            <FiArrowLeft /> Quản lý tài liệu
          </button>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="text-gray-300 bg-transparent border border-white/10 hover:bg-white/5"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedDocIds.length === 0}
              className="text-white shadow-lg bg-gradient-to-r from-primary to-secondary shadow-primary/20"
            >
              Xác nhận ({selectedDocIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
