// ============================================
// MessageList.tsx
// ============================================
import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat.types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  isReplying: boolean;
  onEditMessage?: (id: string, text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isReplying,
  onEditMessage,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    //endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  return (
    <div className="flex-1 py-6 space-y-6">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onEditMessage={onEditMessage} // ✅ Truyền tiếp xuống Bubble
        />
      ))}

      {isReplying && (
        <div className="flex items-start justify-start gap-3 pl-1 animate-fade-in">
          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 shadow-lg rounded-xl bg-gradient-to-br from-primary to-secondary shadow-primary/30">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="px-6 py-4 border rounded-tl-sm shadow-lg bg-accent/60 backdrop-blur-sm border-primary/20 rounded-2xl">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              ...
            </div>
            <div className="bg-[#1E1E2E] border border-white/10 rounded-2xl px-5 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                ...
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={endOfMessagesRef} />
    </div>
  );
};
