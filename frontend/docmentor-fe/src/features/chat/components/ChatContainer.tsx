// src/features/chat/components/ChatContainer.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { ChatMessage, Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";
import { queryApiService } from "@/services/api/queryApiService";
import { documentService } from "@/services/document/documentService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput"; // ✅ Import ChatInput đã sửa
import Button from "@/components/common/Button";
import { useAuth } from "@/app/providers/AuthProvider";
import HeroChat from "@/features/chat/components/HeroChat";

interface ChatContainerProps {
  conversationId: string | null;
  sessionId: string | null;
  initialFile?: File | null;
  selectedDocuments?: Array<{ id: string; title: string }>;
  conversations?: Conversation[];
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
  selectedDocuments = [],
  onOpenDocumentModal,
  onRemoveDocument,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const sessionId = propSessionId || searchParams.get("sessionId");
  const contextId = conversationId || sessionId;

  // ============================================================
  // VALIDATION FUNCTIONS
  // ============================================================

  const isValidConversation = (convId: string): boolean => {
    const convIdNum = parseInt(convId, 10);
    return !isNaN(convIdNum);
  };

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

          if (contextId.startsWith("temp-")) {
            console.log("📝 Temporary conversation, no history to load");
            setMessages([]);
            setIsLoading(false);
            return;
          }

          // 1. Lấy dữ liệu từ Server
          let history = await chatService.getChatHistory(contextId);
          console.log("✅ Loaded messages:", history.length);

          // 2. ✅ LOGIC FIX: Khôi phục file từ 'state' nếu Server trả về thiếu
          // (Dành cho trường hợp vừa tạo conversation xong mà API chưa kịp index file)
          const navigationState = location.state as {
            tempAttachment?: any;
            tempDocs?: any;
          } | null;

