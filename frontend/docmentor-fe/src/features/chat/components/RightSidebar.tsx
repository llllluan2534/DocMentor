// src/features/chat/components/RightSidebar.tsx
import React, { useState } from "react";
import {
  FiX,
  FiCpu,
  FiUploadCloud,
  FiCheck,
  FiFileText,
  FiList,
  FiCheckSquare,
} from "react-icons/fi";
import { Document } from "@/types/document.types";
import { documentService } from "@/services/document/documentService";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocuments: Array<{ id: string; title: string }>;
  onRemoveDocument: (id: string) => void;
  onAddDocument: (doc: { id: string; title: string }) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  onRemoveDocument,
  onAddDocument,
}) => {
  const [activeTab, setActiveTab] = useState<"context" | "library">("context");
  const [libraryDocs, setLibraryDocs] = useState<Document[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (activeTab === "library" && libraryDocs.length === 0) loadLibrary();
  }, [activeTab]);

  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const res = await documentService.getDocuments({ page: 1, limit: 20 });
      setLibraryDocs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const doc = await documentService.uploadDocument(file, file.name);
      onAddDocument({ id: String(doc.id), title: doc.title });
      setActiveTab("context");
    } catch (error) {
      alert("Lỗi upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <aside
      className={`fixed top-16 right-0 bottom-0 w-80 bg-[#100D20] border-l border-white/5 z-30 transition-transform duration-300 shadow-2xl ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* ✅ HEADER SIDEBAR: Cố định chiều cao h-14 để khớp với Chat Toolbar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#100D20] flex-shrink-0">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-white uppercase">
            <FiCpu className="text-secondary" /> Công cụ AI
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex p-2 bg-[#141126] border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setActiveTab("context")}
            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeTab === "context" ? "bg-primary text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            Ngữ cảnh ({selectedDocuments.length})
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeTab === "library" ? "bg-primary text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            + Thêm mới
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          {activeTab === "context" && (
            <div className="space-y-6">
              {/* Context List */}
              <div className="space-y-3">
                {selectedDocuments.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-400">
                      Chưa có tài liệu nào
                    </p>
                  </div>
                ) : (
                  selectedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group relative p-3 bg-[#1A162D] rounded-xl border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit">
                          <FiFileText />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug text-gray-200 line-clamp-2">
                            {doc.title}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="absolute -top-2 -right-2 bg-[#25203b] text-gray-400 hover:text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10 shadow-lg"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* AI Tools */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="mb-4 text-xs font-bold text-gray-500 uppercase">
                  Gợi ý tác vụ
                </h4>
                <div className="grid gap-2">
                  <button className="flex items-center gap-3 p-3 transition-all border border-transparent bg-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 group">
                    <div className="p-1.5 bg-green-500/10 text-green-400 rounded-lg group-hover:bg-green-500/20">
                      <FiList />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      Tóm tắt ngữ cảnh
                    </span>
                  </button>
                  <button className="flex items-center gap-3 p-3 transition-all border border-transparent bg-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 group">
                    <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20">
                      <FiCheckSquare />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      Tạo câu hỏi ôn tập
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "library" && (
            <div className="space-y-6">
              <label
                className={`block p-6 border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-center transition-all ${isUploading ? "opacity-50" : ""}`}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.docx,.txt"
                />
                <FiUploadCloud className="w-6 h-6 mx-auto mb-2 text-secondary" />
                <p className="text-sm text-white">Tải lên từ máy tính</p>
              </label>
              <div>
                <h4 className="mb-3 text-xs font-bold text-gray-500 uppercase">
                  Thư viện của tôi
                </h4>
                <div className="space-y-2">
                  {libraryDocs.map((doc) => {
                    const isSelected = selectedDocuments.some(
                      (d) => d.id === String(doc.id)
                    );
                    return (
                      <button
                        key={doc.id}
                        onClick={() =>
                          !isSelected &&
                          onAddDocument({
                            id: String(doc.id),
                            title: doc.title,
                          })
                        }
                        disabled={isSelected}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all border ${isSelected ? "bg-primary/10 border-primary/30 opacity-60" : "bg-[#1A162D] border-transparent hover:bg-white/5"}`}
                      >
                        <div
                          className={`p-1.5 rounded-md ${isSelected ? "text-primary" : "text-gray-400"}`}
                        >
                          {isSelected ? <FiCheck /> : <FiFileText />}
                        </div>
                        <span className="flex-1 text-sm text-gray-300 truncate">
                          {doc.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
