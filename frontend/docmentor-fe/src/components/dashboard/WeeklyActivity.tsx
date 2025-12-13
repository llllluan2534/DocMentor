import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@/hooks/api/useQuery';

export const WeeklyActivity: React.FC = () => {
  const { data, loading } = useQuery({
    url: '/user/dashboard/weekly-activity?days=7',
    enabled: true,
  });

  const chartData = data?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' }),
    queries: item.query_count,
    avgTime: Math.round(item.avg_execution_time_ms),
  })) || [];

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
        Hoạt động trong 7 ngày gần đây
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return value > 100 ? `${Math.round(value)}ms` : value;
                }
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="queries"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Số câu hỏi"
            />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Avg thời gian (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Không có dữ liệu hoạt động</div>
        </div>
      )}
    </div>
  );
};
