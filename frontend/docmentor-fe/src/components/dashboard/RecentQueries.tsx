// src/components/dashboard/RecentQueries.tsx
import React from "react";
import { useQuery } from "@/hooks/api/useQuery";
import { Clock, Star } from "lucide-react";
import { API_ENDPOINTS, buildQueryUrl } from "@/config/api";

interface RecentQuery {
  id: number;
  query_text: string;
  response_text: string | null;
  execution_time_ms: number;
  rating: number | null;
  created_at: string;
}

export const RecentQueries: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: buildQueryUrl(API_ENDPOINTS.DASHBOARD.RECENT_QUERIES, { limit: 10 }),
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data
  const queries = data || [];

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Câu hỏi gần đây
        </h3>
        <a
          href="/user/query-history"
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

      {!loading && !error && queries.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          Chưa có câu hỏi nào
        </div>
      )}

      {!loading && !error && queries.length > 0 && (
        <div className="space-y-3">
          {queries.map((query: RecentQuery) => (
            <div
              key={query.id}
              className="p-3 transition border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {query.query_text}
                  </p>
                  {query.response_text && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
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
