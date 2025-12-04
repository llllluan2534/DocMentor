import { documentApiService } from "@/services/api/documentApiService";
import { Document } from "@/types/document.types";

interface GetDocumentsOptions {
  page?: number;
  limit?: number;
  query?: string;
  sort_by?: "date_desc" | "date_asc" | "title_asc" | "size_asc" | "size_desc";
}

interface GetDocumentsResponse {
  data: Document[];
  total: number;
}

// ============================================================
// MOCK MODE
// ============================================================

const USE_MOCK_MODE = false; // ✨ Set to false to use real API

// ============================================================
// DOCUMENT SERVICE
// ============================================================

export const documentService = {
  /**
   * 📤 Upload a document
   */
  uploadDocument: async (file: File, title?: string): Promise<Document> => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Upload document:", file.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        id: `doc-${Date.now()}`,
        title: title || file.name,
        type: file.type || "unknown",
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        status: "processing",
      };
    }

    try {
      console.log("📤 Uploading document to backend:", file.name);

      const response = await documentApiService.uploadDocument(file, title); // ✨ MAP: Convert API response (DocumentResponse) to Document type (local)

      const doc = response.document;

      return {
        id: doc.id,
        title: doc.title,
        type: doc.file_type,
        fileSize: doc.file_size,
        uploadDate: doc.created_at,
        status: doc.processed ? "ready" : "processing",
        file_path: doc.file_path,
        processed: doc.processed,
        metadata: doc.metadata_,
      };
    } catch (error) {
      console.error("❌ Upload failed:", error);
      throw error;
    }
  } /**
   * 📋 Get user documents
   */,

  getDocuments: async (
  options?: GetDocumentsOptions
): Promise<GetDocumentsResponse> => {
  if (USE_MOCK_MODE) {
    console.log("🎭 MOCK MODE: Get documents");
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: [],
      total: 0,
    };
  }

  try {
    console.log("📤 Fetching documents:", options);

    // ✅ FIX: Sửa công thức tính skip
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit; // ✅ Đúng công thức

    console.log("🔢 Pagination:", { page, limit, skip });

    const response = await documentApiService.getDocuments({
      skip,
      limit,
      search: options?.query,
      sort_by: options?.sort_by,
    });

    console.log("📦 Raw API Response:", response);

    // ✅ Kiểm tra response có hợp lệ không
    if (!response || !Array.isArray(response.documents)) {
      console.error("❌ Invalid response format:", response);
      return { data: [], total: 0 };
    }

    // Map documents
    const documents: Document[] = response.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.file_type,
      fileSize: doc.file_size,
      uploadDate: doc.created_at,
      status: doc.processed ? "ready" : "processing",
      file_path: doc.file_path,
      processed: doc.processed,
      metadata: doc.metadata_,
    }));

    console.log("✅ Transformed documents:", documents.length);

    return {
      data: documents,
      total: response.total,
    };
  } catch (error: any) {
    console.error("❌ Get documents failed:", error);
    
    // ✅ Rethrow lỗi để DocumentsPage xử lý
    throw error;
  }
} /**
   * 🔍 Get single document
   */,

  getDocument: async (documentId: string): Promise<Document> => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Get document:", documentId);
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        id: documentId,
        title: "Mock Document",
        type: "pdf",
        fileSize: 1024000,
        uploadDate: new Date().toISOString(),
        status: "ready",
      };
    }

    try {
      console.log("📤 Fetching document:", documentId);

      const response = await documentApiService.getDocument(documentId); // ✨ MAP: Convert API response to Document

      return {
        id: response.id,
        title: response.title,
        type: response.file_type,
        fileSize: response.file_size,
        uploadDate: response.created_at,
        status: response.processed ? "ready" : "processing",
        file_path: response.file_path,
        processed: response.processed,
        metadata: response.metadata_,
      };
    } catch (error) {
      console.error("❌ Get document failed:", error);
      throw error;
    }
  } /**
   * ✏️ Rename document
   */,

  renameDocument: async (
    documentId: string,
    newTitle: string
  ): Promise<Document> => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Rename document:", documentId, newTitle);
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        id: documentId,
        title: newTitle,
        type: "pdf",
        fileSize: 1024000,
        uploadDate: new Date().toISOString(),
        status: "ready",
      };
    }

    try {
      console.log("📤 Renaming document:", { documentId, newTitle });

      const response = await documentApiService.updateDocument(
        documentId,
        newTitle
      ); // ✨ MAP: Convert API response to Document

      return {
        id: response.id,
        title: response.title,
        type: response.file_type,
        fileSize: response.file_size,
        uploadDate: response.created_at,
        status: response.processed ? "ready" : "processing",
        file_path: response.file_path,
        processed: response.processed,
        metadata: response.metadata_,
      };
    } catch (error) {
      console.error("❌ Rename document failed:", error);
      throw error;
    }
  } /**
   * 🗑️ Delete document
   */,

  deleteDocument: async (documentId: string): Promise<void> => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Delete document:", documentId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    try {
      console.log("📤 Deleting document:", documentId);
      await documentApiService.deleteDocument(documentId);
      console.log("✓ Document deleted:", documentId);
    } catch (error) {
      console.error("❌ Delete document failed:", error);
      throw error;
    }
  } /**
   * 📊 Get document statistics
   */,

  getDocumentStats: async () => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Get document stats");
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        total_documents: 5,
        total_size: 5242880,
        by_type: { pdf: 3, docx: 2 },
        processed_count: 5,
        unprocessed_count: 0,
      };
    }

    try {
      console.log("📤 Fetching document stats");
      return await documentApiService.getDocumentStats();
    } catch (error) {
      console.error("❌ Get stats failed:", error);
      return {
        total_documents: 0,
        total_size: 0,
        by_type: {},
        processed_count: 0,
        unprocessed_count: 0,
      };
    }
  } /**
   * 📁 Search documents
   */,

  searchDocuments: async (query: string): Promise<GetDocumentsResponse> => {
    if (USE_MOCK_MODE) {
      console.log("🎭 MOCK MODE: Search documents:", query);
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        data: [],
        total: 0,
      };
    }

    try {
      console.log("📤 Searching documents:", query);
      return await documentService.getDocuments({ query });
    } catch (error) {
      console.error("❌ Search documents failed:", error);
      throw error;
    }
  },
};
