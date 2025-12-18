import React, { useEffect, useState } from "react";
import { useQuery } from "@/hooks/api/useQuery";
import {
  FileText,
  MessageSquare,
  MessageCircle,
  Star,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  StatBox,
  DocumentDistribution,
  WeeklyActivity,
  RecentQueries,
  RecentDocuments,
  PopularQueries,
  ProcessingStatus,
} from "@/components/dashboard";
import { formatFileSize } from "@/utils/formatters";
import { API_ENDPOINTS } from "@/config/api";

interface DashboardStats {
  documents: {
    total: number;
    processed: number;
    unprocessed: number;
    total_size_bytes: number;
    by_type: Record<string, number>;
  };
  queries: {
    total: number;
    avg_execution_time_ms: number;
    total_execution_time_ms: number;
  };
  conversations: {
    total: number;
  };
  feedback: {
    total: number;
    average_rating: number;
    positive_feedbacks: number;
    positive_percentage: number;
  };
}

const SkeletonStatBox = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="w-16 h-8 mt-3 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
    </div>
  </div>
);

const UserDashboardPage: React.FC = () => {
  const {
    data: stats,
    loading,
    error,
    refetch,
  } = useQuery({
    url: API_ENDPOINTS.DASHBOARD.STATS,
    enabled: true,
  });

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );

  useEffect(() => {
    if (stats) {
      setDashboardStats(stats);
    }
  }, [stats]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-red-600 dark:text-red-400 mt-0.5"
                size={24}
              />
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
                  Không thể tải dữ liệu Dashboard
                </h3>
                <p className="mb-4 text-sm text-red-700 dark:text-red-300">
                  {error.message}
                </p>
                <button
                  onClick={refetch}
                  className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <RefreshCw size={16} />
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-8 animate-pulse">
            <div className="w-48 h-10 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-64 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStatBox key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <SkeletonStatBox key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="p-12 text-center bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <FileText size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Chưa có dữ liệu
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Bắt đầu bằng cách tải lên tài liệu hoặc đặt câu hỏi
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Tổng quan hoạt động của bạn
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 transition-all bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Làm mới
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <StatBox
            title="Tài liệu"
            value={dashboardStats.documents.total}
            unit="tài liệu"
            icon={<FileText size={24} />}
            color="blue"
          />
          <StatBox
            title="Câu hỏi"
            value={dashboardStats.queries.total}
            unit="câu hỏi"
            icon={<MessageSquare size={24} />}
            color="green"
          />
          <StatBox
            title="Cuộc hội thoại"
            value={dashboardStats.conversations.total}
            unit="cuộc"
            icon={<MessageCircle size={24} />}
            color="purple"
          />
          <StatBox
            title="Đánh giá TB"
            value={
              dashboardStats.feedback.average_rating > 0
                ? dashboardStats.feedback.average_rating.toFixed(1)
                : "N/A"
            }
            unit={dashboardStats.feedback.average_rating > 0 ? "/5 ⭐" : ""}
            icon={<Star size={24} />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-3 md:gap-6">
          <StatBox
            title="Tài liệu đã xử lý"
            value={dashboardStats.documents.processed}
            unit={`/ ${dashboardStats.documents.total}`}
            color="green"
          />
          <StatBox
            title="Dung lượng sử dụng"
            value={formatFileSize(dashboardStats.documents.total_size_bytes)}
            color="blue"
          />
          <StatBox
            title="Phản hồi tích cực"
            value={`${dashboardStats.feedback.positive_percentage || 0}%`}
            unit={`(${dashboardStats.feedback.positive_feedbacks} feedback)`}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-2 md:gap-6">
          <DocumentDistribution />
          <WeeklyActivity />
        </div>

        <div className="mb-8">
          <PopularQueries />
        </div>

        <div className="mb-8">
          <ProcessingStatus />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
          <RecentDocuments />
          <RecentQueries />
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
