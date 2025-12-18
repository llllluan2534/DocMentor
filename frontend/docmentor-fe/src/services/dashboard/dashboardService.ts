// src/services/dashboard/dashboardService.ts

import apiClient from "@/services/api/apiClient"; 

// --- TYPES ---
export interface DashboardStats {
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

export interface ProcessingStatusData {
  processing: Array<{
    id: number;
    title: string;
    file_type: string;
    created_at: string;
  }>;
  failed: Array<{
    id: number;
    title: string;
    file_type: string;
    error: string | null;
    created_at: string;
  }>;
}

// --- SERVICE ---
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>(
      "/user/dashboard/stats"
    );
    return response.data;
  },

  getDocumentDistribution: async () => {
    const response = await apiClient.get(
      "/user/dashboard/document-distribution"
    );
    return response.data;
  },

  getProcessingStatus: async (): Promise<ProcessingStatusData> => {
    const response = await apiClient.get<ProcessingStatusData>(
      "/user/dashboard/processing-status"
    );
    return response.data;
  },

  getPopularQueries: async (limit = 10) => {
    const response = await apiClient.get(
      `/user/dashboard/popular-queries?limit=${limit}`
    );
    return response.data;
  },

  getRecentDocuments: async (limit = 5) => {
    const response = await apiClient.get(
      `/user/dashboard/recent-documents?limit=${limit}`
    );
    return response.data;
  },

  getRecentQueries: async (limit = 10) => {
    const response = await apiClient.get(
      `/user/dashboard/recent-queries?limit=${limit}`
    );
    return response.data;
  },

  getWeeklyActivity: async (days = 7) => {
    const response = await apiClient.get(
      `/user/dashboard/weekly-activity?days=${days}`
    );
    return response.data;
  },
};
