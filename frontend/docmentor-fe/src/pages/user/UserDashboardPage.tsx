import React, { useEffect, useState } from "react";
import {
  FiFileText,
  FiMessageSquare,
  FiMessageCircle,
  FiStar,
  FiRefreshCw,
} from "react-icons/fi";
import { StatBox } from "@/components/dashboard/StatBox";
import { DocumentDistribution } from "@/components/dashboard/DocumentDistribution";
import { ProcessingStatus } from "@/components/dashboard/ProcessingStatus";
// Import service mới tạo
import {
  dashboardService,
  DashboardStats,
} from "@/services/dashboard/dashboardService";

const UserDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm tải dữ liệu dùng service chuẩn
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Gọi qua apiClient (có token) nên sẽ không bị lỗi CORS/500 nữa
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Dashboard Error:", err);
      // Nếu apiClient đã bắt lỗi 401 thì nó tự redirect, ở đây chỉ catch lỗi mạng khác
      setError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefetch = () => {
    fetchData();
    // Trick nhỏ để refresh các component con (vì chúng tự gọi API riêng)
    // Cách tốt nhất là dùng React Context hoặc Redux, nhưng reload nhanh gọn cho project này:
    window.location.reload();
  };

  if (error) {
    return (
      <div className="p-8 text-center min-h-screen bg-[#100D20] pt-24">
        <p className="mb-4 text-red-400">{error}</p>
        <button
          onClick={handleRefetch}
          className="px-4 py-2 text-white rounded-lg bg-primary hover:bg-primary/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100D20] p-6 lg:p-10 pt-24 text-white">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-10 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Xin chào 👋
          </h1>
          <p className="text-sm text-gray-400">
            Đây là tổng quan hoạt động học tập của bạn.
          </p>
        </div>
        <button
          onClick={handleRefetch}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 transition-all border bg-white/5 hover:bg-white/10 border-white/10 rounded-xl hover:text-white"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          title="Tài liệu"
          value={stats?.documents.total || 0}
          icon={<FiFileText className="w-6 h-6" />}
          color="blue"
        />
        <StatBox
          title="Câu hỏi"
          value={stats?.queries.total || 0}
          icon={<FiMessageSquare className="w-6 h-6" />}
          color="green"
        />
        <StatBox
          title="Hội thoại"
          value={stats?.conversations.total || 0}
          icon={<FiMessageCircle className="w-6 h-6" />}
          color="purple"
        />
        <StatBox
          title="Đánh giá"
          value={
            stats?.feedback.average_rating
              ? stats.feedback.average_rating.toFixed(1)
              : "N/A"
          }
          unit="/ 5.0"
          icon={<FiStar className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Status */}
        <div className="space-y-8 lg:col-span-2">
          <ProcessingStatus />
          {/* Có thể thêm RecentDocuments, WeeklyActivity ở đây */}
        </div>

        {/* Right: Charts */}
        <div className="space-y-8">
          <DocumentDistribution />

          {/* Storage Box */}
          <div className="p-6 border bg-blue-500/5 border-blue-500/20 rounded-2xl">
            <h3 className="mb-2 font-bold text-gray-200">Dung lượng</h3>
            <div className="mb-2 text-2xl font-bold text-white">
              {stats
                ? (stats.documents.total_size_bytes / 1024 / 1024).toFixed(2)
                : 0}{" "}
              MB
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: "10%" }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Giới hạn 100MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
