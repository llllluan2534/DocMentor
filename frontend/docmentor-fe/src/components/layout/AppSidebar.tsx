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
  chatProps?: ChatProps; // Optional: Chỉ truyền vào khi ở trang Chat
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

  // --- STATE CHO CHAT SIDEBAR ---
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

  // --- 1. FETCH USER DATA (Fix lỗi hiển thị tên) ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await realAuthService.getCurrentUser();
        console.log("Sidebar User Data:", currentUser); // Debug
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

  // --- 2. LOGIC GROUP CHAT ---
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
        if (pinnedConversations.has(conv.id)) {
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

      const sortDesc = (a: Conversation, b: Conversation) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      };

      groups.pinned.sort(sortDesc);
      groups.today.sort(sortDesc);
      groups.yesterday.sort(sortDesc);
      groups.thisWeek.sort(sortDesc);
      groups.thisMonth.sort(sortDesc);
      groups.older.sort(sortDesc);

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

  // --- HELPER FUNCTIONS ---
  const handlePinClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = new Set(pinnedConversations);
    newPinned.has(id) ? newPinned.delete(id) : newPinned.add(id);
    setPinnedConversations(newPinned);
    chatProps?.onPinConversation?.(id, !newPinned.has(id));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // --- 3. DISPLAY NAME LOGIC (FIX LỖI KHÁCH) ---
  // Ưu tiên full_name -> email prefix -> "Khách"
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Khách";
  const avatarSrc = user?.avatar_url; // Backend trả về avatar_url
  const initial = displayName.charAt(0).toUpperCase();

  // --- 4. SUB-COMPONENT: Navigation Links ---
  const NavLinks = () => (
    <div className="mb-6 space-y-1">
      <div className="px-4 mb-2 text-xs font-semibold tracking-wider uppercase text-text-muted">
        Menu Chính
      </div>
      {[
        {
          label: "Dashboard",
          path: "/user/dashboard",
          icon: <FiHome className="w-4 h-4" />,
        },
        {
          label: "Tài liệu của tôi",
          path: "/user/documents",
          icon: <FiFolder className="w-4 h-4" />,
        },
        {
          label: "Chat AI",
          path: "/user/chat",
          icon: <HiOutlineChatBubbleLeftRight className="w-4 h-4" />,
        },
      ].map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${
            location.pathname.startsWith(item.path)
              ? "bg-primary/20 text-primary font-medium border border-primary/30"
              : "text-text-muted hover:bg-accent hover:text-white"
          }`}
        >
          {item.icon}
          <span className="text-sm">{item.label}</span>
        </Link>
      ))}
      <Link
        to="/user/settings"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-text-muted hover:bg-accent hover:text-white transition-all"
      >
        <FiSettings className="w-4 h-4" />
        <span className="text-sm">Cài đặt</span>
      </Link>
    </div>
  );

  // --- 5. RENDER MAIN ---
  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r border-accent z-30 transition-transform duration-300 w-72 flex flex-col ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 bg-gradient-to-b from-background to-accent/20`}
    >
      {/* --- PHẦN 1: NAVIGATION MENU --- */}
      <div className="flex-shrink-0 pt-4">
        <NavLinks />
      </div>

      <div className="mx-4 mb-2 border-t border-primary/10"></div>

      {/* --- PHẦN 2: CHAT HISTORY (Chỉ hiện khi có chatProps) --- */}
      {chatProps && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
                <RiChatHistoryLine /> Lịch sử Chat
              </h2>
              <span className="text-xs bg-accent/50 px-2 py-0.5 rounded text-text-muted">
                {chatProps.conversations.length}
              </span>
            </div>

            <button
              onClick={chatProps.onNewConversation}
              className="flex items-center justify-center w-full gap-2 py-2 mb-3 text-sm font-medium transition-all border bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-xl"
            >
              <FiPlus /> Cuộc trò chuyện mới
            </button>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent/40 border border-primary/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-primary/40 focus:outline-none"
              />
              <div className="absolute left-2.5 top-1.5 text-text-muted">
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

          {/* List Chat Scrollable */}
          <div className="flex-1 px-2 pb-2 space-y-4 overflow-y-auto custom-scrollbar">
            {Object.entries(groupedConversations).map(([key, group]) => {
              if (group.length === 0) return null;
              const labels: Record<string, string> = {
                pinned: "📌 Đã ghim",
                today: "Hôm nay",
                yesterday: "Hôm qua",
                thisWeek: "Tuần này",
                thisMonth: "Tháng này",
                older: "Cũ hơn",
              };
              return (
                <div key={key}>
                  <div className="px-2 py-1 text-[10px] font-bold text-primary/50 uppercase tracking-widest sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    {labels[key]}
                  </div>
                  <div className="space-y-0.5">
                    {group.map((conv: Conversation) => {
                      const isActive =
                        chatProps.activeConversationId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() =>
                            chatProps.onSelectConversation(conv.id)
                          }
                          className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-accent/40 border border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Icon Chat */}
                            <div
                              className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-primary/20 text-primary" : "bg-accent/40 text-text-muted"}`}
                            >
                              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h3
                                  className={`text-sm truncate ${isActive ? "text-white font-medium" : "text-gray-300"}`}
                                >
                                  {conv.title}
                                </h3>
                                {/* Actions on Hover */}
                                <div className="absolute hidden gap-1 rounded shadow-sm group-hover:flex bg-background/80 right-2 top-2">
                                  <button
                                    onClick={(e) => handlePinClick(conv.id, e)}
                                    className="p-1 hover:text-primary"
                                  >
                                    <TbPin size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      chatProps.onRenameConversation(
                                        conv.id,
                                        prompt("Tên mới:", conv.title) ||
                                          conv.title
                                      );
                                    }}
                                    className="p-1 hover:text-blue-400"
                                  >
                                    <FiEdit2 size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      chatProps.onDeleteConversation(conv.id);
                                    }}
                                    className="p-1 hover:text-red-400"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-text-muted">
                                  {formatDate(conv.updatedAt || conv.createdAt)}
                                </span>
                                {(conv.documentCount || 0) > 0 && (
                                  <span className="text-[10px] flex items-center gap-0.5 text-primary/70 bg-primary/5 px-1 rounded">
                                    <FiFileText size={10} />{" "}
                                    {conv.documentCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PHẦN 3: USER PROFILE (FOOTER) --- */}
      <div className="p-3 mt-auto border-t border-primary/10 bg-accent/10">
        <div className="flex items-center gap-3 p-2 transition-colors cursor-pointer rounded-xl hover:bg-accent/30 group">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1.5px]">
            <div className="flex items-center justify-center w-full h-full overflow-hidden rounded-full bg-background">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs font-bold text-white">{initial}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-text-muted truncate">
              {user?.email}
            </p>
          </div>

          {/* Logout Button (hiện khi hover) */}
          <button
            onClick={handleLogout}
            className="p-2 transition-all opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400"
            title="Đăng xuất"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
