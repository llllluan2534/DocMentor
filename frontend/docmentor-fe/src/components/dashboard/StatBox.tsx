import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatBoxProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  // Chỉ chấp nhận các key màu định sẵn
  color?: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
}

// ✅ Định nghĩa style đẹp tại đây (Single Source of Truth)
const colorVariants = {
  blue: {
    wrapper: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-500",
    iconBg: "bg-blue-500/20",
  },
  green: {
    wrapper: "bg-green-500/10 border-green-500/20",
    text: "text-green-500",
    iconBg: "bg-green-500/20",
  },
  purple: {
    wrapper: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-500",
    iconBg: "bg-purple-500/20",
  },
  orange: {
    wrapper: "bg-orange-500/10 border-orange-500/20",
    text: "text-orange-500",
    iconBg: "bg-orange-500/20",
  },
  yellow: {
    wrapper: "bg-yellow-500/10 border-yellow-500/20",
    text: "text-yellow-500",
    iconBg: "bg-yellow-500/20",
  },
  red: {
    wrapper: "bg-red-500/10 border-red-500/20",
    text: "text-red-500",
    iconBg: "bg-red-500/20",
  },
};

export const StatBox: React.FC<StatBoxProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  color = "blue",
}) => {
  // Lấy style tương ứng với màu được chọn
  const variant = colorVariants[color] || colorVariants.blue;

  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${variant.wrapper}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>

          {/* Trend Section (Optional) */}
          {trend && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
            >
              {trend.isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>
                {trend.value}% {trend.isPositive ? "tăng" : "giảm"}
              </span>
            </div>
          )}
        </div>

        {/* Icon Section */}
        {icon && (
          <div className={`rounded-xl p-3 ${variant.iconBg} ${variant.text}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
