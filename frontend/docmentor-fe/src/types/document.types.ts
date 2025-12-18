// src/types/document.types.ts

export interface Document {
  id: string | number;
  title: string;
  type: string; // pdf, docx, txt, pptx, etc.
  fileSize: number; // bytes
  uploadDate: string; // ISO datetime
  status: "ready" | "processing" | "failed";
  folderId?: string | number; // ✨ New: folder reference

  // Optional fields from API
  file_path?: string;
  processed?: boolean;
  metadata?: Record<string, any>;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  summary?: string;
}

export interface Folder {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  documentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentFilter {
  type?: string;
  status?: string;
  dateRange?: "all" | "today" | "week" | "month" | "3months";
  folderId?: string | number; // ✨ New: filter by folder
  sortBy?: "date_desc" | "date_asc" | "title_asc" | "size_asc" | "size_desc";
}

export interface DocumentStats {
  total_documents: number;
  total_size: number;
  by_type: Record<string, number>;
  by_folder: Record<string, number>;
  processed_count: number;
  unprocessed_count: number;
}
