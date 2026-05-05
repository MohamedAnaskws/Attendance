// D:\Projects\full updated frontend\src\services\chatLogsApi.ts

import axios from 'axios';
import { getToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['ngrok-skip-browser-warning'] = 'true';

  return config;
});;

// ============================================
// Chat Logs APIs (Owner Only)
// ============================================

export interface ChatMessageLog {
  id: number;
  conversation_id: number;
  conversation_name: string;
  conversation_type: 'ONE_TO_ONE' | 'GROUP';
  sender: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  message_text?: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_edited: boolean;
  edit_count: number;
  is_deleted: boolean;
  reply_to_id?: number;
  mentioned_user_ids?: number[];
  created_at: string;
  updated_at: string;
  edited_at?: string;
  deleted_at?: string;
  deleted_by?: number;
  reactions_count: number;
  statuses: Array<{
    user_id: number;
    status: string;
    updated_at: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: Record<string, any>;
}

export interface ConversationInfo {
  id: number;
  conversation_type: string;
  group_name?: string;
  participant_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatStatistics {
  total_messages: number;
  total_conversations: number;
  active_conversations: number;
  messages_by_type: Record<string, number>;
  messages_by_day: Array<{ date: string; count: number }>;
  top_active_users: Array<{
    id: number;
    name: string;
    username: string;
    email: string;
    message_count: number;
  }>;
}

export const getChatMessages = async (params: {
  page?: number;
  per_page?: number;
  conversation_id?: number;
  user_id?: number;
  search?: string;
  message_type?: string;
  from_date?: string;
  to_date?: string;
  include_deleted?: boolean;
}): Promise<PaginatedResponse<ChatMessageLog>> => {
  const response = await api.get('/api/chat-logs/messages', { params });
  return response.data;
};

export const getChatConversations = async (): Promise<{ success: boolean; data: ConversationInfo[]; total: number }> => {
  const response = await api.get('/api/chat-logs/conversations');
  return response.data;
};

export const getChatUsers = async (): Promise<{ success: boolean; data: any[]; total: number }> => {
  const response = await api.get('/api/chat-logs/users');
  return response.data;
};

export const getChatStatistics = async (): Promise<{ success: boolean; data: ChatStatistics }> => {
  const response = await api.get('/api/chat-logs/statistics');
  return response.data;
};

export default api;