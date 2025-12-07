import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useSearchParams,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ChatContainer } from "@/features/chat/components/ChatContainer";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { DocumentSelectionModal } from "@/features/chat/components/DocumentSelectionModal";
import { Conversation } from "@/types/chat.types";
import { chatService } from "@/services/chat/chatService";

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { conversationId: paramConvId } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const hasHandledDocIds = useRef(false);

  const isGuestChat = pathname === "/chat" || pathname.startsWith("/chat/");
  const showSidebar = isLoggedIn && !isGuestChat;
  const guestSessionId = searchParams.get("sessionId");

  // ============================================================
  // LOAD DOCUMENTS FROM VARIOUS SOURCES
  // ============================================================

  const loadDocumentsFromIds = useCallback(async (docIds: string[]) => {
    try {
      const auth_token = localStorage.getItem("auth_token") || "";
      const docs = await Promise.all(
        docIds.map(async (id) => {
          const res = await fetch(
            `https://docmentor-api.onrender.com/documents/${id}`,
            {
              headers: { Authorization: `Bearer ${auth_token}` },
            }
          );
          if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
          return res.json();
        })
      );
      setSelectedDocuments(
        docs.map((doc) => ({
          id: String(doc.id),
          title: doc.title,
        }))
      );
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }, []);

  // Load from localStorage (from DocumentsPage)
  useEffect(() => {
    const savedDocIds = localStorage.getItem("selectedDocIds");
    if (savedDocIds && isLoggedIn) {
      try {
        const docIds = JSON.parse(savedDocIds);
        loadDocumentsFromIds(docIds);
        localStorage.removeItem("selectedDocIds");
      } catch (error) {
        console.error("Error loading saved doc IDs:", error);
      }
    }
  }, [isLoggedIn, loadDocumentsFromIds]);

  // Load from URL query params (docIds)
  useEffect(() => {
    const docIdsString = searchParams.get("docIds");
    if (isLoggedIn && docIdsString && !hasHandledDocIds.current) {
      hasHandledDocIds.current = true;
      loadDocumentsFromIds(docIdsString.split(","));
      navigate("/user/chat", { replace: true });
    }
  }, [isLoggedIn, loadDocumentsFromIds, navigate, searchParams]);

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================

  const loadInitialConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !searchParams.get("docIds")) {
      loadInitialConversations();

      if (paramConvId) {
        setActiveConversationId(paramConvId);
      }
    }
  }, [isLoggedIn, paramConvId, searchParams]);

  // ============================================================
  // CONVERSATION HANDLERS
  // ============================================================

  const handleNewConversationWithDocs = async (docIds: string[]) => {
    try {
      console.log("Preparing to create conversation with docs:", docIds);

      // ✅ FIX: Load REAL document titles before creating temp conversation
      const auth_token = localStorage.getItem("auth_token") || "";
      const docs = await Promise.all(
        docIds.map(async (id) => {
          try {
            const res = await fetch(
              `https://docmentor-api.onrender.com/documents/${id}`,
              {
                headers: { Authorization: `Bearer ${auth_token}` },
              }
            );
            if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
            return await res.json();
          } catch (error) {
            console.error(`Error loading document ${id}:`, error);
            return { id, title: `Document ${id}` }; // Fallback
          }
        })
      );

      // ✅ Set documents với REAL titles
      const documentsWithTitles = docs.map((doc) => ({
        id: String(doc.id),
        title: doc.title || `Document ${doc.id}`,
      }));

      setSelectedDocuments(documentsWithTitles);

      // ✅ Tạo conversation tạm
      const newConv: Conversation = {
        id: `temp-with-docs-${Date.now()}`,
        title: `Trò chuyện về ${docIds.length} tài liệu`,
        createdAt: new Date().toISOString(),
      };

      setConversations((prev) => {
        const filtered = prev.filter((c) => !c.id.startsWith("temp-"));
        return [newConv, ...filtered];
      });

      setActiveConversationId(newConv.id);
      navigate(`/user/chat/${newConv.id}`, { replace: true });

      console.log("✅ Temporary conversation with docs created");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      console.log("🆕 Creating TEMP conversation (no backend call)");

      // ✅ FIX: Tạo conversation TẠM, KHÔNG gọi backend
      const tempConv: Conversation = {
        id: `temp-new-${Date.now()}`,
        title: "Cuộc trò chuyện mới",
        createdAt: new Date().toISOString(),
      };

      // ✅ Thêm vào đầu danh sách (loại bỏ temp conversations khác)
      setConversations((prev) => {
        const filtered = prev.filter((c) => !c.id.startsWith("temp-"));
        return [tempConv, ...filtered];
      });

      setActiveConversationId(tempConv.id);

      // ✅ Clear selected documents
      setSelectedDocuments([]);

      // ✅ Chuyển hướng
      navigate(`/user/chat/${tempConv.id}`, { replace: true });

      console.log(
        "✅ Temp conversation created, waiting for user's first message"
      );
    } catch (error) {
      console.error("❌ Create temp conversation error:", error);
      alert("Không thể tạo cuộc trò chuyện mới.");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      // ✅ Chỉ xóa trên backend nếu không phải conversation tạm
      if (!id.startsWith("temp-")) {
        await chatService.deleteConversation(id);
      }

      // ✅ Cập nhật state
      const updatedConvs = conversations.filter((c) => c.id !== id);
      setConversations(updatedConvs);

      if (activeConversationId === id) {
        setActiveConversationId(null);
        navigate("/user/chat", { replace: true });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Không thể xóa cuộc trò chuyện.");
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      // ✅ Chỉ rename trên backend nếu không phải conversation tạm
      if (!id.startsWith("temp-")) {
        await chatService.renameConversation(id, newTitle);
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (error) {
      console.error("Error renaming conversation:", error);
      alert("Không thể đổi tên cuộc trò chuyện.");
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/user/chat/${id}`, { replace: true });
  };

  // ============================================================
  // CHAT CONTAINER HANDLERS
  // ============================================================

  const handleCreateConversationFromHeroChat = (
    conversationId: string,
    initialMessage: string,
    documentIds?: string[]
  ) => {
    console.log(
      "✅ handleCreateConversationFromHeroChat called:",
      conversationId,
      initialMessage,
      documentIds
    );

    // ✅ Kiểm tra nếu conversation đã tồn tại
    const conversationExists = conversations.some(
      (c) => c.id === conversationId
    );

    if (!conversationExists) {
      const newConv: Conversation = {
        id: conversationId,
        title:
          initialMessage.substring(0, 50) +
          (initialMessage.length > 50 ? "..." : ""),
        createdAt: new Date().toISOString(),
      };

      // ✅ Thêm vào conversations (loại bỏ conversation tạm nếu có)
      setConversations((prev) => {
        const filtered = prev.filter((c) => !c.id.startsWith("temp-"));
        return [newConv, ...filtered];
      });

      console.log("✅ Conversation added to sidebar:", conversationId);
    }

    setActiveConversationId(conversationId);
    navigate(`/user/chat/${conversationId}`, { replace: true });
  };

  // ============================================================
  // DOCUMENT MODAL HANDLERS
  // ============================================================

  const handleDocumentsSelected = (
    documents: Array<{ id: string; title: string }>
  ) => {
    setSelectedDocuments(documents);
    setIsDocumentModalOpen(false);

    console.log("Documents selected:", documents);
    console.log("Documents saved for next message");
  };

  const handleOpenDocumentModal = () => {
    // ✅ Nếu chưa có active conversation, tạo conversation tạm trước
    if (!activeConversationId) {
      handleNewConversation();
    }
    setIsDocumentModalOpen(true);
  };

  // ✅ THÊM function này trong ChatPage:
  const handleRemoveDocument = (docId: string) => {
    setSelectedDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 rounded-full w-96 h-96 bg-primary/10 blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-secondary/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Sidebar - chỉ hiển thị khi user đã login và không phải guest chat */}
      {showSidebar && (
        <div className="relative z-10 flex-shrink-0 w-80 animate-slide-in-left">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
          />
        </div>
      )}

      {/* Main chat content */}
      <main
        className={`relative z-10 animate-fade-in ${
          showSidebar ? "flex-1" : "w-full"
        }`}
      >
        <div
          className={`h-full ${
            showSidebar
              ? "bg-accent/30 backdrop-blur-sm border-l border-primary/10"
              : "bg-background"
          }`}
        >
          <ChatContainer
            conversationId={
              isLoggedIn && !isGuestChat ? activeConversationId : null
            }
            sessionId={!isLoggedIn || isGuestChat ? guestSessionId : null}
            initialFile={null}
            selectedDocuments={selectedDocuments}
            conversations={conversations}
            onOpenDocumentModal={handleOpenDocumentModal}
            onCreateConversationFromHeroChat={
              isLoggedIn && !isGuestChat
                ? handleCreateConversationFromHeroChat
                : undefined
            }
          />
        </div>
      </main>

      {/* Document selection modal */}
      {isLoggedIn && !isGuestChat && (
        <DocumentSelectionModal
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          onDocumentsSelected={handleDocumentsSelected}
        />
      )}
    </div>
  );
};

export default ChatPage;
