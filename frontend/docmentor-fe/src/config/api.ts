// src/config/api.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  DASHBOARD: {
    STATS: `${API_BASE_URL}/user/dashboard/stats`,
    DOCUMENT_DISTRIBUTION: `${API_BASE_URL}/user/dashboard/document-distribution`,
    WEEKLY_ACTIVITY: `${API_BASE_URL}/user/dashboard/weekly-activity`,
    POPULAR_QUERIES: `${API_BASE_URL}/user/dashboard/popular-queries`,
    PROCESSING_STATUS: `${API_BASE_URL}/user/dashboard/processing-status`,
    RECENT_DOCUMENTS: `${API_BASE_URL}/user/dashboard/recent-documents`,
    RECENT_QUERIES: `${API_BASE_URL}/user/dashboard/recent-queries`,
  },
};

export const buildQueryUrl = (
  baseUrl: string,
  params?: Record<string, any>
): string => {
  if (!params) return baseUrl;
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
