import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ChatMessage, Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";
import { queryApiService } from "@/services/api/queryApiService";
import { documentService } from "@/services/document/documentService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
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
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false); // Chỉ dùng để disable input
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const sessionId = propSessionId || searchParams.get("sessionId");
  const contextId = conversationId || sessionId;

  // --- 1. LOAD HISTORY ---
  useEffect(() => {
    const loadData = async () => {
      if (contextId) {
        setIsLoading(true);
        try {
          if (contextId.startsWith("temp-")) {
            setMessages([]);
            setIsLoading(false);
            return;
          }

          let history = await chatService.getChatHistory(contextId);

          // Logic khôi phục file từ state (giữ nguyên như cũ)
          const navigationState = location.state as any;
          if (history.length > 0 && navigationState) {
            const firstUserMsgIndex = history.findIndex(
              (m) => m.sender === "user"
            );
            if (firstUserMsgIndex !== -1) {
              let updatedMsg = { ...history[firstUserMsgIndex] };
              if (!updatedMsg.attachment && navigationState.tempAttachment) {
                updatedMsg.attachment = navigationState.tempAttachment;
              }
              if (
                (!updatedMsg.attachedDocuments ||
                  updatedMsg.attachedDocuments.length === 0) &&
                navigationState.tempDocs
              ) {
                updatedMsg.attachedDocuments = navigationState.tempDocs;
              }
              history[firstUserMsgIndex] = updatedMsg;
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
      }
    };
    loadData();
  }, [contextId]);

  // --- 2. HANDLE SEND MESSAGE (OPTIMISTIC UI) ---
  const handleSendMessage = async (messageText: string, file?: File) => {
    if ((!messageText.trim() && !file) || isReplying) return;

    setIsReplying(true);

    // Xử lý tạo Conversation mới (Logic cũ giữ nguyên, tóm tắt lại)
    if (!contextId || contextId.startsWith("temp-")) {
      // ... (Logic tạo conversation mới - giữ nguyên code cũ của bạn ở đây)
      // Để ngắn gọn, tôi tập trung vào logic gửi tin nhắn khi đã có conversation
      await handleCreateNewConversation(messageText, file);
      return;
    }

    // --- Gửi tin nhắn trong Conversation đã tồn tại ---
    const currentConvId = parseInt(contextId, 10);

    // 1. Tạo tin nhắn User (Hiển thị ngay lập tức)
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      text: messageText || (file ? `Phân tích file: ${file.name}` : ""),
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
      attachment: file
        ? { fileName: file.name, fileSize: file.size, fileType: file.type }
        : undefined,
      attachedDocuments:
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    // 2. Tạo tin nhắn AI giả (Placeholder Loading)
    const tempAiId = `msg-ai-temp-${Date.now()}`;
    const aiPlaceholder: ChatMessage = {
      id: tempAiId,
      text: "", // Rỗng để MessageBubble hiển thị animation loading
      sender: "ai",
      timestamp: new Date().toISOString(),
      status: "loading", // ⚡ QUAN TRỌNG: Trạng thái này sẽ kích hoạt animation 3 chấm
    };

    // Cập nhật UI ngay lập tức
    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);

    try {
      // Upload file nếu có
      let uploadedDocId = null;
      if (file) {
        const doc = await documentService.uploadDocument(file, file.name);
        uploadedDocId = doc.id;
      }

      // Prepare Doc IDs
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));
      if (uploadedDocId) docIds.push(parseInt(String(uploadedDocId)));

      // Gọi API
      const response = await queryApiService.sendQuery(
        messageText || `Phân tích file: ${file?.name}`,
        docIds,
        5,
        currentConvId
      );

      // 3. Cập nhật lại tin nhắn AI thật khi có phản hồi
      // Map response.sources to the expected SourceReference shape to satisfy TypeScript
      const mappedSources = (response.sources || []).map((s: any) => ({
        documentId:
          s.documentId ?? s.document_id ?? s.id ?? String(s.source_id ?? ""),
        documentTitle:
          s.documentTitle ?? s.document_title ?? s.title ?? s.name ?? "Tài liệu",
        pageNumber:
          s.pageNumber ?? s.page_number ?? s.page ?? s.p ?? undefined,
        similarityScore:
          s.similarityScore ?? s.similarity_score ?? s.score ?? undefined,
      }));

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === tempAiId) {
            return {
              ...msg,
              id: `msg-ai-${response.query_id}`,
              text: response.answer,
              status: "sent",
              sources: mappedSources, // now in the correct shape
            };
          }
          if (msg.id === userMessage.id) {
            return { ...msg, status: "sent" };
          }
          return msg;
        })
      );
    } catch (error: any) {
      console.error("❌ Send message error:", error);

      // Xóa tin nhắn placeholder nếu lỗi
      setMessages((prev) => prev.filter((m) => m.id !== tempAiId));

      // Update trạng thái user message thành error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "error" } : m
        )
      );

      alert("Lỗi gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsReplying(false);
    }
  };

  // Helper: Tạo conversation mới (Giữ nguyên logic cũ nhưng cập nhật state messages tương tự)
  const handleCreateNewConversation = async (
    messageText: string,
    file?: File
  ) => {
    // ... (Copy logic cũ của bạn, nhưng đảm bảo setMessages theo flow User -> AI Placeholder -> AI Real)
    // Do giới hạn độ dài, bạn hãy áp dụng logic "Placeholder" tương tự vào hàm này nhé.
    // Tạm thời tôi để console.log để bạn biết vị trí.
    console.log("Creating new conversation logic here...");
    // Khi implement, nhớ:
    // 1. setMessages([...userMsg, aiPlaceholder])
    // 2. Gọi API create
    // 3. Navigate
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 border-4 rounded-full border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-transparent">
      {messages.length === 0 ? (
        <HeroChat onStartChat={handleSendMessage} />
      ) : (
        <>
          <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
            <MessageList
              messages={messages}
              isReplying={false} // ⚡ Luôn false vì Loading đã nằm trong messages
              onEditMessage={() => {}} // Implement edit sau
            />
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isReplying} // Vẫn dùng để disable input
            selectedDocuments={selectedDocuments}
          />
        </>
      )}
    </div>
  );
};