          if (history.length > 0 && navigationState) {
            // Tìm tin nhắn User đầu tiên
            const firstUserMsgIndex = history.findIndex(
              (m) => m.sender === "user"
            );

            if (firstUserMsgIndex !== -1) {
              const firstMsg = history[firstUserMsgIndex];
              let hasChanges = false;
              let updatedMsg = { ...firstMsg };

              // Check 1: Khôi phục File Upload (Attachment)
              if (!updatedMsg.attachment && navigationState.tempAttachment) {
                console.log("🛠️ Restoring missing attachment from state");
                updatedMsg.attachment = navigationState.tempAttachment;
                hasChanges = true;
              }

              // Check 2: Khôi phục Tài liệu chọn sẵn (Documents)
              if (
                (!updatedMsg.attachedDocuments ||
                  updatedMsg.attachedDocuments.length === 0) &&
                navigationState.tempDocs
              ) {
                console.log("🛠️ Restoring missing documents from state");
                updatedMsg.attachedDocuments = navigationState.tempDocs;
                hasChanges = true;
              }

              // Nếu có thay đổi, cập nhật lại mảng history
              if (hasChanges) {
                const newHistory = [...history];
                newHistory[firstUserMsgIndex] = updatedMsg;
                history = newHistory;
              }
            }
          }

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
  }, [contextId]); // ✅ Dependency quan trọng: location.state

  // ============================================================
  // HANDLE SEND MESSAGE - MAIN FUNCTION
  // ============================================================

  const handleSendMessage = async (messageText: string, file?: File) => {
    if ((!messageText.trim() && !file) || isReplying) {
      console.log("⚠️ Message empty or already sending");
      return;
    }

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

    if (contextId && contextId.startsWith("temp-")) {
      console.log("🔄 Converting temp conversation to real");
      await handleCreateNewConversation(messageText, file);
      return;
    }

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

    console.log("🆕 Creating new conversation");
    await handleCreateNewConversation(messageText, file);
  };

  // ============================================================
  // HELPER FUNCTIONS: CREATE NEW CONVERSATION (OPTIMISTIC + STATE PASSING)
  // ============================================================

  const handleCreateNewConversation = async (
    messageText: string,
    file?: File
  ) => {
    // 1. TẠO TIN NHẮN GIẢ LẬP (Optimistic Update)
    const tempId = `msg-temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempId,
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
      // Hiển thị file ngay lập tức
      attachment: file
        ? {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          }
        : undefined,
      attachedDocuments:
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    setMessages([userMessage]);

    // 2. Upload File & Create Conversation
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
        setMessages([]); // Clear message lỗi
        return;
      }
    }

    if (!user) {
      try {
        console.log("👤 Creating guest session");
        const { sessionId: newSessionId } = await chatService.startGuestSession(
          {
            message: messageText,
            file: file || undefined,
          }
        );
        setSearchParams({ sessionId: newSessionId });
        const history = await chatService.getChatHistory(newSessionId);
        setMessages(history);
      } catch (error) {
        console.error("❌ Guest session error:", error);
        alert("Không thể bắt đầu phiên chat.");
        setMessages([]);
      } finally {
        setIsReplying(false);
      }
    } else {
      try {
        console.log("👤 Creating user conversation");

        const docIds = selectedDocuments
          .map((d) => parseInt(d.id, 10))
          .filter((id) => !isNaN(id));

        if (uploadedDocId !== null) {
          docIds.push(uploadedDocId);
        }

        const newConversation = await chatService.createNewConversation({
          title: messageText.substring(0, 50) || "Cuộc trò chuyện mới",
          initialMessage: messageText,
          documentIds: docIds,
        });

        const newConvId = newConversation.id;

        if (onCreateConversationFromHeroChat) {
          onCreateConversationFromHeroChat(
            newConvId,
            messageText,
            docIds.map(String)
          );
        } else if (onNewConversation) {
          onNewConversation(newConversation);
        }

        // ✅ QUAN TRỌNG: Truyền state chứa thông tin file qua route mới
        // Để useEffect ở trang mới có thể đọc và khôi phục hiển thị file
        navigate(`/user/chat/${newConvId}`, {
          replace: true,
          state: {
            tempAttachment: file
              ? {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                }
              : null,
            tempDocs: selectedDocuments.length > 0 ? selectedDocuments : null,
          },
        });
      } catch (error) {
        console.error("❌ Create conversation error:", error);
        alert("Không thể tạo cuộc trò chuyện mới.");
        setMessages([]);
      } finally {
        setIsReplying(false);
      }
    }
  };

  // ============================================================
  // HANDLE SEND MESSAGE WITH FILE
  // ============================================================

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
      attachedDocuments:
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      console.log("📂 Uploading file in conversation:", file.name);
      const uploadedDoc = await documentService.uploadDocument(file, file.name);
      const uploadedDocId = Number(uploadedDoc.id);

      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      if (!isNaN(uploadedDocId)) {
        docIds.push(uploadedDocId);
      }

      console.log("📤 Sending query with docs:", docIds);

      const response = await queryApiService.sendQuery(
        messageText || `Phân tích file: ${file.name}`,
        docIds,
        5,
        conversationId
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "sent" } : m
        )
      );

      const aiMessage: ChatMessage = {
        id: `msg-ai-${response.query_id}`,
        text: response.answer,
        sender: "ai",
        timestamp: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("❌ Send file error:", error);

      if (
        error.status === 404 &&
        error.detail?.includes("Conversation not found")
      ) {
        alert("Cuộc trò chuyện không tồn tại. Đang tạo cuộc trò chuyện mới...");
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

  // ============================================================
  // HANDLE SEND MESSAGE TEXT ONLY
  // ============================================================

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
      attachedDocuments:
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));

      console.log("📤 Sending text query with docs:", docIds);

      const response = await queryApiService.sendQuery(
        messageText,
        docIds,
        5,
        conversationId
      );

      const aiMessage: ChatMessage = {
        id: `msg-ai-${response.query_id}`,
        text: response.answer,
        sender: "ai",
        timestamp: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("❌ Send message error:", error);

      if (
        error.status === 404 &&
        error.detail?.includes("Conversation not found")
      ) {
        alert("Cuộc trò chuyện không tồn tại. Đang tạo cuộc trò chuyện mới...");
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
                <FiPlus className="w-4 h-4" /> Thêm tài liệu
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

          {/* ✅ CẬP NHẬT: Truyền selectedDocuments xuống ChatInput */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isReplying}
            onOpenDocumentModal={onOpenDocumentModal}
            selectedDocuments={selectedDocuments} // ✨ TRUYỀN PROP NÀY ĐỂ KÍCH HOẠT HOOK CHECK STATUS
          />
        </>
      )}
    </div>
  );
};
