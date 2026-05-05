// src/services/api.ts
import axios from 'axios';
import type { User, Conversation, Message, LoginResponse, Template, TemplateCreate, TemplateUpdate, EditHistoryEntry } from '@/types';

// Get API URL from environment variable or fallback to localhost
// Using type assertion to avoid TypeScript errors with import.meta.env
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000';

console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 WebSocket Base URL:', WS_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================
// WebSocket Types - Singleton Pattern
// ============================================
export type MessageHandler = (data: any) => void;

let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let isConnecting = false;
let currentToken: string | null = null;
let currentUserId: number | null = null;
const messageHandlers: MessageHandler[] = [];
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let isIntentionalClose = false;

// Heartbeat to keep connection alive
const startHeartbeat = () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const connectWebSocket = (token: string, onMessage?: MessageHandler, userId?: number): WebSocket | null => {
  // If we already have a healthy connection with the same token, reuse it
  if (ws && ws.readyState === WebSocket.OPEN && currentToken === token) {
    console.log('✅ Reusing existing WebSocket connection');
    if (onMessage && !messageHandlers.includes(onMessage)) {
      messageHandlers.push(onMessage);
    }
    return ws;
  }
  
  // If connection is CONNECTING, wait for it (don't create new one)
  if (ws && ws.readyState === WebSocket.CONNECTING) {
    console.log('⏳ WebSocket already connecting, will queue handler');
    if (onMessage && !messageHandlers.includes(onMessage)) {
      messageHandlers.push(onMessage);
    }
    return ws;
  }
  
  // Close existing connection if any
  if (ws) {
    console.log('🔌 Closing existing WebSocket connection');
    isIntentionalClose = true;
    try {
      ws.close(1000, 'New connection');
    } catch (e) {
      console.warn('Error closing existing websocket:', e);
    }
    ws = null;
  }
  
  // Clear any pending reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  isConnecting = true;
  currentToken = token;
  currentUserId = userId || null;
  isIntentionalClose = false;
  
  // Build WebSocket URL
  const wsUrl = `${WS_BASE_URL}/api/chat/ws?token=${token}`;
  
  console.log('🔌 Creating new WebSocket connection:', wsUrl.replace(token, '***HIDDEN***'));
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      reconnectAttempts = 0;
      isConnecting = false;
      startHeartbeat();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data.type);
        
        // Handle ping response
        if (data.type === 'pong') {
          return;
        }
        
        // Handle connection confirmation
        if (data.type === 'connection') {
          console.log('🔌 Connection confirmed for user:', data.data.user_id);
          currentUserId = data.data.user_id;
        }
        
        // Call all registered handlers
        messageHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error('❌ Error in message handler:', err);
          }
        });
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      isConnecting = false;
    };
    
    ws.onclose = (event) => {
      console.log(`🔌 WebSocket disconnected, code: ${event.code}, reason: ${event.reason || 'No reason'}`);
      isConnecting = false;
      stopHeartbeat();
      
      // Don't reconnect if intentional close
      if (isIntentionalClose || event.code === 1000) {
        console.log('🔌 Intentional disconnect, not reconnecting');
        isIntentionalClose = false;
        return;
      }
      
      // Reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && currentToken) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeout = setTimeout(() => {
          if (currentToken) {
            connectWebSocket(currentToken, undefined, currentUserId || undefined);
          }
        }, delay);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnection attempts reached. Please refresh the page.');
      }
    };
    
    // Add the new handler
    if (onMessage && !messageHandlers.includes(onMessage)) {
      messageHandlers.push(onMessage);
    }
    
    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    isConnecting = false;
    return null;
  }
};

export const disconnectWebSocket = () => {
  console.log('🔌 Disconnecting WebSocket intentionally');
  isIntentionalClose = true;
  stopHeartbeat();
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (ws) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Intentional disconnect');
    }
    ws = null;
  }
  
  currentToken = null;
  currentUserId = null;
  isConnecting = false;
  reconnectAttempts = 0;
  // Clear handlers
  messageHandlers.length = 0;
};

