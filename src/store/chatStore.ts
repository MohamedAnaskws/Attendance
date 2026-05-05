// src/store/chatStore.ts
import { create } from 'zustand';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  addReaction as addReactionApi,
  sendWebSocketMessage,
  isWebSocketConnected,
  archiveConversation,
  getArchivedConversations,
  unarchiveConversation,
} from '../services/api';
import { useAuthStore } from './authStore';
import { Conversation, Message, Reaction, EditHistoryEntry } from '../types';
import { toast } from 'react-toastify';

// Safe date formatter helper
const safeDateFormat = (dateString: string | undefined): string => {
  if (!dateString) return new Date().toISOString();
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.warn('Invalid date:', dateString);
    return new Date().toISOString();
  }
};

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  typingUsers: Record<number, string>;
  onlineUsers: Record<number, boolean>;
  archivedConversations: Conversation[];
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number, loadMore?: boolean) => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  sendChatMessage: (text: string, file?: File | null, replyToId?: number | null) => Promise<Message | null>;
  editChatMessage: (messageId: number, newText: string) => Promise<void>;
  deleteChatMessage: (messageId: number, forEveryone?: boolean) => Promise<void>;
  addReactionToMessage: (messageId: number, reaction: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  handleWebSocketMessage: (data: any) => void;
  setTypingUser: (userId: number, username: string, isTyping: boolean) => void;
  setOnlineUser: (userId: number, isOnline: boolean) => void;
  loadArchivedConversations: () => Promise<void>;
  archiveConversation: (conversationId: number) => Promise<void>;
  unarchiveConversation: (conversationId: number) => Promise<void>;
}

