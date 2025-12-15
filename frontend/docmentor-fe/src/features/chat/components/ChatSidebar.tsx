import React, { useState, useEffect } from "react";
import { Conversation } from "@/types/chat.types";
import {
  FiMessageSquare,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiFileText,
} from "react-icons/fi";
import { TbPin } from "react-icons/tb";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { RiChatHistoryLine } from "react-icons/ri";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation?: (id: string, isPinned: boolean) => void;
}

interface GroupedConversations {
  pinned: Conversation[];
  today: Conversation[];
  yesterday: Conversation[];
  thisWeek: Conversation[];
  thisMonth: Conversation[];
  older: Conversation[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(
    new Set()
  );

  // ... (Giữ nguyên logic groupConversationsByTime và useEffect)
  // ... (Bạn copy lại phần logic state và group từ code cũ vào đây, không thay đổi gì phần logic này)
  // Để ngắn gọn, tôi sẽ tập trung vào phần render ConversationItem bên dưới

  // --- LOGIC GIỮ NGUYÊN (Copy from your old code) ---
  const [groupedConversations, setGroupedConversations] =
    useState<GroupedConversations>({
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    });

  const groupConversationsByTime = (
    convs: Conversation[]
  ): GroupedConversations => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const groups: GroupedConversations = {
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    convs.forEach((conv) => {
      if (pinnedConversations.has(conv.id)) {
        groups.pinned.push(conv);
        return;
      }

      const convDate = new Date(conv.createdAt);
      const convDay = new Date(
        convDate.getFullYear(),
        convDate.getMonth(),
        convDate.getDate()
      );

      if (convDay.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (convDate > weekAgo) {
        groups.thisWeek.push(conv);
      } else if (convDate > monthAgo) {
        groups.thisMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  useEffect(() => {
    let filtered = conversations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(query) ||
          conv.id.toLowerCase().includes(query)
      );
    }
    const grouped = groupConversationsByTime(filtered);
    setGroupedConversations(grouped);
  }, [conversations, searchQuery, pinnedConversations]);

  const handleRenameStart = (id: string, currentTitle: string) => {
    setEditingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = (id: string) => {
    if (
      renameValue.trim() &&
      renameValue.trim() !== conversations.find((c) => c.id === id)?.title
    ) {
      onRenameConversation(id, renameValue.trim());
    }
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setRenameValue("");
  };

  const handlePinClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = new Set(pinnedConversations);
    const isPinned = newPinned.has(id);
    if (isPinned) {
      newPinned.delete(id);
    } else {
      newPinned.add(id);
    }
    setPinnedConversations(newPinned);
    onPinConversation?.(id, !isPinned);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteConversation(id);
    setShowDeleteConfirm(null);
    const newPinned = new Set(pinnedConversations);
    newPinned.delete(id);
    setPinnedConversations(newPinned);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const isTempConversation = (id: string) => id.startsWith("temp-");

  const getConversationIcon = () => (
    <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
  );

  const getStatusColor = (id: string) => {
    if (id.startsWith("temp-")) {
      return "from-yellow-500/20 to-yellow-600/20 text-yellow-400";
    }
    return "from-primary/20 to-secondary/20 text-primary";
  };

  // ✅ RENDER ITEM VỚI THÔNG TIN FILE
  const ConversationItem: React.FC<{ conv: Conversation }> = ({ conv }) => {
    const isActive = activeConversationId === conv.id;
    const isTemp = isTempConversation(conv.id);
    const isEditing = editingId === conv.id;
    const showDelete = showDeleteConfirm === conv.id;
    const isPinned = pinnedConversations.has(conv.id);

    // Helper: Lấy tên file đầu tiên để hiển thị (nếu có)
    const firstDocTitle =
      conv.documents && conv.documents.length > 0
        ? conv.documents[0].title
        : "";
    const docCount =
      conv.documentCount || (conv.documents ? conv.documents.length : 0);

    return (
      <div
        key={conv.id}
        onClick={() =>
          !isEditing && !showDelete && onSelectConversation(conv.id)
        }
        className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
          isActive
            ? "bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/40 shadow-lg shadow-primary/10"
            : "bg-accent/40 border border-primary/10 hover:border-primary/30 hover:bg-accent/60 hover:shadow-md"
        } ${isTemp ? "opacity-90" : ""} ${isPinned ? "ring-1 ring-primary/30" : ""}`}
      >
        {/* Delete Confirmation Modal (Giữ nguyên) */}
        {showDelete && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-red-500/10 backdrop-blur-sm rounded-xl">
            <div className="max-w-xs p-4 border rounded-lg shadow-lg bg-accent/90 border-red-500/30">
              <p className="mb-3 text-sm font-medium text-center text-white">
                Xóa cuộc trò chuyện này?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDelete(conv.id);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Xóa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelDelete();
                  }}
                  className="flex-1 bg-accent/60 hover:bg-accent/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getStatusColor(conv.id).split(" ")[0]} ${getStatusColor(conv.id).split(" ")[1]} flex items-center justify-center ${isTemp ? "animate-pulse" : ""}`}
          >
            {getConversationIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              // Phần Edit Input (Giữ nguyên)
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(conv.id);
                    if (e.key === "Escape") handleRenameCancel();
                  }}
                  className="flex-1 bg-accent/60 border border-primary/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameSubmit(conv.id);
                  }}
                  className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameCancel();
                  }}
                  className="p-1.5 rounded-lg bg-accent/60 hover:bg-accent/80 text-text-muted transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-white truncate">
                    {conv.title}
                  </h3>
                  {isTemp && (
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                      Chưa lưu
                    </span>
                  )}
                  {isPinned && (
                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      📌
                    </span>
                  )}
                </div>

