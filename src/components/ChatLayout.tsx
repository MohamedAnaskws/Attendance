// src/components/ChatLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { connectWebSocket, addMessageHandler, disconnectWebSocket, isWebSocketConnected } from '@/services/api';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import MainLayout from './layout/MainLayout';

const ChatLayout: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const {
    handleWebSocketMessage,
    loadConversations,
    setOnlineUser,
    conversations,
    currentConversation,
    selectConversation
  } = useChatStore();
  const initialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [isChatReady, setIsChatReady] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setIsChatReady(false);
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const initChat = async () => {
      try {
        await loadConversations();

        const ws = connectWebSocket(token, handleWebSocketMessage, user.id);

        if (!ws) {
          setIsChatReady(true);
          return;
        }

        unsubscribeRef.current = addMessageHandler(handleWebSocketMessage);
        setOnlineUser(user.id, true);

        const lastConversationId = localStorage.getItem('last_conversation_id');
        if (lastConversationId) {
          const lastConv = useChatStore.getState().conversations.find(
            (c) => c.id === parseInt(lastConversationId)
          );
          if (lastConv) await selectConversation(lastConv);
        }

        setIsChatReady(true);
      } catch (error) {
        console.error('ChatLayout init failed:', error);
        setIsChatReady(true);
        setTimeout(() => {
          if (initialized.current && token) {
            connectWebSocket(token, handleWebSocketMessage, user.id);
          }
        }, 5000);
      }
    };

    const timer = setTimeout(initChat, 300);

    return () => {
      clearTimeout(timer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      disconnectWebSocket();
      initialized.current = false;
      setIsChatReady(false);
    };
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentConversation) {
      localStorage.setItem('last_conversation_id', currentConversation.id.toString());
    }
  }, [currentConversation]);

  useEffect(() => {
    if (!isChatReady || !token) return;
    const check = setInterval(() => {
      if (!isWebSocketConnected() && token && user) {
        connectWebSocket(token, handleWebSocketMessage, user.id);
      }
    }, 10000);
    return () => clearInterval(check);
  }, [isChatReady, token, user, handleWebSocketMessage]);

  if (!isChatReady) {
    return (
      <MainLayout>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Connecting to chat...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col flex-shrink-0">
        {/* <div className="p-4 border-b bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              Chat
            </h1>
            <button
              onClick={logout}
              title="Logout"
              className="text-gray-500 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 px-2 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Dashboard
          </button>
        </div> */}
        <div className="flex-1 overflow-hidden">
          <ChatList />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
    </MainLayout>
  );
};

export default ChatLayout;
