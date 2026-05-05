// src/types/index.ts

export interface User {
  id: number;
  user_no?: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_no?: string;
  profile_image?: string;
  roleid: number;
  department_id?: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  conversation_type: 'ONE_TO_ONE' | 'GROUP';
  group_name?: string;
  is_archived?: boolean;
  archived_at?: string;
  group_avatar?: string;
  participants: Participant[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number;
  user: User;
  role: 'MEMBER' | 'ADMIN';
  is_active: boolean;
  last_read_at?: string;
  joined_at: string;
}

export interface Reaction {
  user_id: number;
  reaction: string;
  username: string;
}

export interface EditHistoryEntry {
  id: number;
  previous_text?: string;
  edit_number: number;
  edited_at: string;
  edited_by_username: string;
  edited_by_name?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender?: User;
  message_text?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  is_edited: boolean;
  edit_count?: number;
  is_deleted: boolean;
  reply_to_id?: number;
  reply_to_message?: Message;
  mentioned_user_ids?: number[];
  mentioned_users?: User[];
  reactions: Reaction[];
  statuses?: Record<number, string>;
  edit_history?: EditHistoryEntry[];
  created_at: string;
  updated_at: string;
  edited_at?: string;
  deleted_by?: number;
  deleted_at?: string;
}

export interface ReplyInfo {
  message_id: number;
  sender_name: string;
  message_text?: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  file_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  permissions: any[];
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface Template {
  id: number;
  user_id: number;
  title: string;
  message_text: string;
  icon: string;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreate {
  title: string;
  message_text: string;
  icon?: string;
  is_favorite?: boolean;
}

export interface TemplateUpdate {
  title?: string;
  message_text?: string;
  icon?: string;
  is_favorite?: boolean;
}

export type Types = {
  User: User;
  Conversation: Conversation;
  Participant: Participant;
  Message: Message;
  Reaction: Reaction;
  LoginResponse: LoginResponse;
  WebSocketMessage: WebSocketMessage;
};
