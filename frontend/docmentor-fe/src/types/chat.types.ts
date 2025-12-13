// src/types/chat.types.ts

// ✅ SourceReference interface - định nghĩa source tham khảo
export interface SourceReference {
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  similarityScore?: number;
}

// Alias for backward compatibility
export type ChatSource = SourceReference;

// ✅ ChatMessage interface - định nghĩa một tin nhắn trong chat
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  status?: "sent" | "error" | "sending" | "loading";

  // File attachments
  attachment?: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };

  // ✅ Documents được sử dụng để trả lời
  attachedDocuments?: Array<{
    id: string;
    title: string;
  }>;

  // ✅ Sources for AI responses
  sources?: SourceReference[];
}

// ✅ Conversation interface - định nghĩa một cuộc trò chuyện
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string;
  messageCount?: number;
  isPinned?: boolean;

  // ✅ Document info
  documents?: Array<{
    id: string | number;
    title: string;
  }>;
  documentCount?: number;
}

// ✨ Type alias for backward compatibility
export type Message = ChatMessage;
