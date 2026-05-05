// src/components/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';
import ReplyPreview from './ReplyPreview';
import MentionAutocomplete from './MentionAutocomplete';
import { getTemplates, createTemplate, deleteTemplate, updateTemplate } from '@/services/api';
import { Message, Template, User } from '@/types';
import { toast } from 'react-toastify';

const ChatWindow: React.FC = () => {
  const { user } = useAuthStore();
  const {
    currentConversation,
    messages,
    loading,
    sendChatMessage,
    sendTyping,
    typingUsers,
    onlineUsers,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [conversationUsers, setConversationUsers] = useState<User[]>([]);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Template form state
  const [templateFormData, setTemplateFormData] = useState({
    title: '',
    message_text: '',
    icon: '📝',
    is_favorite: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const templateButtonRef = useRef<HTMLButtonElement>(null);

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('📊 ChatWindow - messages updated:', messages.length, 'messages');
    messages.forEach((msg, idx) => {
      console.log(`  [${idx}] Message ${msg.id}: type=${msg.message_type}, text=${msg.message_text?.substring(0, 30) || 'No text'}, edit_count=${msg.edit_count}`);
    });
  }, [messages]);

  // Debug: Log current conversation
  useEffect(() => {
    if (currentConversation) {
      console.log('📊 ChatWindow - Current conversation:', currentConversation.id, currentConversation.group_name);
    } else {
      console.log('📊 ChatWindow - No current conversation');
    }
  }, [currentConversation]);

  // Get all users in current conversation for mentions
  useEffect(() => {
    if (currentConversation && currentConversation.participants) {
      const otherUsers = currentConversation.participants
        .filter(p => p.user.id !== user?.id)
        .map(p => p.user);
      setConversationUsers(otherUsers);
    }
  }, [currentConversation, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyToMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyToMessage]);

  // Load templates when dropdown opens
  useEffect(() => {
    if (showTemplateDropdown) {
      loadTemplates();
    }
  }, [showTemplateDropdown, templateSearchTerm, showFavoritesOnly]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && 
          !templateDropdownRef.current.contains(event.target as Node) &&
          templateButtonRef.current &&
          !templateButtonRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
        setShowTemplateForm(false);
        setEditingTemplate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.emoji-picker-wrapper')) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await getTemplates(showFavoritesOnly, templateSearchTerm || undefined);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!templateFormData.message_text.trim()) {
      toast.error('Please enter message text');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateFormData);
        toast.success('Template updated');
      } else {
        await createTemplate(templateFormData);
        toast.success('Template created');
      }
      setTemplateFormData({ title: '', message_text: '', icon: '📝', is_favorite: false });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm('Delete this template?')) {
      try {
        await deleteTemplate(templateId);
        toast.success('Template deleted');
        loadTemplates();
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateFormData({
      title: template.title,
      message_text: template.message_text,
      icon: template.icon,
      is_favorite: template.is_favorite
    });
    setShowTemplateForm(true);
  };

  const handleUseTemplate = (template: Template) => {
    setMessageText(template.message_text);
    setShowTemplateDropdown(false);
    setShowTemplateForm(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !file) || sending) return;

    setSending(true);
    const text = messageText;
    const selectedFile = file;
    const replyId = replyToMessage?.id;
    
    setMessageText('');
    setFile(null);
    setReplyToMessage(null);
    
    const result = await sendChatMessage(text, selectedFile, replyId);
    
    setSending(false);
    
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  };

  const handleTyping = () => {
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    setMessageText(newText);
    setCursorPosition(newCursorPosition);
    
    const textBeforeCursor = newText.slice(0, newCursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch && conversationUsers.length > 0) {
      setShowMentionAutocomplete(true);
    } else {
      setShowMentionAutocomplete(false);
    }
    
    handleTyping();
  };

  const handleMentionSelect = (username: string) => {
    const textBeforeCursor = messageText.slice(0, cursorPosition);
    const textAfterCursor = messageText.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${username} ` + textAfterCursor;
    
    setMessageText(newText);
    setShowMentionAutocomplete(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newPosition = lastAtIndex + username.length + 2;
      textareaRef.current.setSelectionRange(newPosition, newPosition);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      setFile(selectedFile);
    }
    e.target.value = '';
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setMessageText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const getConversationName = () => {
    if (!currentConversation) return '';
    if (currentConversation.conversation_type === 'GROUP') {
      return currentConversation.group_name || 'Group';
    }
    const otherUser = currentConversation.participants?.find((p) => p.user.id !== user?.id)?.user;
    return otherUser
      ? otherUser.first_name
        ? `${otherUser.first_name} ${otherUser.last_name || ''}`.trim()
        : otherUser.username
      : 'Unknown';
  };

  const getOtherUser = () => {
    if (!currentConversation || currentConversation.conversation_type === 'GROUP') return null;
    return currentConversation.participants?.find((p) => p.user.id !== user?.id)?.user;
  };

  const isUserOnline = () => {
    const otherUser = getOtherUser();
    return otherUser ? onlineUsers[otherUser.id] || false : false;
  };

  const commonIcons = ['📝', '👍', '👋', '🙏', '🎉', '✅', '❌', '⚠️', '💡', '🔔', '📢', '💬', '🤝', '🎯', '⭐', '🔥', '💪', '🎈', '🌟', '💎'];

  // If no conversation selected, show welcome screen
  if (!currentConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700">Welcome to CRM Chat</h3>
          <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const typingList = Object.values(typingUsers);
  const isTyping = typingList.length > 0;

  // Filter templates for display
  const filteredTemplates = templates.filter(template => {
    if (templateSearchTerm) {
      return template.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
             template.message_text.toLowerCase().includes(templateSearchTerm.toLowerCase());
    }
    return true;
  });

  // ✅ FIXED: Better message filtering - show all messages that have any content
  const validMessages = messages.filter((message) => {
    if (!message) return false;
    // Show message if it has text, OR is an image, OR is a file, OR is system message
    const hasText = message.message_text && message.message_text.trim();
    const isImage = message.message_type === 'IMAGE';
    const isFile = message.message_type === 'FILE';
    const isSystem = message.message_type === 'SYSTEM';
    // Also show if it has edit history (even if deleted)
    const hasEditHistory = (message.edit_count && message.edit_count > 0) || (message.edit_history && message.edit_history.length > 0);
    
    return hasText || isImage || isFile || isSystem || hasEditHistory;
  });

  console.log('📊 Valid messages to render:', validMessages.length);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {getConversationName().charAt(0).toUpperCase()}
            </div>
            {isUserOnline() && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{getConversationName()}</h2>
            <p className="text-xs text-gray-500">
              {currentConversation.conversation_type === 'GROUP'
                ? `${currentConversation.participants?.length || 0} members`
                : isUserOnline()
                ? '🟢 Online'
                : 'Offline'}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(currentConversation.updated_at), { addSuffix: true })}
        </div>
      </div>


{/* Messages Area */}
<div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
  {/* DEBUG: Show message count */}
  <div className="text-xs text-center text-gray-400 mb-2">
    Messages in store: {validMessages.length}
  </div>
  
  
  {loading && (
    <div className="text-center text-gray-500 py-4">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading messages...
    </div>
  )}

  {!loading && validMessages.length === 0 && (
    <div className="text-center text-gray-400 py-8">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p>No messages yet</p>
      <p className="text-sm">Say hello to start the conversation!</p>
    </div>
  )}

  {/* Render messages */}
  {!loading && validMessages.length > 0 && validMessages.map((message, idx) => {
    console.log(`🎨 Rendering message ${idx}:`, message.id, message.message_text);
    return (
      <MessageBubble 
        key={`msg-${message.id}`} 
        message={message}
        onReply={setReplyToMessage}
      />
    );
  })}

        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="bg-white rounded-full px-4 py-2 shadow-sm flex items-center gap-1">
              <span className="typing-dot animate-typing"></span>
              <span className="typing-dot animate-typing" style={{ animationDelay: '0.2s' }}></span>
              <span className="typing-dot animate-typing" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <span className="text-sm">{typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      <ReplyPreview replyToMessage={replyToMessage} onCancel={cancelReply} />

      {/* File Preview */}
      {file && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm flex-1 text-blue-700 truncate">{file.name}</span>
          <span className="text-xs text-blue-400">{(file.size / 1024).toFixed(1)} KB</span>
          <button onClick={() => setFile(null)} className="text-red-400 hover:text-red-600 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t p-4 shadow-sm relative">
        {/* Mention Autocomplete */}
        {showMentionAutocomplete && (
          <MentionAutocomplete
            text={messageText}
            cursorPosition={cursorPosition}
            users={conversationUsers}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionAutocomplete(false)}
          />
        )}

        {/* Template Dropdown */}
        {showTemplateDropdown && (
          <div 
            ref={templateDropdownRef}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[400px] overflow-hidden flex flex-col z-50"
          >
            {/* Dropdown Header */}
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="font-semibold text-gray-700">Quick Templates</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly);
                    setTemplateSearchTerm('');
                  }}
                  className={`p-1.5 rounded-lg text-sm transition-colors ${
                    showFavoritesOnly ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-200'
                  }`}
                  title="Show favorites only"
                >
                  ⭐
                </button>
                <button
                  onClick={() => {
                    setShowTemplateForm(!showTemplateForm);
                    if (!showTemplateForm) {
                      setEditingTemplate(null);
                      setTemplateFormData({ title: '', message_text: '', icon: '📝', is_favorite: false });
                    }
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Create new template"
                >
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-2 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearchTerm}
                  onChange={(e) => setTemplateSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Create/Edit Form */}
            {showTemplateForm && (
              <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={templateFormData.icon}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, icon: e.target.value })}
                    className="p-1 border rounded text-lg"
                  >
                    {commonIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Title"
                    value={templateFormData.title}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => setTemplateFormData({ ...templateFormData, is_favorite: !templateFormData.is_favorite })}
                    className={`p-1 rounded ${templateFormData.is_favorite ? 'text-yellow-500' : 'text-gray-400'}`}
                  >
                    ⭐
                  </button>
                </div>
                <textarea
                  placeholder="Message text..."
                  value={templateFormData.message_text}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, message_text: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowTemplateForm(false);
                      setEditingTemplate(null);
                    }}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="overflow-y-auto max-h-[300px]">
              {loadingTemplates ? (
                <div className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-2">Loading...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm text-gray-500">No templates yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click the + button to create one</p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer transition-colors"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{template.title}</span>
                          {template.is_favorite && <span className="text-xs text-yellow-500 flex-shrink-0">⭐</span>}
                          {template.usage_count > 0 && (
                            <span className="text-xs text-gray-400 flex-shrink-0">Used {template.usage_count}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{template.message_text}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
              Click any template to insert message
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex gap-1 flex-shrink-0">
            {/* Template Button */}
            <button
              ref={templateButtonRef}
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              title="Quick Templates"
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {templates.filter(t => t.is_favorite).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
              )}
            </button>

            {/* Attach file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Emoji button */}
            <div className="relative emoji-picker-wrapper">
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                title="Emoji"
                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50 shadow-xl">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-gray-100 rounded-2xl px-1">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={replyToMessage ? "Type your reply... (Enter to send, Shift+Enter for new line)" : "Type a message... (@ to mention, 📋 for templates, Enter to send, Shift+Enter for new line)"}
              className="w-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm"
              rows={1}
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={(!messageText.trim() && !file) || sending}
            title="Send"
            className="bg-gradient-to-r from-primary-500 to-purple-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-40 flex-shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Helper text */}
        {/* <div className="text-xs text-gray-400 mt-2 text-center">
          {currentConversation.conversation_type === 'GROUP' ? (
            <>💡 Type @ to mention someone | 📋 Click template icon for quick replies</>
          ) : (
            <>📋 Click the template icon to use saved message templates</>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default ChatWindow;