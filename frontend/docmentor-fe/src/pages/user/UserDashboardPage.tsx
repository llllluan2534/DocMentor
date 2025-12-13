import React, { useEffect, useState } from 'react';
import { useQuery } from '@/hooks/api/useQuery';
import {
  FileText,
  MessageSquare,
  MessageCircle,
  Star,
} from 'lucide-react';
import {
  StatBox,
  DocumentDistribution,
  WeeklyActivity,
  RecentQueries,
  RecentDocuments,
  PopularQueries,
  ProcessingStatus,
} from '@/components/dashboard';
import { formatFileSize } from '@/utils/formatters';

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

const UserDashboardPage: React.FC = () => {
  const { data: stats, loading } = useQuery({
    url: '/user/dashboard/stats',
    enabled: true,
  });

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (stats) {
      setDashboardStats(stats);
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin inline-flex items-center justify-center w-12 h-12 rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Đang tải dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            Không thể tải dữ liệu dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Tổng quan hoạt động của bạn
          </p>
        </div>

        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            title="Đánh giá trung bình"
            value={dashboardStats.feedback.average_rating.toFixed(1)}
            unit="/5 ⭐"
            icon={<Star size={24} />}
            color="orange"
          />
        </div>

        {/* Detail Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
            value={`${dashboardStats.feedback.positive_percentage}%`}
            unit={`(${dashboardStats.feedback.positive_feedbacks} feedback)`}
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DocumentDistribution />
          <WeeklyActivity />
        </div>

        {/* Popular Queries */}
        <div className="mb-8">
          <PopularQueries />
        </div>

        {/* Processing Status */}
        <div className="mb-8">
          <ProcessingStatus />
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentDocuments />
          <RecentQueries />
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