                {/* 👇 HIỂN THỊ FILE & SỐ LƯỢNG (MỚI) */}
                {docCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 mb-0.5">
                    <FiFileText className="flex-shrink-0 w-3 h-3 text-primary/70" />
                    <span className="text-xs truncate text-text-muted">
                      <span className="font-medium text-primary/80">
                        {docCount} tài liệu
                      </span>
                      {firstDocTitle && (
                        <span className="ml-1 opacity-70">
                          • {firstDocTitle}{" "}
                          {docCount > 1 ? `+${docCount - 1}` : ""}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {/* 👆 KẾT THÚC PHẦN MỚI */}

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-text-muted">
                    {formatDate(conv.createdAt)}
                  </span>
                  <div
                    className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isTemp ? "hidden" : ""}`}
                  >
                    {/* Các nút action (Giữ nguyên) */}
                    <button
                      onClick={(e) => handlePinClick(conv.id, e)}
                      className={`p-1 transition-all duration-300 rounded-lg ${isPinned ? "bg-primary/20 text-primary" : "bg-accent/60 text-text-muted hover:text-primary hover:bg-accent/80"}`}
                      title={isPinned ? "Bỏ ghim" : "Ghim"}
                    >
                      <TbPin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameStart(conv.id, conv.title);
                      }}
                      className="p-1 transition-all duration-300 rounded-lg bg-accent/60 text-text-muted hover:text-primary hover:bg-accent/80"
                      title="Đổi tên"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(conv.id, e)}
                      className="p-1 text-red-400 transition-all duration-300 rounded-lg bg-red-500/10 hover:bg-red-500/20"
                      title="Xóa"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {isActive && !isEditing && !showDelete && (
          <div className="absolute transform -translate-y-1/2 top-1/2 right-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          </div>
        )}
      </div>
    );
  };

  // ... (Phần render chính return (...) giữ nguyên)
  return (
    <div className="flex flex-col h-full border-r bg-gradient-to-b from-accent/80 to-accent/60 backdrop-blur-sm border-primary/10">
      {/* Header, Button New, Search Box giữ nguyên */}
      <div className="p-4 border-b border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <RiChatHistoryLine className="w-5 h-5" />
            <span>Lịch sử chat</span>
          </h2>
          <span className="px-2 py-1 text-sm rounded text-text-muted bg-accent/40">
            {conversations.length} cuộc trò chuyện
          </span>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <div className="p-1.5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
            <FiPlus className="w-5 h-5" />
          </div>
          <span>Cuộc trò chuyện mới</span>
        </button>
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-accent/60 border border-primary/20 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <div className="absolute transform -translate-y-1/2 left-3 top-1/2 text-text-muted">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute transition-colors transform -translate-y-1/2 right-3 top-1/2 text-text-muted hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Logic render groups giữ nguyên, chỉ thay đổi ConversationItem đã update ở trên */}
        {Object.values(groupedConversations).every(
          (group) => group.length === 0
        ) ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-accent/40">
              <FiMessageSquare className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              {searchQuery
                ? "Không tìm thấy cuộc trò chuyện nào"
                : "Chưa có cuộc trò chuyện nào"}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="mt-4 text-sm font-medium text-primary hover:text-primary/80"
              >
                Bắt đầu cuộc trò chuyện đầu tiên
              </button>
            )}
          </div>
        ) : (
          <>
            {groupedConversations.pinned.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  📌 Đã ghim
                </div>
                <div className="space-y-1">
                  {groupedConversations.pinned.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {groupedConversations.today.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  Hôm nay
                </div>
                <div className="space-y-1">
                  {groupedConversations.today.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {groupedConversations.yesterday.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  Hôm qua
                </div>
                <div className="space-y-1">
                  {groupedConversations.yesterday.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {groupedConversations.thisWeek.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  Tuần này
                </div>
                <div className="space-y-1">
                  {groupedConversations.thisWeek.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {groupedConversations.thisMonth.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  Tháng này
                </div>
                <div className="space-y-1">
                  {groupedConversations.thisMonth.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {groupedConversations.older.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold tracking-wider uppercase text-primary/60">
                  Cũ hơn
                </div>
                <div className="space-y-1">
                  {groupedConversations.older.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer giữ nguyên */}
      <div className="p-4 border-t border-primary/10">
        <div className="text-xs text-center text-text-muted">
          <p>Chọn một cuộc trò chuyện để tiếp tục</p>
          <p className="mt-1">Hoặc tạo mới để bắt đầu</p>
        </div>
      </div>
    </div>
  );
};