export const sendWebSocketMessage = (message: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('📤 WebSocket message sent:', message.type);
    return true;
  } else {
    console.warn('⚠️ WebSocket not connected, message not sent:', message.type);
    return false;
  }
};

export const isWebSocketConnected = (): boolean => {
  return ws !== null && ws.readyState === WebSocket.OPEN;
};

export const addMessageHandler = (handler: MessageHandler) => {
  if (!messageHandlers.includes(handler)) {
    messageHandlers.push(handler);
  }
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) messageHandlers.splice(index, 1);
  };
};

// ============================================
// Auth APIs
// ============================================
export const login = (username: string, password: string) => 
  api.post<LoginResponse>('/api/auth/login', { username, password });
export const getCurrentUser = () => api.get<User>('/api/auth/me');

// ============================================
// User APIs
// ============================================
export const getUsers = () => api.get<User[]>('/api/users');
export const getActiveUsers = () => api.get<User[]>('/api/users/active');

// ============================================
// Chat APIs
// ============================================
export const getConversations = () => api.get<Conversation[]>('/api/chat/conversations');
export const getOrCreateOneToOne = (userId: number) => 
  api.post<Conversation>(`/api/chat/conversations/one-to-one/${userId}`);
export const createGroup = (groupData: { group_name: string; member_ids: number[]; group_avatar?: string }) => 
  api.post<Conversation>('/api/chat/groups', groupData);
export const addGroupMembers = (conversationId: number, userIds: number[]) => 
  api.post(`/api/chat/groups/${conversationId}/members`, { user_ids: userIds });
export const removeGroupMember = (conversationId: number, userId: number) => 
  api.delete(`/api/chat/groups/${conversationId}/members/${userId}`);
export const getMessages = (conversationId: number, limit = 50, offset = 0) => 
  api.get<{ messages: Message[]; total: number; has_more: boolean }>(
    `/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
  );
export const sendMessage = (formData: FormData) => 
  api.post<Message>('/api/chat/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const editMessage = (messageId: number, text: string) => 
  api.put(`/api/chat/messages/${messageId}`, { message_text: text });
export const deleteMessage = (messageId: number, forEveryone = false) => 
  api.delete(`/api/chat/messages/${messageId}?for_everyone=${forEveryone}`);
export const addReaction = (messageId: number, reaction: string) => 
  api.post(`/api/chat/messages/${messageId}/reactions`, { reaction });
export const markConversationRead = (conversationId: number) => 
  api.post<{ message: string; unread_count: number }>(`/api/chat/conversations/${conversationId}/read`);

// Template APIs
export const getTemplates = (favoriteOnly?: boolean, search?: string) => {
  let url = '/api/templates';
  const params = new URLSearchParams();
  if (favoriteOnly) params.append('favorite_only', 'true');
  if (search) params.append('search', search);
  if (params.toString()) url += `?${params.toString()}`;
  return api.get<Template[]>(url);
};

export const createTemplate = (data: TemplateCreate) => 
  api.post<Template>('/api/templates', data);

export const updateTemplate = (templateId: number, data: TemplateUpdate) => 
  api.put<Template>(`/api/templates/${templateId}`, data);

export const deleteTemplate = (templateId: number) => 
  api.delete(`/api/templates/${templateId}`);

export const useTemplate = (templateId: number) => 
  api.post<Template>(`/api/templates/${templateId}/use`);

// Archive APIs
export const archiveConversation = (conversationId: number) => 
  api.post('/api/chat/conversations/archive', { conversation_id: conversationId });

export const unarchiveConversation = (conversationId: number) => 
  api.post('/api/chat/conversations/unarchive', { conversation_id: conversationId });

export const getArchivedConversations = () => 
  api.get<Conversation[]>('/api/chat/conversations/archived');

// Edit History API
export const getMessageEditHistory = (messageId: number) => 
  api.get<EditHistoryEntry[]>(`/api/chat/messages/${messageId}/edit-history`);

export default api;