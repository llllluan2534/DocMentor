// src/features/chat/components/ChatContainer.tsx - FIXED
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { ChatMessage, Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";
import { queryApiService } from "@/services/api/queryApiService";
import { documentService } from "@/services/document/documentService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { SuggestedQueries } from "./SuggestedQuestions";
import Button from "@/components/common/Button";
import { useAuth } from "@/app/providers/AuthProvider";
import HeroChat from "@/features/chat/components/HeroChat";

interface ChatContainerProps {
  conversationId: string | null;
  sessionId: string | null;
  initialFile?: File | null;
  selectedDocuments?: Array<{ id: string; title: string }>;
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
  onOpenDocumentModal,
  onRemoveDocument,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = propSessionId || searchParams.get("sessionId");
  const contextId = conversationId || sessionId;

  // ✅ FIX: Load lịch sử chat - KHÔNG tạo query mới
  useEffect(() => {
    const loadData = async () => {
      if (contextId) {
        setIsLoading(true);
        try {
          console.log("📖 Loading chat history for:", contextId);
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

  useEffect(() => {
    if (initialFile && messages.length === 0 && !contextId) {
      console.log("📎 Auto-sending with file:", initialFile.name);
      handleSendMessage(`Phân tích file: ${initialFile.name}`, initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const handleSendMessage = async (messageText: string, file?: File) => {
    if ((!messageText.trim() && !file) || isReplying) {
      console.log("⚠️ Message empty or already sending");
      return;
    }

    console.log("📤 Sending message:", {
      messageText,
      hasFile: !!file,
      contextId,
    });
    setIsReplying(true);

    // ✅ CASE 1: Đã có conversation - gửi tin nhắn bình thường
    if (contextId && messages.length > 0) {
      console.log("📝 Sending to existing conversation:", contextId);

      if (file) {
        await handleSendMessageWithFile(messageText, file);
      } else {
        await handleSendMessageTextOnly(messageText);
      }
      return;
    }

    // ✅ CASE 2: Chưa có conversation - tạo mới
    console.log("🆕 Creating new conversation");

    // Upload file trước nếu có
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

        // Load messages sau khi tạo
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

        // Tổng hợp document IDs
        const docIds = selectedDocuments
          .map((d) => parseInt(d.id, 10))
          .filter((id) => !isNaN(id));

        if (uploadedDocId !== null) {
          docIds.push(uploadedDocId);
        }

        console.log("📚 Document IDs:", docIds);

        // ✅ FIX: Tạo conversation với query đầu tiên
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

        // ✅ FIX: Load messages sau khi tạo (không gửi query lần 2)
        const history = await chatService.getChatHistory(newConvId);
        console.log("✅ Loaded conversation history:", history.length);
        setMessages(history);
      } catch (error) {
        console.error("❌ Create conversation error:", error);
        alert("Không thể tạo cuộc trò chuyện mới.");
      } finally {
        setIsReplying(false);
      }
    }
  };

  const handleSendMessageWithFile = async (messageText: string, file: File) => {
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

      // ✅ CHỈ lấy IDs từ selectedDocuments
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      // ✅ KHÔNG thêm conversationId vào docIds
      if (!isNaN(uploadedDocId)) {
        docIds.push(uploadedDocId);
      }

      console.log("📤 Sending query with docs:", docIds);

      // ✅ Truyền conversationId riêng
      const currentConvId = conversationId
        ? parseInt(conversationId, 10)
        : undefined;

      const response = await queryApiService.sendQuery(
        messageText || `Phân tích file: ${file.name}`,
        docIds, // ✅ Chỉ document IDs
        5,
        currentConvId // ✅ Conversation ID riêng
      );

      // Update user message
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
    } catch (error) {
      console.error("❌ Send file error:", error);
      alert("Lỗi gửi file.");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "error" } : m
        )
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleSendMessageTextOnly = async (messageText: string) => {
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // ✅ CHỈ lấy IDs từ selectedDocuments, KHÔNG thêm conversationId
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      console.log("📤 Sending text query with docs:", docIds);

      // ✅ Truyền conversationId riêng biệt
      const currentConvId = conversationId
        ? parseInt(conversationId, 10)
        : undefined;

      const response = await queryApiService.sendQuery(
        messageText,
        docIds, // ✅ Chỉ document IDs
        5,
        currentConvId // ✅ Conversation ID riêng
      );

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg-ai-${response.query_id}`,
        text: response.answer,
        sender: "ai",
        timestamp: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("❌ Send message error:", error);
      alert("Lỗi gửi tin nhắn.");
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 border-4 rounded-full border-primary/30 border-t-primary animate-spin"></div>
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
