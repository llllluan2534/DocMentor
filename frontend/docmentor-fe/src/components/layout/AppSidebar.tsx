// src/components/layout/AppSidebar.tsx

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Conversation } from "@/types/chat.types";
import { realAuthService, User } from "@/services/auth/authService";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiHome,
  FiFolder,
  FiSettings,
  FiLogOut,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiSidebar,
} from "react-icons/fi";
import { TbPin } from "react-icons/tb";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { RiChatHistoryLine } from "react-icons/ri";

// --- TYPES ---
interface ChatProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation?: (id: string, isPinned: boolean) => void;
}

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatProps?: ChatProps;
}

interface GroupedConversations {
  pinned: Conversation[];
  today: Conversation[];
  yesterday: Conversation[];
  thisWeek: Conversation[];
  thisMonth: Conversation[];
  older: Conversation[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  chatProps,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  // --- STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(
    new Set()
  );
  const [groupedConversations, setGroupedConversations] =
    useState<GroupedConversations>({
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    });

  // --- 1. FETCH USER ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await realAuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await realAuthService.logout();
    setUser(null);
    navigate("/login");
  };

  // --- 2. GROUP LOGIC ---
  useEffect(() => {
    if (!chatProps) return;

    const groupConversationsByTime = (convs: Conversation[]) => {
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
        if (pinnedConversations.has(conv.id) || conv.isPinned) {
          groups.pinned.push(conv);
          return;
        }

        const dateStr = conv.updatedAt || conv.createdAt;
        const convDate = new Date(dateStr);
        const convDay = new Date(
          convDate.getFullYear(),
          convDate.getMonth(),
          convDate.getDate()
        );

        if (convDay.getTime() === today.getTime()) groups.today.push(conv);
        else if (convDay.getTime() === yesterday.getTime())
          groups.yesterday.push(conv);
        else if (convDate > weekAgo) groups.thisWeek.push(conv);
        else if (convDate > monthAgo) groups.thisMonth.push(conv);
        else groups.older.push(conv);
      });

      // Sort recent first
      const sortDesc = (a: Conversation, b: Conversation) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime();

      Object.keys(groups).forEach((key) =>
        groups[key as keyof GroupedConversations].sort(sortDesc)
      );
      return groups;
    };

    let filtered = chatProps.conversations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = chatProps.conversations.filter((conv) =>
        conv.title.toLowerCase().includes(query)
      );
    }
    setGroupedConversations(groupConversationsByTime(filtered));
  }, [chatProps?.conversations, searchQuery, pinnedConversations]);

  // --- HANDLERS ---
  const handleRenameStart = (id: string, currentTitle: string) => {
    setEditingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = (id: string) => {
    if (
      renameValue.trim() &&
      renameValue.trim() !==
        chatProps?.conversations.find((c) => c.id === id)?.title
    ) {
      chatProps?.onRenameConversation(id, renameValue.trim());
    }
    setEditingId(null);
  };

  const handlePinClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = new Set(pinnedConversations);
    if (newPinned.has(id)) newPinned.delete(id);
    else newPinned.add(id);
    setPinnedConversations(newPinned);
    chatProps?.onPinConversation?.(id, !pinnedConversations.has(id));
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const handleConfirmDelete = (id: string) => {
    chatProps?.onDeleteConversation(id);
    setShowDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins}p`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getStatusColor = (id: string) =>
    id.startsWith("temp-")
      ? "from-yellow-500/20 to-yellow-600/20 text-yellow-400"
      : "from-primary/20 to-secondary/20 text-primary";

  // --- SUB-COMPONENT: CONVERSATION ITEM ---
  const ConversationItem: React.FC<{ conv: Conversation }> = ({ conv }) => {
    const isActive = chatProps?.activeConversationId === conv.id;
    const isTemp = conv.id.startsWith("temp-");
    const isEditing = editingId === conv.id;
    const showDelete = showDeleteConfirm === conv.id;
    const isPinned = pinnedConversations.has(conv.id) || conv.isPinned;
    const docCount =
      conv.documentCount || (conv.documents ? conv.documents.length : 0);

    return (
      <div
        onClick={() =>
          !isEditing && !showDelete && chatProps?.onSelectConversation(conv.id)
        }
        className={`group relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
          isActive
            ? "bg-primary/10 border-primary/30 shadow-md shadow-primary/5"
            : "bg-transparent border-transparent hover:bg-white/5"
        }`}
      >
        {/* DELETE CONFIRM OVERLAY */}
        {showDelete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#100D20]/95 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete(conv.id);
                }}
                className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Xóa
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(null);
                }}
                className="px-3 py-1 text-xs font-medium text-gray-300 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${getStatusColor(conv.id)} flex items-center justify-center mt-0.5 ${isTemp ? "animate-pulse" : ""}`}
          >
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
          </div>

          <div className="relative flex-1 min-w-0 overflow-hidden">
            {isEditing ? (
              // --- EDIT MODE ---
              <div className="flex items-center gap-1 h-9">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(conv.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 min-w-0 bg-[#100D20] border border-primary/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameSubmit(conv.id);
                  }}
                  className="p-1.5 text-green-400 bg-green-400/10 rounded hover:bg-green-400/20"
                >
                  <FiCheck size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(null);
                  }}
                  className="p-1.5 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              // --- VIEW MODE ---
              <>
                <div className="flex items-center justify-between">
                  {/* Fix lỗi đè chữ: thêm pr-14 để chừa chỗ cho buttons */}
                  <h3
                    className={`text-sm truncate pr-14 ${isActive ? "text-white font-medium" : "text-gray-300 group-hover:text-white"}`}
                  >
                    {conv.title}
                  </h3>

                  {/* Status Badges */}
                  {isPinned && (
                    <TbPin
                      size={12}
                      className="text-primary absolute top-0.5 right-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-500">
                    {formatDate(conv.updatedAt || conv.createdAt)}
                  </span>
                  {docCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-full border border-primary/10">
                      <FiFileText size={10} /> {docCount}
                    </span>
                  )}
                </div>

                {/* --- ACTION BUTTONS (Hover) --- */}
                <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-0.5 bg-[#100D20] shadow-lg border border-white/10 rounded-lg p-0.5 z-10 animate-fade-in">
                  <button
                    onClick={(e) => handlePinClick(conv.id, e)}
                    className={`p-1.5 rounded-md transition-colors ${isPinned ? "text-primary bg-primary/10" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                    title={isPinned ? "Bỏ ghim" : "Ghim"}
                  >
                    <TbPin size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameStart(conv.id, conv.title);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title="Đổi tên"
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title="Xóa"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Khách";
  const avatarSrc = user?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  // --- RENDER MAIN ---
  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#100D20] border-r border-white/5 z-30 transition-transform duration-300 w-72 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* 1. HEADER SIDEBAR (Đồng bộ h-14) */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 border-b h-14 border-white/5">
        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
          Menu Chính
        </span>
        {/* ✅ Nút Đóng Sidebar */}
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 rounded hover:text-white hover:bg-white/5 transition-colors"
        >
          <FiSidebar className="w-4 h-4 transform rotate-180" />
        </button>
      </div>

      {/* 2. Navigation */}
      <div className="flex-shrink-0 px-2 py-3">
        <nav className="space-y-1">
          {[
            { label: "Dashboard", path: "/user/dashboard", icon: <FiHome /> },
            {
              label: "Tài liệu của tôi",
              path: "/user/documents",
              icon: <FiFolder />,
            },
            {
              label: "Chat AI",
              path: "/user/chat",
              icon: <HiOutlineChatBubbleLeftRight />,
            },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${location.pathname.startsWith(item.path) ? "bg-primary/10 text-primary font-medium border border-primary/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <Link
            to="/user/settings"
            className="flex items-center gap-3 px-3 py-2 mx-2 text-sm text-gray-400 transition-all rounded-lg hover:text-white hover:bg-white/5"
          >
            <FiSettings /> Cài đặt
          </Link>
        </nav>
      </div>

      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      {/* 3. Chat History */}
      {chatProps ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                <RiChatHistoryLine /> Lịch sử ({chatProps.conversations.length})
              </h2>
              <button
                onClick={chatProps.onNewConversation}
                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                title="Chat mới"
              >
                <FiPlus size={16} />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A162D] border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:border-primary/50 focus:outline-none placeholder:text-gray-600"
              />
              <div className="absolute left-2.5 top-2 text-gray-500">
                <svg
                  className="w-3.5 h-3.5"
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
            </div>
          </div>

          <div className="flex-1 px-3 pb-2 space-y-4 overflow-y-auto custom-scrollbar">
            {Object.values(groupedConversations).every(
              (g) => g.length === 0
            ) ? (
              <div className="py-10 text-xs text-center text-gray-500">
                <FiMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              Object.entries(groupedConversations).map(([key, group]) => {
                if (group.length === 0) return null;
                const labels: Record<string, string> = {
                  pinned: "Đã ghim",
                  today: "Hôm nay",
                  yesterday: "Hôm qua",
                  thisWeek: "Tuần này",
                  thisMonth: "Tháng này",
                  older: "Cũ hơn",
                };
                return (
                  <div key={key}>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase sticky top-0 bg-[#100D20]/95 backdrop-blur-sm z-10">
                      {labels[key]}
                    </div>
                    <div className="space-y-1">
                      {group.map((conv: Conversation) => (
                        <ConversationItem key={conv.id} conv={conv} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-gray-500">
          Chọn "Chat AI" để xem lịch sử
        </div>
      )}

      {/* 4. User Profile */}
      <div className="p-3 mt-auto border-t border-white/5 bg-[#1A162D]/50">
        <div className="flex items-center gap-3 p-2 transition-colors cursor-pointer rounded-xl hover:bg-white/5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px]">
            <div className="w-full h-full rounded-full bg-[#100D20] flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} className="object-cover w-full h-full" />
              ) : (
                <span className="text-xs font-bold text-white">{initial}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
