import React from 'react';
import { useQuery } from '@/hooks/api/useQuery';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

interface RecentDocument {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: string;
}

export const RecentDocuments: React.FC = () => {
  const { data: documents = [], loading } = useQuery({
    url: '/user/dashboard/recent-documents?limit=5',
    enabled: true,
  });

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tài liệu gần đây
        </h3>
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tài liệu gần đây
        </h3>
        <a href="/user/documents" className="text-sm text-blue-600 hover:text-blue-700">
          Xem tất cả →
        </a>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có tài liệu nào
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: RecentDocument) => (
            <div
              key={doc.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle size={14} />
                      <span>Xong</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-600 text-xs font-medium">
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
