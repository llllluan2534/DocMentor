import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ChatMessage, Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";
import { queryApiService } from "@/services/api/queryApiService";
import { documentService } from "@/services/document/documentService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
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
  selectedDocuments = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();

  const sessionId = propSessionId || searchParams.get("sessionId");
  const contextId = conversationId || sessionId;

  // --- 1. LOAD HISTORY ---
  useEffect(() => {
    const loadData = async () => {
      if (!contextId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        if (contextId.startsWith("temp-")) {
          setMessages([]);
          setIsLoading(false);
          return;
        }

        const history = await chatService.getChatHistory(contextId);

        const navigationState = location.state as any;
        if (history.length > 0 && navigationState) {
          const firstUserMsgIndex = history.findIndex(
            (m) => m.sender === "user"
          );
          if (firstUserMsgIndex !== -1) {
            const updatedMsg = { ...history[firstUserMsgIndex] };
            if (navigationState.tempAttachment)
              updatedMsg.attachment = navigationState.tempAttachment;
            if (navigationState.tempDocs)
              updatedMsg.attachedDocuments = navigationState.tempDocs;
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
    };
    loadData();
  }, [contextId]);

  // --- 2. LOGIC TẠO CONVERSATION MỚI (TỪ HERO CHAT) ---
  const handleCreateNewConversation = async (
    messageText: string,
    file?: File
  ) => {
    // 1. Optimistic UI: Hiện tin nhắn User + Loading AI
    const tempUserMsgId = `msg-user-${Date.now()}`;
    const tempAiMsgId = `msg-ai-temp-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: tempUserMsgId,
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

    const aiPlaceholder: ChatMessage = {
      id: tempAiMsgId,
      text: "",
      sender: "ai",
      timestamp: new Date().toISOString(),
      status: "loading",
    };

    setMessages([userMessage, aiPlaceholder]);

    try {
      // 2. Upload file nếu có
      let uploadedDocId = null;
      if (file) {
        try {
          const doc = await documentService.uploadDocument(file, file.name);
          uploadedDocId = doc.id;
        } catch (e) {
          console.error("Upload failed", e);
          alert("Lỗi tải file. Vui lòng thử lại.");
          setMessages([]);
          return;
        }
      }

      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));
      if (uploadedDocId) docIds.push(parseInt(String(uploadedDocId)));

      const title = messageText.substring(0, 50) || "Cuộc trò chuyện mới";

      // 3. Gọi service tạo Conversation (Service này đã tự gửi query đầu tiên bên trong nó rồi)
      // ⚡ QUAN TRỌNG: Không cần gọi queryApiService.sendQuery thủ công nữa!
      const newConv = await chatService.createNewConversation({
        title,
        initialMessage: messageText,
        documentIds: docIds.map(String), // Service expect string/number array
      });

      if (!newConv || !newConv.id)
        throw new Error("Failed to create conversation");

      // 4. Update URL (Quan trọng: replace để không back lại trang trống)
      navigate(`/user/chat/${newConv.id}`, { replace: true });

      // 5. Vì createNewConversation không trả về response AI text ngay,
      // ta gọi getChatHistory để lấy tin nhắn AI thật vừa được tạo.
      // Điều này đảm bảo dữ liệu đồng bộ 100% với backend.
      const history = await chatService.getChatHistory(newConv.id);
      setMessages(history);

      // 6. Notify sidebar
      if (onNewConversation) {
        onNewConversation(newConv);
      }
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      setMessages([]);
      alert("Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setIsReplying(false);
    }
  };

  // --- 3. HANDLE SEND MESSAGE (CHUNG - KHI ĐÃ CÓ CONVERSATION ID) ---
  const handleSendMessage = async (messageText: string, file?: File) => {
    if ((!messageText.trim() && !file) || isReplying) return;

    setIsReplying(true);

    if (!contextId || contextId.startsWith("temp-")) {
      await handleCreateNewConversation(messageText, file);
      return;
    }

    const currentConvId = parseInt(contextId, 10);

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
      attachment: file
        ? { fileName: file.name, fileSize: file.size, fileType: file.type }
        : undefined,
      attachedDocuments:
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    const aiPlaceholder: ChatMessage = {
      id: `msg-ai-temp-${Date.now()}`,
      text: "",
      sender: "ai",
      timestamp: new Date().toISOString(),
      status: "loading",
    };

    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);

    try {
      let uploadedDocId = null;
      if (file) {
        const doc = await documentService.uploadDocument(file, file.name);
        uploadedDocId = doc.id;
      }
      const docIds = selectedDocuments
        .map((d) => parseInt(d.id, 10))
        .filter((id) => !isNaN(id));
      if (uploadedDocId) docIds.push(parseInt(String(uploadedDocId)));

      const response = await queryApiService.sendQuery(
        messageText,
        docIds,
        5,
        currentConvId
      );

      // Map sources
      const mappedSources = (response.sources || []).map((s: any) => ({
        documentId: s.documentId ?? s.document_id ?? String(s.source_id ?? ""),
        documentTitle:
          s.documentTitle ?? s.document_title ?? s.title ?? "Tài liệu",
        pageNumber: s.pageNumber ?? s.page_number,
        similarityScore: s.similarityScore ?? s.similarity_score,
      }));

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === aiPlaceholder.id) {
            return {
              ...msg,
              id: `msg-ai-${response.query_id}`,
              text: response.answer,
              status: "sent",
              sources: mappedSources,
            };
          }
          if (msg.id === userMessage.id) return { ...msg, status: "sent" };
          return msg;
        })
      );
    } catch (error) {
      console.error("❌ Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== aiPlaceholder.id));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "error" } : m
        )
      );
      alert("Lỗi gửi tin nhắn.");
    } finally {
      setIsReplying(false);
    }
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
              isReplying={false}
              onEditMessage={() => {}}
            />
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isReplying}
            selectedDocuments={selectedDocuments}
          />
        </>
      )}
    </div>
  );
};
