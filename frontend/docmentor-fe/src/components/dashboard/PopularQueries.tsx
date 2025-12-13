import React from 'react';
import { useQuery } from '@/hooks/api/useQuery';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PopularQuery {
  query_text: string;
  count: number;
  average_rating: number | null;
}

export const PopularQueries: React.FC = () => {
  const { data = [], loading } = useQuery({
    url: '/user/dashboard/popular-queries?limit=10',
    enabled: true,
  });

  const chartData = data
    .slice(0, 8)
    .map((item: PopularQuery) => ({
      query: item.query_text.length > 20 ? item.query_text.substring(0, 20) + '...' : item.query_text,
      count: item.count,
      rating: item.average_rating ? parseFloat(item.average_rating.toFixed(1)) : 0,
      fullQuery: item.query_text,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Câu hỏi phổ biến
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="query" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name) => {
                if (name === 'count') return [value, 'Số lần hỏi'];
                if (name === 'rating') return [value, 'Đánh giá TB'];
                return value;
              }}
              labelFormatter={(label) => `Query: ${label}`}
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
      ) : (
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Chưa có câu hỏi nào</div>
        </div>
      )}
    </div>
  );
};
