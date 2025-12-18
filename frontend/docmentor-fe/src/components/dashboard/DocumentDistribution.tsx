import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "@/services/dashboard/dashboardService";
import { FiPieChart } from "react-icons/fi";

const COLORS = ["#8A42FF", "#00D4FF", "#F59E0B", "#EF4444", "#10B981"];

export const DocumentDistribution: React.FC = () => {
  // ✅ Thay useQuery bằng state + useEffect
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getDocumentDistribution();
        setData(res);
      } catch (err) {
        console.error("Distribution Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = Array.isArray(data)
    ? data.map((item: any) => ({
        name: item.file_type?.toUpperCase() || "KHÁC",
        value: item.count || 0,
      }))
    : [];

  if (loading)
    return <div className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>;

  if (error || chartData.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-[#1A162D] rounded-2xl border border-white/5">
        <FiPieChart className="w-10 h-10 mb-3 text-gray-600" />
        <p className="text-sm text-gray-500">Chưa có dữ liệu phân bố</p>
      </div>
    );

  return (
    <div className="p-6 bg-[#1A162D]/50 border border-white/5 rounded-2xl backdrop-blur-sm h-full">
      <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-white">
        <FiPieChart className="text-primary" /> Phân bố tài liệu
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A162D",
                borderColor: "#8A42FF",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
