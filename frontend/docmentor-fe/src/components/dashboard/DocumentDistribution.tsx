import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@/hooks/api/useQuery';

interface DocumentDistributionProps {
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const DocumentDistribution: React.FC<DocumentDistributionProps> = () => {
  const { data, loading } = useQuery({
    url: '/user/dashboard/document-distribution',
    enabled: true,
  });

  const chartData = data?.map((item: any) => ({
    name: item.file_type || 'Unknown',
    value: item.count,
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-500">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Phân bố tài liệu theo loại
      </h3>
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} tài liệu`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
