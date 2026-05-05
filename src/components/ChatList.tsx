// src/components/ChatList.tsx - Complete updated version

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import CreateGroupModal from './CreateGroupModal';
import ArchivedChats from './ArchivedChats';
import { getOrCreateOneToOne, getUsers } from '@/services/api';
import { toast } from 'react-toastify';
import { User } from '@/types';

const ChatList: React.FC = () => {
  const { user, isAdmin } = useAuthStore();
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    loadConversations, 
    onlineUsers,
    archiveConversation,
    loadArchivedConversations
  } = useChatStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadConversations();
    loadArchivedConversations();
  }, [loadConversations, loadArchivedConversations]);

  useEffect(() => {
    if (showUserModal) {
      fetchUsers();
    }
  }, [showUserModal]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers();
      setUsers(response.data.filter((u) => u.id !== user?.id));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

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

  const isUserOnline = (conversation: any) => {
    if (conversation.conversation_type === 'GROUP') return false;
    const otherUser = conversation.participants?.find((p: any) => p.user.id !== user?.id)?.user;
    return onlineUsers[otherUser?.id] || false;
  };

  const formatLastMessage = (message: any) => {
    if (!message) return 'No messages yet';
    if (message.is_deleted) return 'Message deleted';
    if (message.message_type === 'IMAGE') return '📷 Photo';
    if (message.message_type === 'FILE') return `📎 ${message.file_name}`;
    const text = message.message_text || '';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
  };

  const handleStartChat = async (selectedUser: User) => {
    try {
      const response = await getOrCreateOneToOne(selectedUser.id);
      await loadConversations();
      setTimeout(async () => {
        const freshConvs = useChatStore.getState().conversations;
        const found = freshConvs.find((c) => c.id === response.data.id);
        if (found) {
          selectConversation(found);
        } else {
          selectConversation(response.data as any);
        }
      }, 100);
      setShowUserModal(false);
      setUserSearch('');
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleArchive = async (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    if (window.confirm('Archive this chat? You can find it in Archived chats.')) {
      await archiveConversation(conversationId);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    selectConversation(conversation);
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = getConversationName(conv);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUsers = users.filter((u) => {
    const fullName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
    return (
      fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 bg-white border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}</h2>
              <p className="text-xs text-gray-500">{isAdmin() ? 'Admin' : 'Staff'}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setShowUserModal(true)}
            className="w-full bg-white border border-primary-500 text-primary-500 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            New Chat
          </button>

          {isAdmin() && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Group
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No conversations yet</p>
              <p className="text-sm">Start by messaging a user</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const name = getConversationName(conv);
              const isActive = currentConversation?.id === conv.id;
              const online = isUserOnline(conv);

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group p-4 hover:bg-gray-100 cursor-pointer transition-colors relative ${
                    isActive ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {getConversationAvatar(conv)}
                      </div>
                      {online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold truncate">{name}</h3>
                        <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                          {conv.last_message && formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{formatLastMessage(conv.last_message)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {conv.unread_count > 0 && (
                        <div className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </div>
                      )}
                      
                      {/* Archive Button */}
                      <button
                        onClick={(e) => handleArchive(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                        title="Archive chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Archived Chats Section */}
        <ArchivedChats onSelectConversation={handleSelectConversation} />
      </div>

      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />

      {/* New Chat Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Start New Chat</h2>
              <button
                onClick={() => { setShowUserModal(false); setUserSearch(''); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                autoFocus
              />
              <div className="space-y-1 overflow-y-auto flex-1">
                {loadingUsers ? (
                  <p className="text-center text-gray-500 py-4">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartChat(u)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {(u.first_name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatList;