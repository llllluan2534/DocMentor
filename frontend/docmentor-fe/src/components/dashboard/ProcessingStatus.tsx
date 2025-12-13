// src/components/dashboard/ProcessingStatus.tsx
import React from "react";
import { useQuery } from "@/hooks/api/useQuery";
import { AlertCircle, Clock } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

interface ProcessingStatus {
  processing: Array<{
    id: number;
    title: string;
    file_type: string;
    created_at: string;
  }>;
  failed: Array<{
    id: number;
    title: string;
    file_type: string;
    error: string | null;
    created_at: string;
  }>;
}

export const ProcessingStatus: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: API_ENDPOINTS.DASHBOARD.PROCESSING_STATUS,
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data with proper defaults
  const statusData: ProcessingStatus = data || { processing: [], failed: [] };
  const { processing = [], failed = [] } = statusData;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="p-6 border border-orange-200 rounded-lg dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
            Đang xử lý ({processing.length})
          </h3>
        </div>
        {loading && (
          <div className="py-4 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error.message}</p>}
        {!loading && !error && processing.length === 0 && (
          <p className="text-sm text-orange-700 dark:text-orange-200">
            Không có tài liệu nào đang xử lý
          </p>
        )}
        {!loading && !error && processing.length > 0 && (
          <div className="space-y-2">
            {processing.map((doc) => (
              <div
                key={doc.id}
                className="p-2 text-sm text-orange-900 rounded bg-white/50 dark:bg-gray-800/50 dark:text-orange-100"
              >
                <p className="font-medium truncate">{doc.title}</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {doc.file_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Lỗi xử lý ({failed.length})
          </h3>
        </div>
        {loading && (
          <div className="py-4 text-center">
            <div className="inline-block w-6 h-6 border-2 border-red-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error.message}</p>}
        {!loading && !error && failed.length === 0 && (
          <p className="text-sm text-red-700 dark:text-red-200">
            Không có tài liệu nào bị lỗi
          </p>
        )}
        {!loading && !error && failed.length > 0 && (
          <div className="space-y-2">
            {failed.map((doc) => (
              <div
                key={doc.id}
                className="p-2 text-sm text-red-900 rounded bg-white/50 dark:bg-gray-800/50 dark:text-red-100"
              >
                <p className="font-medium truncate">{doc.title}</p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {doc.error || "Lỗi không xác định"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
