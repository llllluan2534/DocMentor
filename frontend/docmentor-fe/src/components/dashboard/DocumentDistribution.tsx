// src/components/dashboard/DocumentDistribution.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@/hooks/api/useQuery";
import { API_ENDPOINTS } from "@/config/api";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export const DocumentDistribution: React.FC = () => {
  const { data, loading, error } = useQuery({
    url: API_ENDPOINTS.DASHBOARD.DOCUMENT_DISTRIBUTION,
    enabled: true,
  });

  // ✅ Fix: Handle null/undefined data
  const chartData = (data || []).map((item: any) => ({
    name: item.file_type || "Unknown",
    value: item.count,
  }));

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Phân bố tài liệu theo loại
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
          <div className="text-gray-500">Không có dữ liệu</div>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} tài liệu`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
