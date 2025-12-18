import React, { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard/dashboardService";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";
import { formatFileSize } from "@/utils/formatters";
import { Link } from "react-router-dom";

interface RecentDocument {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: string;
}

export const RecentDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getRecentDocuments(5);
        setDocuments(res);
      } catch (error) {
        console.error("Failed to load recent docs", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return <div className="h-64 bg-white/5 rounded-2xl animate-pulse"></div>;

  return (
    <div className="flex flex-col h-full p-6 border bg-accent/40 border-primary/10 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <FiFileText className="text-primary" /> Tài liệu gần đây
        </h3>
        <Link
          to="/user/documents"
          className="flex items-center gap-1 text-xs transition-colors text-primary hover:text-white"
        >
          Xem tất cả <FiArrowRight />
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-sm italic text-gray-500">
          Chưa có tài liệu nào
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3 flex items-center gap-3 bg-[#1A162D] border border-white/5 rounded-xl hover:border-primary/30 transition-all group"
            >
              <div className="p-2 text-blue-400 transition-colors rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20">
                <FiFileText size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate transition-colors group-hover:text-white">
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                  <span className="uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {doc.file_type}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>
              </div>

              <div className="pl-2 text-right">
                {doc.processed ? (
                  <div
                    className="p-1.5 rounded-full bg-green-500/10 text-green-500"
                    title="Đã xử lý"
                  >
                    <FiCheckCircle size={14} />
                  </div>
                ) : (
                  <div
                    className="p-1.5 rounded-full bg-orange-500/10 text-orange-500 animate-pulse"
                    title="Đang xử lý"
                  >
                    <FiClock size={14} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
