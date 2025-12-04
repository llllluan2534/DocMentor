// src/services/chat/chatService.ts - UPDATED for Backend Integration

import { ChatMessage, Conversation } from "@/types/chat.types";
import { queryApiService } from "@/services/api/queryApiService";

// ✨ SWITCH: Chuyển sang Real API
const USE_MOCK_MODE = false;

// ============================================================
// TYPES
// ============================================================

interface QueryResponse {
  query_id: number | null;
  query_text: string;
  answer: string;
  sources: Array<{
    document_id: number;
    document_title?: string;
    page_number?: number;
    similarity_score?: number;
    text?: string;
  }>;
  processing_time_ms: number;
  confidence_score: number;
  created_at: string;
}

interface SendMessageWithFilePayload {
  message: string;
  file?: File;
  conversationId?: string | null;
  sessionId?: string | null;
}

interface StartGuestSessionPayload {
  message: string;
  file?: File;
}

interface CreateNewConversationPayload {
  title: string;
  initialMessage: string;
  file?: File;
  documentIds?: (string | number)[]; // Cho phép cả string và number khi nhận
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const createMessage = (
  id: string,
  text: string,
  sender: "user" | "ai",
  file?: File
): ChatMessage => ({
  id,
  text,
  sender,
  timestamp: new Date().toISOString(),
  status: sender === "user" ? "sent" : undefined,
  attachment:
    file && sender === "user"
      ? {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }
      : undefined,
});

const convertToChatMessages = (query: QueryResponse): ChatMessage[] => {
  const messages: ChatMessage[] = []; // User message

  messages.push({
    id: `msg-user-${query.query_id}`,
    text: query.query_text,
    sender: "user",
    timestamp: query.created_at,
    status: "sent",
  }); // AI message

  messages.push({
    id: `msg-ai-${query.query_id}`,
    text: query.answer,
    sender: "ai",
    timestamp: query.created_at,
  });

  return messages;
};

// ============================================================
// CHAT SERVICE
// ============================================================

export const chatService = {
  queryDocuments: async (payload: {
    message: string;
    file?: File;
    docIds?: string[];
    conversationId?: number;
  }): Promise<QueryResponse> => {
    try {
      if (USE_MOCK_MODE) {
        console.log("🎭 MOCK MODE: Query response for:", payload.message);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock response
        return {
          query_id: Math.floor(Math.random() * 1000),
          query_text: payload.message,
          answer: "Mock response từ backend",
          sources: [],
          processing_time_ms: 1000,
          confidence_score: 0.95,
          created_at: new Date().toISOString(),
        };
      } // ✨ REAL API: Sử dụng queryApiService

      // FIX: Chuyển đổi ID từ string[] sang number[]
      const docIds = payload.docIds?.map((id) => parseInt(id, 10)) || [];
      const response = await queryApiService.sendQuery(
        payload.message,
        docIds, // Hàm này đã chấp nhận number[]
        5
      );

      return response;
    } catch (error) {
      console.error("❌ Query error:", error);
      throw error;
    }
  }, // ✨ UPDATED: Get Conversations

  getConversations: async (): Promise<Conversation[]> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [];
    }

