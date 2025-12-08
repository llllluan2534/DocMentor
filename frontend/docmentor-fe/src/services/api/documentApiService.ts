// src/services/api/documentApiService.ts
import axios, { AxiosInstance } from "axios";

// ============================================================
// TYPES
// ============================================================

export interface DocumentResponse {
  id: string | number;
  user_id: number;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  metadata_?: Record<string, any>;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  total: number;
  documents: DocumentResponse[];
}

export interface DocumentUploadResponse {
  message: string;
  document: DocumentResponse;
}

export interface DocumentStatsResponse {
  total_documents: number;
  total_size: number;
  by_type: Record<string, number>;
  processed_count: number;
  unprocessed_count: number;
}

export interface DocumentFilters {
  skip?: number;
  limit?: number;
  search?: string;
  file_type?: string;
  sort_by?: "date_desc" | "date_asc" | "title_asc" | "size_asc" | "size_desc";
  folder_id?: string | number;
}

export interface FolderResponse {
  id: string | number;
  name: string;
  description?: string;
}

export interface FolderListResponse {
  folders: FolderResponse[];
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// ============================================================
// DOCUMENT & FOLDER API SERVICE
// ============================================================

class DocumentApiService {
  private axiosInstance: AxiosInstance;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      (import.meta as any).env?.VITE_API_BASE_URL ||
      "https://docmentor-api.onrender.com";

    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: any) => {
        const apiError: ApiError = {
          status: error.response?.status || 500,
          message: error.message,
          detail: error.response?.data?.detail || error.response?.statusText,
        };
        console.error("API Error:", apiError);
        return Promise.reject(apiError);
      }
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private getAuthToken(): string | null {
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  }

  private handleError(error: any): never {
    if (error.status && error.message) throw error;
    throw { status: 500, message: "Unknown error", detail: error.message };
  }

  // ============================================================
  // DOCUMENT METHODS
  // ============================================================

  async uploadDocument(
    file: File,
    title?: string
  ): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);

      const token = this.getAuthToken();
      if (!token) throw { status: 401, message: "No auth token" };

      const response = await fetch(`${this.apiBaseUrl}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: "Upload failed",
          detail: err.detail || err.message,
        };
      }

      return await response.json();
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocuments(filters?: DocumentFilters): Promise<DocumentListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.skip !== undefined)
        params.append("skip", filters.skip.toString());
      if (filters?.limit !== undefined)
        params.append("limit", filters.limit.toString());
      if (filters?.search) params.append("search", filters.search);
      if (filters?.file_type) params.append("file_type", filters.file_type);
      if (filters?.sort_by) params.append("sort_by", filters.sort_by);
      if (filters?.folder_id)
        params.append("folder_id", filters.folder_id.toString());

      const res = await this.axiosInstance.get<DocumentListResponse>(
        `/documents/?${params.toString()}`
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocument(documentId: string): Promise<DocumentResponse> {
    try {
      const res = await this.axiosInstance.get<DocumentResponse>(
        `/documents/${documentId}`
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const res = await this.axiosInstance.get(
        `/documents/${documentId}/download`,
        {
          responseType: "blob",
        }
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDocument(
    documentId: string,
    title?: string,
    metadata?: Record<string, any>
  ): Promise<DocumentResponse> {
    try {
      const res = await this.axiosInstance.put<DocumentResponse>(
        `/documents/${documentId}`,
        { title, metadata }
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/documents/${documentId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentStats(): Promise<DocumentStatsResponse> {
    try {
      const res =
        await this.axiosInstance.get<DocumentStatsResponse>("/documents/stats");
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============================================================
  // FOLDER METHODS
  // ============================================================

  async getFolders(): Promise<FolderListResponse> {
    try {
      const res = await this.axiosInstance.get<FolderListResponse>("/folders");
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createFolder(data: {
    name: string;
    description?: string;
  }): Promise<{ folder: FolderResponse }> {
    try {
      const res = await this.axiosInstance.post<{ folder: FolderResponse }>(
        "/folders",
        data
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async renameFolder(
    folderId: string | number,
    newName: string
  ): Promise<{ folder: FolderResponse }> {
    try {
      const res = await this.axiosInstance.put<{ folder: FolderResponse }>(
        `/folders/${folderId}`,
        { name: newName }
      );
      return res.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteFolder(folderId: string | number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/folders/${folderId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  setAuthToken(token: string, persistent: boolean = false) {
    if (persistent) {
      localStorage.setItem("auth_token", token);
      sessionStorage.removeItem("auth_token");
    } else {
      sessionStorage.setItem("auth_token", token);
      localStorage.removeItem("auth_token");
    }
  }

  clearAuthToken() {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const documentApiService = new DocumentApiService();
