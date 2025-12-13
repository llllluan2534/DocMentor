// src/components/dashboard/WeeklyActivity.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@/hooks/api/useQuery";
import { API_ENDPOINTS, buildQueryUrl } from "@/config/api";

export const WeeklyActivity: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: buildQueryUrl(API_ENDPOINTS.DASHBOARD.WEEKLY_ACTIVITY, { days: 7 }),
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data
  const chartData = (data || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    }),
    queries: item.query_count,
    avgTime: Math.round(item.avg_execution_time_ms),
  }));

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Hoạt động trong 7 ngày gần đây
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
          <div className="text-gray-500">Không có dữ liệu hoạt động</div>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="queries"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Số câu hỏi"
            />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              name="Thời gian TB (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
