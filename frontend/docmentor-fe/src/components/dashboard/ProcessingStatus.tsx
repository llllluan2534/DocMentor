import React, { useEffect, useState } from "react";
import {
  dashboardService,
  ProcessingStatusData,
} from "@/services/dashboard/dashboardService";
import { FiLoader, FiAlertCircle, FiClock, FiFileText } from "react-icons/fi";

export const ProcessingStatus: React.FC = () => {
  const [data, setData] = useState<ProcessingStatusData>({
    processing: [],
    failed: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getProcessingStatus();
        setData(res);
      } catch (err) {
        console.error("Processing Status Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { processing, failed } = data;

  if (loading)
    return <div className="h-40 bg-white/5 rounded-2xl animate-pulse"></div>;

  if (processing.length === 0 && failed.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
      {/* Cột Đang Xử Lý */}
      <div className="p-6 border bg-blue-500/5 border-blue-500/10 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 text-blue-400 border rounded-lg bg-blue-500/10 border-blue-500/20">
            <FiLoader className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Đang xử lý ({processing.length})
          </h3>
        </div>

        {processing.length === 0 ? (
          <p className="py-4 text-sm italic text-center text-gray-500">
            Hệ thống đang rảnh rỗi
          </p>
        ) : (
          <div className="space-y-3">
            {processing.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-[#1A162D] rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-bold text-blue-400 uppercase border border-blue-500/30 px-1.5 py-0.5 rounded">
                    {doc.file_type}
                  </span>
                  <span className="text-sm text-gray-300 truncate">
                    {doc.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cột Lỗi */}
      {failed.length > 0 && (
        <div className="p-6 border bg-red-500/5 border-red-500/10 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 text-red-400 border rounded-lg bg-red-500/10 border-red-500/20">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Xử lý thất bại ({failed.length})
            </h3>
          </div>

          <div className="space-y-3">
            {failed.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-[#1A162D] rounded-xl border border-red-500/20"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="pr-2 text-sm font-medium text-gray-200 truncate">
                    {doc.title}
                  </span>
                  <span className="text-[10px] text-red-400 uppercase border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded-full">
                    {doc.file_type}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
                  <FiAlertCircle size={12} className="flex-shrink-0" />
                  {doc.error || "Lỗi không xác định"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
