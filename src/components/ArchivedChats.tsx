// src/components/ArchivedChats.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

interface ArchivedChatsProps {
  onSelectConversation: (conversation: any) => void;
}

const ArchivedChats: React.FC<ArchivedChatsProps> = ({ onSelectConversation }) => {
  const { user } = useAuthStore();
  const { archivedConversations, loadArchivedConversations, unarchiveConversation, onlineUsers } = useChatStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && archivedConversations.length === 0) {
      loadArchivedConversations();
    }
  }, [isExpanded, archivedConversations.length, loadArchivedConversations]);

  const getConversationName = (conversation: any) => {
    if (conversation.conversation_type === 'GROUP') {
      return conversation.group_name || 'Group';
    }
    const otherUser = conversation.participants?.find((p: any) => p.user.id !== user?.id)?.user;
    return otherUser ? (otherUser.first_name ? `${otherUser.first_name} ${otherUser.last_name || ''}`.trim() : otherUser.username) : 'Unknown';
  };

  const getConversationAvatar = (conversation: any) => {
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  const formatLastMessage = (message: any) => {
    if (!message) return 'No messages yet';
    if (message.is_deleted) return 'Message deleted';
    if (message.message_type === 'IMAGE') return '📷 Photo';
    if (message.message_type === 'FILE') return `📎 ${message.file_name}`;
    const text = message.message_text || '';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
  };

  const handleUnarchive = async (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    await unarchiveConversation(conversationId);
  };

  const archivedCount = archivedConversations.length;

  if (archivedCount === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 mt-2">
      {/* Archived Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v4" />
          </svg>
          <span className="text-sm font-medium text-gray-600">Archived</span>
          {archivedCount > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {archivedCount}
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Archived Conversations List */}
      {isExpanded && (
        <div className="bg-gray-50">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : archivedConversations.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              No archived chats
            </div>
          ) : (
            archivedConversations.map((conv) => {
              const name = getConversationName(conv);
              // FIXED: Check if otherUserId exists before using as index
              const otherUserId = conv.participants?.find((p: any) => p.user.id !== user?.id)?.user?.id;
              const isOnline = conv.conversation_type !== 'GROUP' && otherUserId ? onlineUsers[otherUserId] : false;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv);
                    setIsExpanded(false);
                  }}
                  className="relative pl-10 pr-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                        {getConversationAvatar(conv)}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium truncate text-sm">{name}</h3>
                        <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                          {conv.last_message && formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{formatLastMessage(conv.last_message)}</p>
                    </div>

                    <button
                      onClick={(e) => handleUnarchive(e, conv.id)}
                      className="p-1.5 text-gray-400 hover:text-primary-500 rounded-full hover:bg-white transition-colors"
                      title="Unarchive"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v4" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ArchivedChats;