import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "@/services/dashboard/dashboardService";
import { FiActivity } from "react-icons/fi";

export const WeeklyActivity: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getWeeklyActivity(7);
        setData(res);
      } catch (err) {
        console.error("Weekly Activity Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = (data || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
    }),
    queries: item.query_count,
  }));

  if (loading)
    return <div className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>;
  if (chartData.length === 0) return null;

  return (
    <div className="p-6 bg-[#1A162D]/50 border border-white/5 rounded-2xl backdrop-blur-sm">
      <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-white">
        <FiActivity className="text-green-400" /> Hoạt động tuần qua
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A162D",
                border: "1px solid #10B981",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="queries"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Số câu hỏi"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
