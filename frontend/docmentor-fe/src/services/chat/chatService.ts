// src/services/chat/chatService.ts

import { ChatMessage, Conversation } from "@/types/chat.types";
import { queryApiService } from "@/services/api/queryApiService";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ============================================================
// AXIOS INSTANCE FOR CONVERSATIONS
// ============================================================
const conversationApi = axios.create({
  baseURL: `${API_BASE_URL}/conversations`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

conversationApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");

    console.log("🔐 Conversation API Request:", {
      url: config.url,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + "..." : "none",
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No auth token found!");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

conversationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ Conversation API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error("🔒 Unauthorized - Token may be invalid or expired");
      console.log(
        "Current token:",
        localStorage.getItem("auth_token")?.substring(0, 20)
      );
    }

    return Promise.reject(error);
  }
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const convertToChatMessages = (queries: any[]): ChatMessage[] => {
  const messages: ChatMessage[] = [];

  queries.forEach((query) => {
    // User message
    // 1. ✅ KHAI BÁO BIẾN Ở ĐÂY (Map dữ liệu từ backend)
    // Giả sử backend trả về field 'documents' là mảng các file
    const attachedDocs =
      query.documents?.map((doc: any) => ({
        id: doc.id.toString(),
        title: doc.title,
      })) || [];
    messages.push({
      id: `msg-user-${query.id}`,
      text: query.query_text,
      sender: "user",
      timestamp: query.created_at,
      status: "sent",
      attachedDocuments: attachedDocs.length > 0 ? attachedDocs : undefined,
    });

    // AI message
    if (query.response_text) {
      messages.push({
        id: `msg-ai-${query.id}`,
        text: query.response_text,
        sender: "ai",
        timestamp: query.created_at,
      });
    }
  });

  return messages;
};

// ============================================================
// CHAT SERVICE
// ============================================================

export const chatService = {
  // ✅ Get Conversations
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await conversationApi.get("/", {
        params: { skip: 0, limit: 100 },
      });

      return response.data.conversations.map((conv: any) => ({
        id: conv.id.toString(),
        title: conv.title,
        createdAt: conv.created_at,
        isPinned: conv.is_pinned || false, // ✅ Lấy isPinned từ backend
        documents:
          conv.documents?.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
          })) || [],
        documentCount: conv.document_count || conv.documents?.length || 0,
      }));
    } catch (error) {
      console.error("❌ Get conversations error:", error);
      return [];
    }
  },

  // ✅ Get Chat History (load all queries in conversation)
  getChatHistory: async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      // ✅ Handle temp conversations
      if (conversationId.startsWith("temp-")) {
        console.log("⚠️ Temp conversation, no history");
        return [];
      }

      const response = await conversationApi.get(`/${conversationId}`);
      const conversation = response.data;

      return convertToChatMessages(conversation.queries || []);
    } catch (error) {
      console.error("❌ Get chat history error:", error);
      return [];
    }
  },

  // ✅ Create New Conversation (NO initial query)
  createNewConversation: async (payload: {
    title: string;
    initialMessage: string;
    documentIds?: (string | number)[];
  }): Promise<Conversation> => {
    try {
      const numericDocIds = (payload.documentIds || [])
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((id): id is number => !isNaN(id));

      // ✅ Create conversation WITHOUT initial_query
      const response = await conversationApi.post("/", {
        title: payload.title,
        document_ids: numericDocIds,
        // ❌ NO initial_query here
      });

      const conversationId = response.data.id;
      console.log("✅ Created conversation:", conversationId);

      // ✅ Now send first query WITH conversation_id
      await queryApiService.sendQuery(
        payload.initialMessage,
        numericDocIds,
        5,
        conversationId // ← Link to conversation
      );

      console.log("✅ Sent initial query to conversation");

      return {
        id: conversationId.toString(),
        title: response.data.title,
        createdAt: response.data.created_at,
        isPinned: false, // ✅ New conversations are not pinned by default
      };
    } catch (error) {
      console.error("❌ Create conversation error:", error);
      throw error;
    }
  },

  // ✅ Send Message in Conversation
  sendMessageInConversation: async (
    conversationId: string,
    messageText: string,
    documentIds: number[]
  ): Promise<any> => {
    try {
      const convId = parseInt(conversationId, 10);

      if (isNaN(convId)) {
        throw new Error("Invalid conversation ID");
      }

      const response = await queryApiService.sendQuery(
        messageText,
        documentIds,
        5,
        convId // ← Pass conversation_id
      );

      return response;
    } catch (error) {
      console.error("❌ Send message error:", error);
      throw error;
    }
  },

  // ✅ Rename Conversation
  renameConversation: async (
    id: string,
    newTitle: string
  ): Promise<Conversation> => {
    try {
      const response = await conversationApi.put(`/${id}`, {
        title: newTitle,
      });

      return {
        id: response.data.id.toString(),
        title: response.data.title,
        createdAt: response.data.created_at,
        isPinned: response.data.is_pinned || false,
      };
    } catch (error) {
      console.error("❌ Rename conversation error:", error);
      throw error;
    }
  },

  // ✅ UPDATE CONVERSATION (NEW - for pin/unpin)
  updateConversation: async (
    conversationId: string,
    updates: {
      title?: string;
      isPinned?: boolean;
    }
  ): Promise<Conversation> => {
    try {
      console.log("📝 Updating conversation:", conversationId, updates);

      const response = await conversationApi.put(`/${conversationId}`, updates);

      console.log("✅ Conversation updated:", response.data);

      return {
        id: response.data.id.toString(),
        title: response.data.title,
        createdAt: response.data.created_at,
        isPinned: response.data.is_pinned || false, // ✅ Lấy từ response
      };
    } catch (error) {
      console.error("❌ Update conversation error:", error);
      throw error;
    }
  },

  // ✅ Delete Conversation
  deleteConversation: async (id: string): Promise<void> => {
    try {
      await conversationApi.delete(`/${id}`);
    } catch (error) {
      console.error("❌ Delete conversation error:", error);
      throw error;
    }
  },

  // ✅ Start Guest Session
  startGuestSession: async (payload: {
    message: string;
    file?: File;
  }): Promise<{ sessionId: string }> => {
    try {
      const response = await queryApiService.sendQuery(payload.message, [], 5);
      return { sessionId: response.query_id?.toString() || "" };
    } catch (error) {
      console.error("❌ Start guest session error:", error);
      throw error;
    }
  },

  // Utility methods
  getSuggestedQueries: async (): Promise<string[]> => {
    return [
      "Tóm tắt tài liệu này",
      "Những điểm chính là gì?",
      "Giải thích chi tiết hơn",
      "So sánh với...",
      "Tạo câu hỏi trắc nghiệm",
    ];
  },
};
