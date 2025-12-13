// src/components/dashboard/PopularQueries.tsx
import React from "react";
import { useQuery } from "@/hooks/api/useQuery";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { API_ENDPOINTS, buildQueryUrl } from "@/config/api";

interface PopularQuery {
  query_text: string;
  count: number;
  average_rating: number | null;
}

export const PopularQueries: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: buildQueryUrl(API_ENDPOINTS.DASHBOARD.POPULAR_QUERIES, { limit: 10 }),
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data
  const chartData = (data || []).slice(0, 8).map((item: PopularQuery) => ({
    query:
      item.query_text.length > 20
        ? item.query_text.substring(0, 20) + "..."
        : item.query_text,
    count: item.count,
    rating: item.average_rating
      ? parseFloat(item.average_rating.toFixed(1))
      : 0,
    fullQuery: item.query_text,
  }));

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Câu hỏi phổ biến
      </h3>

      {loading && (
        <div className="flex items-center justify-center h-80">
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className="mb-2 text-red-500">Lỗi tải dữ liệu</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Chưa có câu hỏi nào</div>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="query" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value, name) => {
                if (name === "count") return [value, "Số lần hỏi"];
                if (name === "rating") return [value, "Đánh giá TB"];
                return value;
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              name="Số lần hỏi"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="rating"
              fill="#10b981"
              name="Đánh giá TB"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
