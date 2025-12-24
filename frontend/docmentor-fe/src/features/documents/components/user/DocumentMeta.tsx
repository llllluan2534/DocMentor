import React from "react";
import { Document } from "@/types/document.types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  FiCalendar, 
  FiHardDrive, 
  FiFile, 
  FiDownload, 
  FiMessageSquare,
  FiInfo
} from "react-icons/fi";
import Button from "@/components/common/Button";

// Hàm format dung lượng
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface DocumentMetaProps {
  document: Document;
}

export const DocumentMeta: React.FC<DocumentMetaProps> = ({ document }) => {
  const directUrl = document.file_path && document.file_path.startsWith("http") 
    ? document.file_path 
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Info Card */}
      <div className="p-5 bg-[#1A162D]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg">
        <h3 className="flex items-center gap-2 mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
          <FiInfo className="w-4 h-4" /> Thông tin chi tiết
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-3 transition-colors rounded-xl bg-white/5 hover:bg-white/10">
            <div className="p-2 text-blue-400 rounded-lg bg-blue-500/10">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Ngày tải lên</p>
              <p className="text-sm font-semibold text-gray-200">
                {document.uploadDate 
                  ? format(new Date(document.uploadDate), "dd 'tháng' MM, yyyy", { locale: vi })
                  : "N/A"
                }
              </p>
              <p className="text-xs text-gray-500">
                {document.uploadDate ? format(new Date(document.uploadDate), "HH:mm") : ""}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 transition-colors rounded-xl bg-white/5 hover:bg-white/10">
            <div className="p-2 text-purple-400 rounded-lg bg-purple-500/10">
              <FiFile className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Định dạng</p>
              <p className="text-sm font-semibold text-gray-200 uppercase">
                {document.type || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 transition-colors rounded-xl bg-white/5 hover:bg-white/10">
            <div className="p-2 text-green-400 rounded-lg bg-green-500/10">
              <FiHardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Kích thước</p>
              <p className="text-sm font-semibold text-gray-200">
                {formatBytes(document.fileSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Actions Card */}
      <div className="p-5 bg-gradient-to-br from-[#1A162D] to-[#141126] border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
          Thao tác
        </h3>
        <div className="flex flex-col gap-3">
          <Button 
            className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white shadow-lg bg-gradient-to-r from-primary to-secondary hover:shadow-primary/25 rounded-xl"
            onClick={() => {
               // Logic mở chat (có thể navigate sang trang chat với ID file)
               // navigate(`/chat?docId=${document.id}`)
               alert("Tính năng Chat nhanh đang cập nhật!");
            }}
          >
            <FiMessageSquare className="w-5 h-5" />
            Chat với tài liệu này
          </Button>

          {directUrl && (
            <a 
              href={directUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-full gap-2 py-3 font-medium text-gray-300 transition-all border border-white/10 rounded-xl hover:bg-white/5 hover:text-white"
            >
              <FiDownload className="w-5 h-5" />
              Tải xuống file gốc
            </a>
          )}
        </div>
      </div>
    </div>
  );
};