// Helper function to sort conversations by updated_at (newest first)
const sortConversationsByLatest = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(safeDateFormat(a.updated_at));
    const dateB = new Date(safeDateFormat(b.updated_at));
    return dateB.getTime() - dateA.getTime();
  });
};

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  typingUsers: {},
  onlineUsers: {},
  archivedConversations: [],
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  loadConversations: async () => {
    try {
      const response = await getConversations();
      const conversationsWithValidDates = response.data.map(conv => ({
        ...conv,
        created_at: safeDateFormat(conv.created_at),
        updated_at: safeDateFormat(conv.updated_at),
        last_message: conv.last_message ? {
          ...conv.last_message,
          created_at: safeDateFormat(conv.last_message.created_at),
          updated_at: safeDateFormat(conv.last_message.updated_at),
        } : undefined
      }));
      const sortedConversations = sortConversationsByLatest(conversationsWithValidDates);
      set({ conversations: sortedConversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    }
  },

  loadMessages: async (conversationId: number, loadMore: boolean = false) => {
    console.log(`📋 [Store] Loading messages for conversation ${conversationId}, loadMore: ${loadMore}`);
    const { messages, loading, loadingMore } = get();
    
    if (loadMore && (loadingMore || !get().hasMore)) return;
    if (!loadMore && loading) return;
    
    try {
      if (loadMore) {
        set({ loadingMore: true });
      } else {
        set({ loading: true, messages: [], hasMore: true });
      }
      
      const offset = loadMore ? messages.length : 0;
      const response = await getMessages(conversationId, 50, offset);
      
      console.log(`📋 [Store] Received ${response.data.messages.length} messages from API`);
      console.log(`   Total: ${response.data.total}, Has more: ${response.data.has_more}`);
      
      const messagesWithValidDates = response.data.messages.map(msg => ({
        ...msg,
        created_at: safeDateFormat(msg.created_at),
        updated_at: safeDateFormat(msg.updated_at),
        edited_at: msg.edited_at ? safeDateFormat(msg.edited_at) : undefined,
        deleted_at: msg.deleted_at ? safeDateFormat(msg.deleted_at) : undefined,
        reply_to_message: msg.reply_to_message ? {
          ...msg.reply_to_message,
          created_at: safeDateFormat(msg.reply_to_message.created_at),
          updated_at: safeDateFormat(msg.reply_to_message.updated_at),
        } : undefined,
        edit_history: msg.edit_history || []
      }));
      
      if (loadMore) {
        set({ 
          messages: [...messagesWithValidDates, ...messages],
          hasMore: response.data.has_more,
          loadingMore: false,
        });
      } else {
        set({ 
          messages: messagesWithValidDates,
          hasMore: response.data.has_more,
          loading: false,
        });
      }
      
      console.log(`📋 [Store] Messages loaded. Total in store: ${get().messages.length}`);
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ loading: false, loadingMore: false });
      toast.error('Failed to load messages');
    }
  },

  selectConversation: async (conversation: Conversation) => {
    const { currentConversation, loadMessages } = get();
    
    if (currentConversation?.id === conversation.id) return;
    
    const updatedConversations = get().conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
    );
    
    set({
      conversations: updatedConversations,
      currentConversation: conversation,
      messages: [],
      hasMore: true,
    });
    
    await loadMessages(conversation.id);
    
    if (isWebSocketConnected()) {
      sendWebSocketMessage({ type: 'mark_read', conversation_id: conversation.id });
    }
  },

  sendChatMessage: async (text: string, file: File | null = null, replyToId: number | null = null): Promise<Message | null> => {
    const { currentConversation, conversations, messages } = get();
    
    if (!currentConversation) {
      console.error('No current conversation');
      toast.error('No conversation selected');
      return null;
    }

    if (!text?.trim() && !file) {
      console.warn('Cannot send empty message');
      toast.error('Cannot send empty message');
      return null;
    }

    const formData = new FormData();
    formData.append('conversation_id', currentConversation.id.toString());
    if (text && text.trim()) formData.append('message_text', text.trim());
    if (file) formData.append('file', file);
    if (replyToId !== null) formData.append('reply_to_id', replyToId.toString());

    try {
      const response = await sendMessageApi(formData);
      const newMessage: Message = {
        ...response.data,
        created_at: safeDateFormat(response.data.created_at),
        updated_at: safeDateFormat(response.data.updated_at),
      };
      
      if (!newMessage.message_text && 
          newMessage.message_type !== 'IMAGE' && 
          newMessage.message_type !== 'FILE') {
        console.error('Received empty message from server');
        return null;
      }
      
      console.log('Message sent successfully:', newMessage);
      
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === currentConversation.id) {
          return {
            ...conv,
            last_message: newMessage,
            updated_at: new Date().toISOString(),
            unread_count: 0,
          };
        }
        return conv;
      });
      
      const sortedConversations = sortConversationsByLatest(updatedConversations);
      
      set({ 
        conversations: sortedConversations,
        messages: [...messages, newMessage]
      });
      
      return newMessage;
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.response?.data?.detail || 'Failed to send message');
      return null;
    }
  },

  editChatMessage: async (messageId: number, newText: string) => {
    try {
      await editMessageApi(messageId, newText);
      const { currentConversation, messages, conversations } = get();
      
      if (!currentConversation) return;
      
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, message_text: newText, is_edited: true, edited_at: new Date().toISOString() }
          : msg
      );
      
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === currentConversation.id && conv.last_message?.id === messageId) {
          return {
            ...conv,
            last_message: { ...conv.last_message, message_text: newText, is_edited: true },
          };
        }
        return conv;
      });
      
      set({ 
        messages: updatedMessages,
        conversations: updatedConversations,
      });
      
      if (isWebSocketConnected()) {
        sendWebSocketMessage({
          type: 'edit_message',
          message_id: messageId,
          new_text: newText,
          conversation_id: currentConversation.id,
        });
      }
      toast.success('Message edited');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  },

  deleteChatMessage: async (messageId: number, forEveryone: boolean = false) => {
    try {
      await deleteMessageApi(messageId, forEveryone);
      const { currentConversation, messages, conversations } = get();
      
      if (!currentConversation) return;
      
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString(), message_text: 'Message deleted' }
          : msg
      );
      
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === currentConversation.id && conv.last_message?.id === messageId) {
          return {
            ...conv,
            last_message: { ...conv.last_message, is_deleted: true, message_text: 'Message deleted' },
          };
        }
        return conv;
      });
      
      set({ 
        messages: updatedMessages,
        conversations: updatedConversations,
      });
      
      if (isWebSocketConnected()) {
        sendWebSocketMessage({
          type: 'delete_message',
          message_id: messageId,
          for_everyone: forEveryone,
          conversation_id: currentConversation.id,
        });
      }
      toast.success(forEveryone ? 'Message deleted for everyone' : 'Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  },

  addReactionToMessage: async (messageId: number, reaction: string) => {
    const { currentConversation, messages, conversations } = get();
    const currentUser = useAuthStore.getState().user;
    
    if (!currentConversation || !currentUser) {
      console.warn('Cannot add reaction: No current conversation or user');
      return;
    }
    
    try {
      const updatedMessages = messages.map((msg) => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const existingIndex = existingReactions.findIndex(
            (r) => r.user_id === currentUser.id && r.reaction === reaction
          );
          
          let newReactions: Reaction[];
          if (existingIndex >= 0) {
            newReactions = existingReactions.filter((_, i) => i !== existingIndex);
          } else {
            newReactions = [...existingReactions, {
              user_id: currentUser.id,
              reaction: reaction,
              username: currentUser.username
            }];
          }
          
          return { ...msg, reactions: newReactions };
        }
        return msg;
      });
      
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === currentConversation.id && conv.last_message?.id === messageId) {
          const existingReactions = conv.last_message.reactions || [];
          const existingIndex = existingReactions.findIndex(
            (r) => r.user_id === currentUser.id && r.reaction === reaction
          );
          
          let newReactions: Reaction[];
          if (existingIndex >= 0) {
            newReactions = existingReactions.filter((_, i) => i !== existingIndex);
          } else {
            newReactions = [...existingReactions, {
              user_id: currentUser.id,
              reaction: reaction,
              username: currentUser.username
            }];
          }
          
          return {
            ...conv,
            last_message: { ...conv.last_message, reactions: newReactions }
          };
        }
        return conv;
      });
      
      set({ 
        messages: updatedMessages,
        conversations: updatedConversations,
      });
      
      addReactionApi(messageId, reaction).catch((error) => {
        console.error('Failed to save reaction to backend:', error);
      });
      
      if (isWebSocketConnected()) {
        sendWebSocketMessage({
          type: 'add_reaction',
          message_id: messageId,
          reaction: reaction,
          conversation_id: currentConversation.id,
        });
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },

  sendTyping: (isTyping: boolean) => {
    const { currentConversation } = get();
    if (!currentConversation) return;
    if (isWebSocketConnected()) {
      sendWebSocketMessage({
        type: 'typing',
        conversation_id: currentConversation.id,
        is_typing: isTyping,
      });
    }
  },

  handleWebSocketMessage: (data: any) => {
    const { currentConversation, messages, conversations, selectConversation } = get();
    const currentUser = useAuthStore.getState().user;

    console.log('📨 Processing WebSocket message:', data.type);

    switch (data.type) {
      case 'new_message': {
        const newMessage = {
          ...data.data,
          created_at: safeDateFormat(data.data.created_at),
          updated_at: safeDateFormat(data.data.updated_at),
        };
        
        const messageExists = messages.some((msg) => msg.id === newMessage.id);
        
        if (!messageExists) {
          let updatedConversations = conversations.map((conv) => {
            if (conv.id === newMessage.conversation_id) {
              return {
                ...conv,
                last_message: newMessage,
                updated_at: new Date().toISOString(),
                unread_count: currentConversation?.id === newMessage.conversation_id 
                  ? 0 
                  : (conv.unread_count || 0) + 1,
              };
            }
            return conv;
          });
          
          updatedConversations = sortConversationsByLatest(updatedConversations);
          set({ conversations: updatedConversations });
          
          if (currentConversation && newMessage.conversation_id === currentConversation.id) {
            set({ messages: [...messages, newMessage] });
          }
          
          if (newMessage.sender?.id !== currentUser?.id && 
              currentConversation?.id !== newMessage.conversation_id) {
            const conversation = updatedConversations.find(c => c.id === newMessage.conversation_id);
            if (conversation) {
              const senderName = newMessage.sender?.first_name
                ? `${newMessage.sender.first_name} ${newMessage.sender.last_name || ''}`.trim()
                : newMessage.sender?.username || 'Someone';
              
              const conversationName = conversation.conversation_type === 'GROUP'
                ? conversation.group_name || 'Group'
                : senderName;
              
              let preview = '';
              if (newMessage.message_type === 'TEXT') {
                preview = newMessage.message_text || '';
              } else if (newMessage.message_type === 'IMAGE') {
                preview = '📷 Photo';
              } else if (newMessage.message_type === 'FILE') {
                preview = `📎 ${newMessage.file_name || 'File'}`;
              } else {
                preview = 'Sent a message';
              }
              if (preview.length > 30) preview = preview.substring(0, 30) + '...';
              
              toast.info(`${senderName} in ${conversationName}: ${preview}`, {
                position: "top-right",
                autoClose: 5000,
                onClick: () => {
                  selectConversation(conversation);
                },
              });
            }
          }
        }
        break;
      }

      case 'mark_read_confirm': {
        console.log('✅ Mark read confirmed for conversation:', data.data?.conversation_id);
        break;
      }

      case 'message_deleted': {
        const { message_id, conversation_id, deleted_by } = data.data;
        
        if (currentConversation && conversation_id === currentConversation.id) {
          const updatedMessages = messages.map((msg) =>
            msg.id === message_id
              ? { ...msg, is_deleted: true, deleted_by: deleted_by, deleted_at: new Date().toISOString(), message_text: 'Message deleted' }
              : msg
          );
          set({ messages: updatedMessages });
        }
        
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === conversation_id && conv.last_message && conv.last_message.id === message_id) {
            return {
              ...conv,
              last_message: { 
                ...conv.last_message, 
                is_deleted: true, 
                message_text: 'Message deleted' 
              },
            };
          }
          return conv;
        }) as Conversation[];
        
        set({ conversations: updatedConversations });
        break;
      }

      case 'mention': {
        const { conversation_id, mentioned_by, message_preview, conversation_name } = data.data;
        const currentConv = get().currentConversation;
        const conversation = conversations.find(c => c.id === conversation_id);
        
        if (conversation && (!currentConv || currentConv.id !== conversation_id)) {
          toast.info(`📢 @${mentioned_by} mentioned you in ${conversation_name || conversation.group_name || 'a chat'}: "${message_preview}"`, {
            position: "top-right",
            autoClose: 8000,
            onClick: () => {
              selectConversation(conversation);
            },
          });
        }
        break;
      }

      case 'message_edited': {
        const { 
          message_id, 
          conversation_id, 
          new_text, 
          edited_at, 
          edit_count, 
          edit_history,
        } = data.data;
        
        console.log(`📝 Message ${message_id} edited, now has ${edit_count} total edits, history length: ${edit_history?.length || 0}`);
        
        if (currentConversation && conversation_id === currentConversation.id) {
          const updatedMessages = messages.map((msg) => {
            if (msg.id === message_id) {
              let finalEditHistory = edit_history;
              
              if (msg.edit_history && msg.edit_history.length > 0 && edit_history) {
                const historyMap = new Map<number, EditHistoryEntry>();
                msg.edit_history.forEach((h: EditHistoryEntry) => historyMap.set(h.id, h));
                edit_history.forEach((h: EditHistoryEntry) => historyMap.set(h.id, h));
                finalEditHistory = Array.from(historyMap.values()).sort((a, b) => a.edit_number - b.edit_number);
              }
              
              return { 
                ...msg, 
                message_text: new_text, 
                is_edited: true, 
                edit_count: edit_count || (msg.edit_count || 0) + 1,
                edited_at: safeDateFormat(edited_at),
                edit_history: finalEditHistory || msg.edit_history
              };
            }
            return msg;
          });
          set({ messages: updatedMessages });
        }
        
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === conversation_id && conv.last_message && conv.last_message.id === message_id) {
            let lastMsgEditHistory = edit_history;
            if (conv.last_message.edit_history && conv.last_message.edit_history.length > 0 && edit_history) {
              const historyMap = new Map<number, EditHistoryEntry>();
              conv.last_message.edit_history.forEach((h: EditHistoryEntry) => historyMap.set(h.id, h));
              edit_history.forEach((h: EditHistoryEntry) => historyMap.set(h.id, h));
              lastMsgEditHistory = Array.from(historyMap.values()).sort((a, b) => a.edit_number - b.edit_number);
            }
            
            return {
              ...conv,
              last_message: { 
                ...conv.last_message, 
                message_text: new_text, 
                is_edited: true,
                edit_count: edit_count || (conv.last_message.edit_count || 0) + 1,
                edit_history: lastMsgEditHistory
              },
            };
          }
          return conv;
        }) as Conversation[];
        
        set({ conversations: updatedConversations });
        break;
      }

      case 'reaction_updated': {
        if (currentConversation && data.data.conversation_id === currentConversation.id) {
          const updatedMessages = messages.map((msg) => {
            if (msg.id === data.data.message_id) {
              const existingReactions = msg.reactions || [];
              const existingIndex = existingReactions.findIndex(
                (r) => r.user_id === data.data.user_id && r.reaction === data.data.reaction
              );
              
              let newReactions: Reaction[];
              if (existingIndex >= 0) {
                newReactions = existingReactions.filter((_, i) => i !== existingIndex);
              } else {
                newReactions = [...existingReactions, {
                  user_id: data.data.user_id,
                  reaction: data.data.reaction,
                  username: data.data.username || `User ${data.data.user_id}`
                }];
              }
              
              return { ...msg, reactions: newReactions };
            }
            return msg;
          });
          set({ messages: updatedMessages });
          
          const updatedConversations = conversations.map((conv) => {
            if (conv.id === data.data.conversation_id && conv.last_message && conv.last_message.id === data.data.message_id) {
              const existingReactions = conv.last_message.reactions || [];
              const existingIndex = existingReactions.findIndex(
                (r) => r.user_id === data.data.user_id && r.reaction === data.data.reaction
              );
              
              let newReactions: Reaction[];
              if (existingIndex >= 0) {
                newReactions = existingReactions.filter((_, i) => i !== existingIndex);
              } else {
                newReactions = [...existingReactions, {
                  user_id: data.data.user_id,
                  reaction: data.data.reaction,
                  username: data.data.username || `User ${data.data.user_id}`
                }];
              }
              
              return {
                ...conv,
                last_message: { ...conv.last_message, reactions: newReactions }
              };
            }
            return conv;
          }) as Conversation[];
          
          set({ conversations: updatedConversations });
        }
        break;
      }

      case 'typing': {
        if (currentConversation && data.data.conversation_id === currentConversation.id) {
          if (data.data.is_typing) {
            set((state) => ({
              typingUsers: { ...state.typingUsers, [data.data.user_id]: data.data.username },
            }));
          } else {
            set((state) => {
              const newTypingUsers = { ...state.typingUsers };
              delete newTypingUsers[data.data.user_id];
              return { typingUsers: newTypingUsers };
            });
          }
        }
        break;
      }

      case 'user_status': {
        set((state) => ({
          onlineUsers: { ...state.onlineUsers, [data.data.user_id]: data.data.status === 'online' },
        }));
        break;
      }

      case 'online_users': {
        const onlineStatuses: Record<number, boolean> = {};
        data.data.user_ids.forEach((userId: number) => {
          onlineStatuses[userId] = true;
        });
        set((state) => ({
          onlineUsers: { ...state.onlineUsers, ...onlineStatuses },
        }));
        break;
      }

      case 'read_receipt': {
        const { user_id, conversation_id } = data.data;
        const currentConv = get().currentConversation;
        const currentUserState = useAuthStore.getState().user;
        
        if (currentConv && currentConv.id === conversation_id) {
          const updatedMessages = messages.map((msg) => {
            if (msg.sender?.id === currentUserState?.id && msg.statuses) {
              return {
                ...msg,
                statuses: { ...msg.statuses, [user_id]: 'READ' }
              };
            }
            return msg;
          });
          set({ messages: updatedMessages });
        }
        break;
      }

      default:
        console.log('Unhandled WebSocket message type:', data.type);
        break;
    }
  },

  setTypingUser: (userId: number, username: string, isTyping: boolean) => {
    set((state) => {
      if (isTyping) {
        return { typingUsers: { ...state.typingUsers, [userId]: username } };
      } else {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[userId];
        return { typingUsers: newTypingUsers };
      }
    });
  },

  setOnlineUser: (userId: number, isOnline: boolean) => {
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    }));
  },

  loadArchivedConversations: async () => {
    try {
      const response = await getArchivedConversations();
      set({ archivedConversations: response.data });
    } catch (error) {
      console.error('Failed to load archived conversations:', error);
    }
  },

  archiveConversation: async (conversationId: number) => {
    try {
      await archiveConversation(conversationId);
      
      const { conversations, archivedConversations } = get();
      const conversationToArchive = conversations.find(c => c.id === conversationId);
      
      if (conversationToArchive) {
        const updatedActive = conversations.filter(c => c.id !== conversationId);
        const archivedConv = { ...conversationToArchive, is_archived: true, archived_at: new Date().toISOString() };
        const updatedArchived = [archivedConv, ...archivedConversations];
        
        set({ 
          conversations: updatedActive as Conversation[],
          archivedConversations: updatedArchived as Conversation[]
        });
      }
      
      toast.success('Chat archived');
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      toast.error('Failed to archive chat');
    }
  },

  unarchiveConversation: async (conversationId: number) => {
    try {
      await unarchiveConversation(conversationId);
      
      const { conversations, archivedConversations } = get();
      const conversationToUnarchive = archivedConversations.find(c => c.id === conversationId);
      
      if (conversationToUnarchive) {
        const updatedArchived = archivedConversations.filter(c => c.id !== conversationId);
        const activeConv = { ...conversationToUnarchive, is_archived: false, archived_at: undefined };
        const updatedActive = [activeConv, ...conversations];
        
        set({ 
          conversations: updatedActive as Conversation[],
          archivedConversations: updatedArchived as Conversation[]
        });
      }
      
      toast.success('Chat unarchived');
    } catch (error) {
      console.error('Failed to unarchive conversation:', error);
      toast.error('Failed to unarchive chat');
    }
  },
}));