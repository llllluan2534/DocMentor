import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { ChatMessage, Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";
import { queryApiService } from "@/services/api/queryApiService";
import { documentService } from "@/services/document/documentService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import Button from "@/components/common/Button";
import { useAuth } from "@/app/providers/AuthProvider";
import HeroChat from "@/features/chat/components/HeroChat";

interface ChatContainerProps {
  conversationId: string | null;
  sessionId: string | null;
  initialFile?: File | null;
  selectedDocuments?: Array<{ id: string; title: string }>;
  conversations?: Conversation[]; // ✅ ADDED: To validate conversation existence
  onOpenDocumentModal?: () => void;
  onRemoveDocument?: (docId: string) => void;
  onCreateConversationFromHeroChat?: (
    conversationId: string,
    initialMessage: string,
    documentIds?: string[]
  ) => void;
  onNewConversation?: (conversation: Conversation) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  conversationId,
  sessionId: propSessionId,
  onNewConversation,
  onCreateConversationFromHeroChat,
  initialFile,
  selectedDocuments = [],
  conversations = [], // ✅ ADDED
  onOpenDocumentModal,
  onRemoveDocument,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = propSessionId || searchParams.get("sessionId");
  const contextId = conversationId || sessionId;

  // ============================================================
  // VALIDATION FUNCTIONS
  // ============================================================

  const isValidConversation = (convId: string): boolean => {
    // ✅ CHỈ kiểm tra numeric ID
    const convIdNum = parseInt(convId, 10);
    return !isNaN(convIdNum);
  };

  // ✅ Block auto-generated queries
  const isForbiddenQuery = (queryText: string): boolean => {
    const forbiddenQueries = [
      "Phân tích 1 tài liệu đã chọn",
      "phân tích 1 tài liệu đã chọn",
      "Phân tích tài liệu",
      "phân tích tài liệu",
      "Tóm tắt tài liệu này",
    ];

    return forbiddenQueries.some((q) =>
      queryText.toLowerCase().includes(q.toLowerCase())
    );
  };

  // ============================================================
  // LOAD CHAT HISTORY
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      if (contextId) {
        setIsLoading(true);
        try {
          console.log("📖 Loading chat history for:", contextId);

          // Temp conversation: no history
          if (contextId.startsWith("temp-")) {
            console.log("📝 Temporary conversation, no history to load");
            setMessages([]);
            setIsLoading(false);
            return;
          }

          const history = await chatService.getChatHistory(contextId);
          console.log("✅ Loaded messages:", history.length);
          setMessages(history);
        } catch (error) {
          console.error("❌ Lỗi tải lịch sử chat:", error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessages([]);
        try {
          const queries = await chatService.getSuggestedQueries();
          setSuggestedQueries(queries);
        } catch (error) {
          console.error("❌ Lỗi tải gợi ý:", error);
        }
      }
    };
    loadData();
  }, [contextId]);

  // ============================================================
  // HANDLE SEND MESSAGE - MAIN FUNCTION
  // ============================================================

  const handleSendMessage = async (messageText: string, file?: File) => {
    // Validation
    if ((!messageText.trim() && !file) || isReplying) {
      console.log("⚠️ Message empty or already sending");
      return;
    }

    // ✅ Block auto-generated queries
    if (isForbiddenQuery(messageText)) {
      console.error("❌ Blocked auto-generated query:", messageText);
      alert("Vui lòng nhập câu hỏi của riêng bạn!");
      return;
    }

    console.log("📤 Sending message:", {
      messageText,
      hasFile: !!file,
      contextId,
    });
    setIsReplying(true);

    // ✅ CASE 1: Temp conversation - Convert to real
    if (contextId && contextId.startsWith("temp-")) {
      console.log("🔄 Converting temp conversation to real");
      await handleCreateNewConversation(messageText, file);
      return;
    }

    // ✅ CASE 2: Existing real conversation
    if (contextId && messages.length > 0) {
      console.log("📝 Sending to existing conversation:", contextId);

      const currentConvId = parseInt(contextId, 10);
      if (isNaN(currentConvId)) {
        console.error("❌ Invalid conversation ID format:", contextId);
        alert("Lỗi: ID conversation không hợp lệ");
        setIsReplying(false);
        return;
      }

      if (file) {
        await handleSendMessageWithFile(messageText, file, currentConvId);
      } else {
        await handleSendMessageTextOnly(messageText, currentConvId);
      }
      return;
    }

    // ✅ CASE 3: No conversation - Create new
    console.log("🆕 Creating new conversation");
    await handleCreateNewConversation(messageText, file);
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  // Create new conversation from scratch
  const handleCreateNewConversation = async (
    messageText: string,
    file?: File
  ) => {
    // Upload file first if exists
    let uploadedDocId: number | null = null;
    if (file) {
      try {
        console.log("📂 Uploading file:", file.name);
        const uploadedDoc = await documentService.uploadDocument(
          file,
          file.name
        );
        uploadedDocId = Number(uploadedDoc.id);
        console.log("✅ File uploaded, ID:", uploadedDocId);
      } catch (error) {
        console.error("❌ Upload error:", error);
        alert("Lỗi tải file lên. Vui lòng thử lại.");
        setIsReplying(false);
        return;
      }
    }

    if (!user) {
      // Guest session
      try {
        console.log("👤 Creating guest session");
        const { sessionId: newSessionId } = await chatService.startGuestSession(
          {
            message: messageText,
            file: file || undefined,
          }
        );
        setSearchParams({ sessionId: newSessionId });

        // Load messages after creation
        const history = await chatService.getChatHistory(newSessionId);
        setMessages(history);
      } catch (error) {
        console.error("❌ Guest session error:", error);
        alert("Không thể bắt đầu phiên chat.");
      } finally {
        setIsReplying(false);
      }
    } else {
      // User conversation
      try {
        console.log("👤 Creating user conversation");

        // Collect document IDs
        const docIds = selectedDocuments
          .map((d) => parseInt(d.id, 10))
          .filter((id) => !isNaN(id));

        if (uploadedDocId !== null) {
          docIds.push(uploadedDocId);
        }

        console.log("📚 Document IDs:", docIds);

        // Create conversation with backend
        const newConversation = await chatService.createNewConversation({
          title: messageText.substring(0, 50) || "Cuộc trò chuyện mới",
          initialMessage: messageText,
          documentIds: docIds,
        });

        const newConvId = newConversation.id;
        console.log("✅ Conversation created:", newConvId);

        // Notify parent
        if (onCreateConversationFromHeroChat) {
          onCreateConversationFromHeroChat(
            newConvId,
            messageText,
            docIds.map(String)
          );
        } else if (onNewConversation) {
          onNewConversation(newConversation);
        }

        // Load messages after creation
        const history = await chatService.getChatHistory(newConvId);
        console.log("✅ Loaded conversation history:", history.length);
        setMessages(history);

        // Navigate to new conversation URL
        navigate(`/user/chat/${newConvId}`, { replace: true });
      } catch (error) {
        console.error("❌ Create conversation error:", error);
        alert("Không thể tạo cuộc trò chuyện mới.");
      } finally {
        setIsReplying(false);
      }
    }
  };

  // Convert temp conversation to real
  const handleConvertTempConversation = async (
    messageText: string,
    file?: File
  ) => {
    try {
      console.log("🔄 Converting temp conversation to real conversation");

      // Upload file if exists
      let uploadedDocId: number | null = null;
      if (file) {
        try {
          console.log("📂 Uploading file:", file.name);
          const uploadedDoc = await documentService.uploadDocument(
            file,
            file.name
          );
          uploadedDocId = Number(uploadedDoc.id);
          console.log("✅ File uploaded, ID:", uploadedDocId);
        } catch (error) {
          console.error("❌ Upload error:", error);
          alert("Lỗi tải file lên. Vui lòng thử lại.");
          return;
        }
      }

      // Collect document IDs
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      if (uploadedDocId !== null) {
        docIds.push(uploadedDocId);
      }

      console.log("📚 Document IDs for new conversation:", docIds);

      // Create real conversation with backend
      const newConversation = await chatService.createNewConversation({
        title: messageText.substring(0, 50) || "Cuộc trò chuyện mới",
        initialMessage: messageText,
        documentIds: docIds,
      });

      const newConvId = newConversation.id;
      console.log("✅ Real conversation created:", newConvId);

      // Notify parent
      if (onCreateConversationFromHeroChat) {
        onCreateConversationFromHeroChat(
          newConvId,
          messageText,
          docIds.map(String)
        );
      }

      // Load messages
      const history = await chatService.getChatHistory(newConvId);
      console.log("✅ Loaded conversation history:", history.length);
      setMessages(history);

      // Navigate to new conversation URL
      navigate(`/user/chat/${newConvId}`, { replace: true });
    } catch (error) {
      console.error("❌ Convert temp conversation error:", error);
      alert("Lỗi tạo cuộc trò chuyện.");
    }
  };

  // Send message with file in existing conversation
  const handleSendMessageWithFile = async (
    messageText: string,
    file: File,
    conversationId: number
  ) => {
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      text: messageText || `Phân tích file: ${file.name}`,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
      attachment: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Upload file
      console.log("📂 Uploading file in conversation:", file.name);
      const uploadedDoc = await documentService.uploadDocument(file, file.name);
      const uploadedDocId = Number(uploadedDoc.id);

      // Collect document IDs
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      if (!isNaN(uploadedDocId)) {
        docIds.push(uploadedDocId);
      }

      console.log("📤 Sending query with docs:", docIds);

      // Send query with conversation_id
      const response = await queryApiService.sendQuery(
        messageText || `Phân tích file: ${file.name}`,
        docIds,
        5,
        conversationId
      );

      // Update user message status
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "sent" } : m
        )
      );

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg-ai-${response.query_id}`,
        text: response.answer,
        sender: "ai",
        timestamp: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("❌ Send file error:", error);

      // Handle specific errors
      if (
        error.status === 404 &&
        error.detail?.includes("Conversation not found")
      ) {
        alert("Cuộc trò chuyện không tồn tại. Đang tạo cuộc trò chuyện mới...");
        // Create new conversation instead
        await handleCreateNewConversation(messageText, file);
      } else {
        alert("Lỗi gửi file.");
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "error" } : m
        )
      );
    } finally {
      setIsReplying(false);
    }
  };

  // Send text-only message in existing conversation
  const handleSendMessageTextOnly = async (
    messageText: string,
    conversationId?: number
  ) => {
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Collect document IDs
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      console.log("📤 Sending text query with docs:", docIds);

      // Send query
      const response = await queryApiService.sendQuery(
        messageText,
        docIds,
        5,
        conversationId
      );

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg-ai-${response.query_id}`,
        text: response.answer,
        sender: "ai",
        timestamp: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("❌ Send message error:", error);

      // Handle specific errors
      if (
        error.status === 404 &&
        error.detail?.includes("Conversation not found")
      ) {
        alert("Cuộc trò chuyện không tồn tại. Đang tạo cuộc trò chuyện mới...");
        // Remove error message and create new conversation
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        await handleCreateNewConversation(messageText);
      } else {
        alert("Lỗi gửi tin nhắn.");
      }
    } finally {
      setIsReplying(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 border-4 rounded-full border-primary/30 border-t-primary animate-spin"></div>
        <p className="mt-4 text-text-muted">Đang tải cuộc trò chuyện...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Selected Documents Header */}
      {selectedDocuments.length > 0 && (
        <div className="p-4 border-b border-primary/20 bg-accent/40 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-text-muted">
                Đang chat với{" "}
                <span className="font-bold text-primary">
                  {selectedDocuments.length}
                </span>{" "}
                tài liệu
              </p>
              <Button
                onClick={onOpenDocumentModal}
                className="text-sm px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-primary hover:bg-primary/30 transition-colors flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Thêm tài liệu
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-accent/80 border border-primary/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-white"
                >
                  <span className="max-w-xs truncate">{doc.title}</span>
                  <button
                    onClick={() => onRemoveDocument?.(doc.id)}
                    className="font-bold transition-colors text-text-muted hover:text-white"
                    title="Xóa tài liệu"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      {messages.length === 0 ? (
        <HeroChat onStartChat={handleSendMessage} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} isReplying={isReplying} />
          </div>
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isReplying}
            onOpenDocumentModal={onOpenDocumentModal}
          />
        </>
      )}
    </div>
  );
};
