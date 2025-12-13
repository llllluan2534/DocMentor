// src/components/dashboard/RecentDocuments.tsx
import React from "react";
import { useQuery } from "@/hooks/api/useQuery";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { formatFileSize } from "@/utils/formatters";
import { API_ENDPOINTS, buildQueryUrl } from "@/config/api";

interface RecentDocument {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: string;
}

export const RecentDocuments: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: buildQueryUrl(API_ENDPOINTS.DASHBOARD.RECENT_DOCUMENTS, { limit: 5 }),
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data
  const documents = data || [];

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tài liệu gần đây
        </h3>
        <a
          href="/user/documents"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Xem tất cả →
        </a>
      </div>

      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <p className="text-sm text-red-500">{error.message}</p>
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          Chưa có tài liệu nào
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc: RecentDocument) => (
            <div
              key={doc.id}
              className="p-3 transition border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded dark:bg-blue-900/30">
                  <FileText
                    size={16}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{doc.file_type}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {doc.processed ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle size={14} />
                      <span>Xong</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                      <Clock size={14} />
                      <span>Đang xử lý</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