    try {
      // ✨ REAL API: Get query history từ backend
      const history = await queryApiService.getQueryHistory({
        skip: 0,
        limit: 100,
        sort_by: "date",
        order: "desc",
      }); // ✨ MAP: Convert QueryResponse to Conversation

      const conversations: Conversation[] = history.queries.map((query) => ({
        id: query.query_id?.toString() || `query-${Date.now()}`,
        title:
          query.query_text.substring(0, 50) +
          (query.query_text.length > 50 ? "..." : ""),
        createdAt: query.created_at,
      }));

      return conversations;
    } catch (error) {
      console.error("❌ Get conversations error:", error);
      return [];
    }
  }, // ✨ UPDATED: Get Chat History - Từ query detail

  getChatHistory: async (conversationId: string): Promise<ChatMessage[]> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [];
    }

    try {
      // ✅ Xử lý ID local bắt đầu bằng "conv-"
      if (conversationId.startsWith("conv-")) {
        console.warn("⚠️ Local conversation ID detected:", conversationId);
        return []; // Trả về rỗng cho conversation local
      }

      // ✨ REAL API: Get query detail từ backend
      const queryId = parseInt(conversationId, 10);
      if (isNaN(queryId)) {
        console.warn("Invalid conversation ID:", conversationId);
        return [];
      }

      const query = await queryApiService.getQueryDetail(queryId);
      return convertToChatMessages(query);
    } catch (error) {
      console.error("❌ Get chat history error:", error);
      return [];
    }
  },


  sendMessage: async (
    _conversationId: string,
    messageText: string
  ): Promise<void> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    try {
      // ✨ REAL API: Send query to backend
      await queryApiService.sendQuery(messageText, [], 5);
    } catch (error) {
      console.error("❌ Send message error:", error);
      throw error;
    }
  }, // ✨ UPDATED: Send Message With File

  sendMessageWithFile: async (
    payload: SendMessageWithFilePayload
  ): Promise<ChatMessage> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return createMessage(`msg-ai-${Date.now()}`, "Mock response", "ai");
    }

    try {
      // ✨ REAL API: Send query with file
      const docIds: number[] = [];
      if (payload.conversationId) {
        docIds.push(parseInt(payload.conversationId, 10));
      }

      const response = await queryApiService.sendQuery(
        payload.message,
        docIds,
        5
      );

      const messages = convertToChatMessages(response);
      return messages[1]; // Return AI response
    } catch (error) {
      console.error("❌ Send message with file error:", error);
      throw error;
    }
  }, // ✨ UPDATED: Create New Conversation

  createNewConversation: async (
    payload: CreateNewConversationPayload
  ): Promise<Conversation> => {
    if (USE_MOCK_MODE) {
      await new Promise((res) => setTimeout(res, 1000));
      return {
        id: `conv-${Date.now()}`,
        title: payload.title,
        createdAt: new Date().toISOString(),
      };
    }

    try {
      // ✨ REAL API: Send initial query - create conversation
      const rawDocIds = payload.documentIds || [];

      // FIX: Chuyển đổi ID sang NUMBER và loại bỏ NaN
      const numericDocIds = rawDocIds
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((id): id is number => !isNaN(id)); // Đảm bảo chỉ còn number[]
      // Khởi tạo tin nhắn với tài liệu được chọn

      const initialMessage =
        payload.initialMessage ||
        `Bắt đầu trò chuyện với ${numericDocIds.length} tài liệu.`;

      const response = await queryApiService.sendQuery(
        initialMessage, // Dùng initialMessage
        numericDocIds, // Truyền mảng NUMBER IDs
        5
      );

      return {
        id: response.query_id?.toString() || `query-${Date.now()}`,
        title: payload.title,
        createdAt: response.created_at,
      };
    } catch (error) {
      console.error("❌ Create conversation error:", error);
      throw error;
    }
  }, // ✨ UPDATED: Start Guest Session

  startGuestSession: async (
    payload: StartGuestSessionPayload
  ): Promise<{ sessionId: string }> => {
    if (USE_MOCK_MODE) {
      await new Promise((res) => setTimeout(res, 1500));
      return { sessionId: `guest-session-${Date.now()}` };
    }

    try {
      // ✨ REAL API: Send initial query - guest session
      const response = await queryApiService.sendQuery(payload.message, [], 5);

      return { sessionId: response.query_id?.toString() || "" };
    } catch (error) {
      console.error("❌ Start guest session error:", error);
      throw error;
    }
  }, // ✨ NEW: Rename Conversation

  renameConversation: async (
    id: string,
    newTitle: string
  ): Promise<Conversation> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    } // ℹ️ Backend không có API rename hiện tại

    console.warn("⚠️ Rename conversation not supported by backend");

    return {
      id,
      title: newTitle,
      createdAt: new Date().toISOString(),
    };
  }, // ✨ NEW: Delete Conversation

  deleteConversation: async (id: string): Promise<void> => {
    if (USE_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return;
    }

    try {
      // ✨ REAL API: Delete query
      const queryId = parseInt(id, 10);
      if (!isNaN(queryId)) {
        await queryApiService.deleteQuery(queryId);
      }
    } catch (error) {
      console.error("❌ Delete conversation error:", error);
      throw error;
    }
  }, // ✨ NEW: Create Conversation With Context

  createConversationWithContext: async (
    docIds: string[]
  ): Promise<Conversation> => {
    if (USE_MOCK_MODE) {
      await new Promise((res) => setTimeout(res, 500));
      return {
        id: `conv-${Date.now()}`,
        title: `Trò chuyện về ${docIds.length} tài liệu`,
        createdAt: new Date().toISOString(),
      };
    }

    try {
      // FIX: Đảm bảo chuyển đổi ID từ string[] sang number[]
      const numericDocIds = docIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      const initialMessage = `Phân tích ${docIds.length} tài liệu`;

      const response = await queryApiService.sendQuery(
        initialMessage,
        numericDocIds, // Truyền mảng number[] đã được ép kiểu
        5
      );

      return {
        id: response.query_id?.toString() || `query-${Date.now()}`,
        title: `Trò chuyện về ${docIds.length} tài liệu`,
        createdAt: response.created_at,
      };
    } catch (error) {
      console.error("❌ Create conversation with context error:", error);
      throw error;
    }
  }, // ✨ NEW: Get Suggested Queries

  getSuggestedQueries: async (): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100)); // ℹ️ Suggestions từ frontend

    return [
      "Tóm tắt tài liệu này",
      "Những điểm chính là gì?",
      "Giải thích chi tiết hơn",
      "So sánh với...",
      "Tạo câu hỏi trắc nghiệm",
    ];
  }, // ✨ NEW: Load Chat History (Adapter)

  loadChatHistory: async (): Promise<ChatMessage[]> => {
    try {
      const conversations = await chatService.getConversations();
      const messages: ChatMessage[] = [];

      for (const conv of conversations) {
        const convMessages = await chatService.getChatHistory(conv.id);
        messages.push(...convMessages);
      }

      return messages;
    } catch (error) {
      console.error("❌ Load chat history error:", error);
      return [];
    }
  }, // ✨ NEW: Get Query Stats

  getQueryStats: async () => {
    try {
      return await queryApiService.getQueryStats();
    } catch (error) {
      console.error("❌ Get stats error:", error);
      return {
        total_queries: 0,
        avg_rating: 0,
        activity_last_7_days: [],
      };
    }
  }, // ✨ NEW: Submit Feedback

  submitFeedback: async (queryId: number, rating: number, text?: string) => {
    try {
      return await queryApiService.submitFeedback({
        query_id: queryId,
        rating,
        feedback_text: text,
      });
    } catch (error) {
      console.error("❌ Submit feedback error:", error);
      throw error;
    }
  }, // ✨ NEW: Get Feedback

  getFeedback: async (queryId: number) => {
    try {
      return await queryApiService.getFeedback(queryId);
    } catch (error) {
      console.error("❌ Get feedback error:", error);
      return null;
    }
  },
};
