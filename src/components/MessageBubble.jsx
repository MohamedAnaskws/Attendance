// src/components/MessageBubble.jsx
import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import ReactionPicker from './ReactionPicker';
import EditHistoryModal from './EditHistoryModal';

// Safe API base URL with fallback
const getApiBase = () => {
  try {
    // Check if we're in a Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (error) {
    console.warn('Could not access import.meta.env, using fallback');
  }
  // Fallback to environment variable or default
  return typeof process !== 'undefined' && process.env?.VITE_API_URL 
    ? process.env.VITE_API_URL 
    : 'http://localhost:8000';
};

const API_BASE = getApiBase();

const MessageBubble = ({ message, onReply }) => {
  if (!message || (!message.message_text && 
      message.message_type !== 'IMAGE' && 
      message.message_type !== 'FILE' && 
      message.message_type !== 'SYSTEM')) {
    console.warn('MessageBubble: Invalid message received', message);
    return null;
  }
  
  const { user } = useAuthStore();
  const { addReactionToMessage, editChatMessage } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message_text || '');
  const [showReactions, setShowReactions] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [showAllPreviousVersions, setShowAllPreviousVersions] = useState(false);

  const isSent = message.sender?.id === user?.id;
  const canEdit = isSent && !message.is_deleted && message.message_type === 'TEXT';
  
  const hasEditHistory = (message.edit_count && message.edit_count > 0) || 
                         (message.edit_history && message.edit_history.length > 0);
  const totalEdits = message.edit_count || message.edit_history?.length || 0;
  
  // Get ALL previous versions (sorted by edit_number - oldest first for display)
  const allPreviousVersions = message.edit_history && message.edit_history.length > 0
    ? [...message.edit_history].sort((a, b) => a.edit_number - b.edit_number)
    : [];

  const formatMessageDate = (dateString) => {
    if (!dateString) return 'just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'just now';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'just now';
    }
  };

  const handleEdit = async () => {
    if (editText.trim() && editText !== message.message_text) {
      await editChatMessage(message.id, editText);
    }
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    if (!message.statuses || Object.keys(message.statuses).length === 0) return '✓';
    const statuses = Object.values(message.statuses);
    if (statuses.includes('READ')) return '✓✓';
    if (statuses.includes('DELIVERED')) return '✓✓';
    return '✓';
  };

  const formatMessageWithMentions = (text, mentionedUsers) => {
    if (!text) return null;
    
    if (!mentionedUsers || mentionedUsers.length === 0) {
      return <span className="whitespace-pre-wrap break-words text-sm">{text}</span>;
    }
    
    const usernames = mentionedUsers.map(u => u.username);
    const pattern = new RegExp(`@(${usernames.join('|')})\\b`, 'g');
    
    const parts = text.split(pattern);
    const isCurrentUserMentioned = mentionedUsers.some(u => u.id === user?.id);
    
    return (
      <span className="whitespace-pre-wrap break-words text-sm">
        {parts.map((part, index) => {
          if (usernames.includes(part)) {
            return (
              <span
                key={index}
                className={`font-medium ${isCurrentUserMentioned && part === `@${user?.username}` ? 'text-yellow-500' : 'text-primary-600'}`}
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  const renderReplyPreview = () => {
    if (!message.reply_to_message) return null;
    
    const replyTo = message.reply_to_message;
    const senderName = replyTo.sender?.first_name
      ? `${replyTo.sender.first_name} ${replyTo.sender.last_name || ''}`.trim()
      : replyTo.sender?.username || 'Unknown';
    
    let replyContent = '';
    if (replyTo.is_deleted) {
      replyContent = 'Message deleted';
    } else if (replyTo.message_type === 'IMAGE') {
      replyContent = '📷 Photo';
    } else if (replyTo.message_type === 'FILE') {
      replyContent = `📎 ${replyTo.file_name || 'File'}`;
    } else {
      replyContent = replyTo.message_text || '';
      if (replyContent.length > 80) replyContent = replyContent.substring(0, 80) + '...';
    }
    
    return (
      <div
        className={`text-xs p-2 rounded-lg mb-2 cursor-pointer hover:bg-opacity-80 ${
          isSent ? 'bg-purple-700 bg-opacity-30' : 'bg-gray-100'
        }`}
        onClick={() => onReply && onReply(replyTo)}
      >
        <div className={`font-medium mb-0.5 ${isSent ? 'text-purple-200' : 'text-primary-600'}`}>
          ↳ {senderName}
        </div>
        <div className={isSent ? 'text-purple-200 text-opacity-80' : 'text-gray-500'}>
          {replyContent}
        </div>
      </div>
    );
  };

  if (message.is_deleted) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div className="bg-gray-200 text-gray-500 rounded-lg px-4 py-2 text-sm italic">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const groupedReactions = message.reactions?.reduce(
    (acc, r) => {
      if (!acc[r.reaction]) acc[r.reaction] = { count: 0, users: [] };
      acc[r.reaction].count++;
      acc[r.reaction].users.push(r.username);
      return acc;
    },
    {}
  ) || {};

  // Function to render previous versions section
  const renderPreviousVersions = () => {
    if (!showAllPreviousVersions || allPreviousVersions.length === 0) return null;
    
    return (
      <div className={`mt-2 ${isSent ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block max-w-[90%] rounded-lg overflow-hidden ${
          isSent ? 'bg-gray-100' : 'bg-gray-50'
        }`}>
          {/* Header */}
          <div className={`px-3 py-1.5 flex items-center justify-between border-b ${
            isSent ? 'bg-gray-200 border-gray-300' : 'bg-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit History ({allPreviousVersions.length} previous version{allPreviousVersions.length !== 1 ? 's' : ''})</span>
            </div>
            <button
              onClick={() => setShowAllPreviousVersions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* List of all previous versions */}
          <div className="divide-y divide-gray-200">
            {allPreviousVersions.map((version, idx) => (
              <div key={version.id} className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    Version {version.edit_number}
                  </span>
                  <span className="text-[10px] text-gray-400" title={new Date(version.edited_at).toLocaleString()}>
                    {formatMessageDate(version.edited_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {version.previous_text || '(No text content)'}
                </p>
                <div className="text-[10px] text-gray-400 mt-1">
                  Edited by {version.edited_by_name || version.edited_by_username}
                </div>
                {idx < allPreviousVersions.length - 1 && (
                  <div className="flex justify-center my-1">
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer with view all link */}
          <div className="px-3 py-1.5 text-center border-t border-gray-200">
            <button
              onClick={() => setShowEditHistory(true)}
              className="text-xs text-primary-500 hover:text-primary-600"
            >
              View full history in modal →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
      >
        <div className={`max-w-[70%] flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
          {!isSent && message.sender && (
            <div className="text-xs text-gray-500 mb-1 ml-2 font-medium">
              {message.sender.first_name
                ? `${message.sender.first_name} ${message.sender.last_name || ''}`.trim()
                : message.sender.username}
            </div>
          )}

          <div className="relative">
            {isEditing ? (
              <div className="bg-white rounded-lg shadow-lg p-3 w-72">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="text-gray-500 text-sm px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEdit} 
                    className="text-white text-sm font-semibold px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                {/* Main Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 shadow-sm ${
                    isSent
                      ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {/* Reply Preview */}
                  {renderReplyPreview()}

                  {/* Image */}
                  {message.message_type === 'IMAGE' && message.file_url && (
                    <img
                      src={`${API_BASE}/api/${message.file_url}`}
                      alt="Shared image"
                      className="max-w-[260px] rounded-lg cursor-pointer mb-1 hover:opacity-90"
                      onClick={() => window.open(`${API_BASE}/api/${message.file_url}`, '_blank')}
                    />
                  )}

                  {/* File */}
                  {message.message_type === 'FILE' && message.file_url && (
                    <a
                      href={`${API_BASE}/api/${message.file_url}`}
                      download={message.file_name}
                      className={`flex items-center gap-2 mb-1 hover:opacity-80 ${isSent ? 'text-white' : 'text-primary-600'}`}
                    >
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium truncate max-w-[200px]">{message.file_name}</div>
                        {message.file_size && (
                          <div className={`text-xs ${isSent ? 'text-purple-200' : 'text-gray-400'}`}>
                            {(message.file_size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </div>
                    </a>
                  )}

                  {/* Text with mention highlighting */}
                  {message.message_text && formatMessageWithMentions(message.message_text, message.mentioned_users)}

                  {/* Metadata with Edit Indicator */}
                  <div className={`text-xs mt-1 flex items-center gap-1 flex-wrap ${isSent ? 'text-purple-200' : 'text-gray-400'}`}>
                    <span>{formatMessageDate(message.created_at)}</span>
                    {isSent && <span className="ml-1">{getStatusIcon()}</span>}
                    
                    {/* Edit indicator - Clickable to show ALL history */}
                    {hasEditHistory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle showing all previous versions
                          setShowAllPreviousVersions(!showAllPreviousVersions);
                        }}
                        className={`inline-flex items-center gap-0.5 ml-1 hover:underline focus:outline-none ${
                          isSent ? 'text-purple-200 hover:text-purple-100' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={`Edited ${totalEdits} time${totalEdits > 1 ? 's' : ''}. Click to ${showAllPreviousVersions ? 'hide' : 'show'} edit history`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>edited {totalEdits}</span>
                        <svg 
                          className={`w-3 h-3 transition-transform ${showAllPreviousVersions ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {message.is_edited && !hasEditHistory && (
                      <span className="italic">(edited)</span>
                    )}
                  </div>

                  {/* Reactions */}
                  {Object.keys(groupedReactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(groupedReactions).map(([reaction, { count, users }]) => (
                        <button
                          key={reaction}
                          onClick={() => addReactionToMessage(message.id, reaction)}
                          title={users.join(', ')}
                          className="bg-black bg-opacity-15 hover:bg-opacity-25 rounded-full px-2 py-0.5 text-xs transition flex items-center gap-0.5"
                        >
                          {reaction} <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ALL PREVIOUS VERSIONS - Displayed below main message when toggled */}
                {renderPreviousVersions()}
              </div>
            )}

            {/* Action buttons on hover */}
            {showActions && !isEditing && (
              <div className={`absolute top-1 ${isSent ? '-left-28' : '-right-28'} flex gap-1 z-10`}>
                {/* Reply button */}
                <button
                  onClick={() => onReply && onReply(message)}
                  title="Reply"
                  className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>

                {/* Reaction button */}
                <button
                  onClick={() => setShowReactions((v) => !v)}
                  title="React"
                  className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Edit button (only if canEdit) */}
                {canEdit && (
                  <button
                    onClick={() => { setIsEditing(true); setEditText(message.message_text || ''); }}
                    title="Edit"
                    className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <div className={`mt-1 ${isSent ? 'self-end' : 'self-start'}`}>
              <ReactionPicker
                onSelect={(reaction) => {
                  addReactionToMessage(message.id, reaction);
                  setShowReactions(false);
                }}
                onClose={() => setShowReactions(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit History Modal (for full history and better viewing) */}
      {showEditHistory && (
        <EditHistoryModal
          isOpen={showEditHistory}
          onClose={() => setShowEditHistory(false)}
          messageId={message.id}
          currentText={message.message_text}
          editCount={totalEdits}
          editHistory={message.edit_history}
        />
      )}
    </>
  );
};

export default MessageBubble;