import React, { useEffect, useState } from "react";
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
import { dashboardService } from "@/services/dashboard/dashboardService";
import { FiTrendingUp } from "react-icons/fi";

interface PopularQuery {
  query_text: string;
  count: number;
  average_rating: number | null;
}

export const PopularQueries: React.FC = () => {
  const [data, setData] = useState<PopularQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getPopularQueries(10);
        setData(res);
      } catch (err) {
        console.error("Popular Queries Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = (data || []).slice(0, 8).map((item) => ({
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

  if (loading)
    return <div className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>;

  if (chartData.length === 0)
    return (
      <div className="p-6 bg-[#1A162D]/50 border border-white/5 rounded-2xl flex items-center justify-center h-80 text-gray-500">
        Chưa có câu hỏi nào
      </div>
    );

  return (
    <div className="p-6 bg-[#1A162D]/50 border border-white/5 rounded-2xl backdrop-blur-sm">
      <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-white">
        <FiTrendingUp className="text-primary" /> Câu hỏi phổ biến
      </h3>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="query"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "#1A162D",
                border: "1px solid #8A42FF",
                borderRadius: "12px",
                color: "#fff",
              }}
              labelStyle={{
                color: "#A9A5B8",
                marginBottom: "0.5rem",
                fontSize: "0.8rem",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              dataKey="count"
              fill="#3B82F6"
              name="Số lần hỏi"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar
              dataKey="rating"
              fill="#10B981"
              name="Đánh giá TB"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
