// src/services/document/documentService.ts
import { documentApiService } from "@/services/api/documentApiService";
import { Document, Folder } from "@/types/document.types";

interface GetDocumentsOptions {
  page?: number;
  limit?: number;
  query?: string;
  sort_by?: "date_desc" | "date_asc" | "title_asc" | "size_asc" | "size_desc";
  folderId?: string | number;
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

    const response = await documentApiService.uploadDocument(file, title);
    const doc = (response as any).document || response;

    return {
      id: String(doc.id), // Chắc chắn doc.id tồn tại
      title: doc.title,
      type: doc.file_type,
      fileSize: doc.file_size,
      uploadDate: doc.created_at,
      status: doc.processed ? "ready" : "processing",
      file_path: doc.file_path,
      processed: doc.processed,
      metadata: doc.metadata_,
    };
  },

  /**
   * 📋 Get user documents
   */
  getDocuments: async (
    options?: GetDocumentsOptions
  ): Promise<GetDocumentsResponse> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { data: [], total: 0 };
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const response = await documentApiService.getDocuments({
      skip,
      limit,
      search: options?.query,
      sort_by: options?.sort_by,
      folder_id: options?.folderId,
    });

    if (!response || !Array.isArray(response.documents)) {
      return { data: [], total: 0 };
    }

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

    return { data: documents, total: response.total };
  },

  getDocument: async (documentId: string): Promise<Document> => {
    if (USE_MOCK_MODE) {
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

    const response = await documentApiService.getDocument(documentId);
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
  },

  /**
   * 📥 Get document content/file
   * ✅ Fixed: Use documentApiService.downloadDocument which handles file_path
   */
  getDocumentContent: async (id: string): Promise<Blob> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return new Blob(["Mock content for testing"], { type: "text/plain" });
    }

    try {
      // Use the API service which handles file_path properly
      return await documentApiService.downloadDocument(id);
    } catch (error) {
      console.error("❌ getDocumentContent error:", error);
      throw error;
    }
  },

  renameDocument: async (
    documentId: string,
    newTitle: string
  ): Promise<Document> => {
    if (USE_MOCK_MODE) {
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

    const response = await documentApiService.updateDocument(
      documentId,
      newTitle
    );
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
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }
    await documentApiService.deleteDocument(documentId);
  },

  getDocumentStats: async () => {
    if (USE_MOCK_MODE)
      return {
        total_documents: 5,
        total_size: 5242880,
        by_type: { pdf: 3, docx: 2 },
        processed_count: 5,
        unprocessed_count: 0,
      };
    return documentApiService.getDocumentStats();
  },

  searchDocuments: async (query: string): Promise<GetDocumentsResponse> => {
    if (USE_MOCK_MODE) return { data: [], total: 0 };
    return documentService.getDocuments({ query });
  },

  // ============================================================
  // FOLDER METHODS
  // ============================================================

  getFolders: async (): Promise<Folder[]> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [];
    }
    const response = await documentApiService.getFolders();
    return response.folders || [];
  },

  createFolder: async (name: string, description?: string): Promise<Folder> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id: `folder-${Date.now()}`, name, description };
    }
    const response = await documentApiService.createFolder({
      name,
      description,
    });
    return response.folder;
  },

  renameFolder: async (
    folderId: string | number,
    newName: string
  ): Promise<Folder> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id: folderId, name: newName };
    }
    const response = await documentApiService.renameFolder(folderId, newName);
    return response.folder;
  },

  deleteFolder: async (folderId: string | number): Promise<void> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }
    await documentApiService.deleteFolder(folderId);
  },
};
