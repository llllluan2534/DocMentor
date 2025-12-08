// ============================================================
// FILE: types/chat.types.ts
// ============================================================

// ✅ SourceReference interface - định nghĩa source tham khảo
export interface SourceReference {
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
}

// ✅ ChatMessage interface - định nghĩa một tin nhắn trong chat
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  sources?: SourceReference[];
  status?: "sent" | "error" | "sending" | "loading";

  attachment?: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };

  // ✅ THÊM MỚI: Documents được sử dụng để trả lời
  attachedDocuments?: Array<{
    id: string;
    title: string;
  }>;
}

// ✅ Conversation interface - định nghĩa một cuộc trò chuyện
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

// ✨ Type alias for backward compatibility
export type Message = ChatMessage;
