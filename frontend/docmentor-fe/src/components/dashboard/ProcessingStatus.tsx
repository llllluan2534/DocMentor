import React from 'react';
import { useQuery } from '@/hooks/api/useQuery';
import { AlertCircle, Clock } from 'lucide-react';

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
  const { data = { processing: [], failed: [] }, loading } = useQuery({
    url: '/user/dashboard/processing-status',
    enabled: true,
  });

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Trạng thái xử lý
        </h3>
        <div className="text-center py-4 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  const { processing = [], failed = [] } = data as ProcessingStatus;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Processing */}
      <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
            Đang xử lý ({processing.length})
          </h3>
        </div>
        {processing.length === 0 ? (
          <p className="text-sm text-orange-700 dark:text-orange-200">
            Không có tài liệu nào đang xử lý
          </p>
        ) : (
          <div className="space-y-2">
            {processing.map((doc) => (
              <div
                key={doc.id}
                className="p-2 rounded bg-white/50 dark:bg-gray-800/50 text-sm text-orange-900 dark:text-orange-100"
              >
                <p className="font-medium truncate">{doc.title}</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">{doc.file_type}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failed */}
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Lỗi xử lý ({failed.length})
          </h3>
        </div>
        {failed.length === 0 ? (
          <p className="text-sm text-red-700 dark:text-red-200">
            Không có tài liệu nào bị lỗi
          </p>
        ) : (
          <div className="space-y-2">
            {failed.map((doc) => (
              <div
                key={doc.id}
                className="p-2 rounded bg-white/50 dark:bg-gray-800/50 text-sm text-red-900 dark:text-red-100"
              >
                <p className="font-medium truncate">{doc.title}</p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {doc.error || 'Lỗi không xác định'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
