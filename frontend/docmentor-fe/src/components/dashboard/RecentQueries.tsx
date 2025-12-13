import React from 'react';
import { useQuery } from '@/hooks/api/useQuery';
import { Clock, Star } from 'lucide-react';

interface RecentQuery {
  id: number;
  query_text: string;
  response_text: string | null;
  execution_time_ms: number;
  rating: number | null;
  created_at: string;
}

export const RecentQueries: React.FC = () => {
  const { data: queries = [], loading } = useQuery({
    url: '/user/dashboard/recent-queries?limit=10',
    enabled: true,
  });

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Câu hỏi gần đây
        </h3>
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Câu hỏi gần đây
        </h3>
        <a href="/user/query-history" className="text-sm text-blue-600 hover:text-blue-700">
          Xem tất cả →
        </a>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có câu hỏi nào
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map((query: RecentQuery) => (
            <div
              key={query.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {query.query_text}
                  </p>
                  {query.response_text && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {query.response_text}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {query.execution_time_ms}ms
                    </span>
                    {query.rating && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star size={12} fill="currentColor" />
                        {query.rating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
