// src/components/ReplyPreview.tsx
import React from 'react';
import { Message } from '@/types';

interface ReplyPreviewProps {
  replyToMessage: Message | null;
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyToMessage, onCancel }) => {
  if (!replyToMessage) return null;

  const getPreviewContent = () => {
    if (replyToMessage.is_deleted) {
      return <span className="italic text-gray-400">Message deleted</span>;
    }
    
    if (replyToMessage.message_type === 'IMAGE') {
      return <span>📷 Photo</span>;
    }
    
    if (replyToMessage.message_type === 'FILE') {
      return <span>📎 {replyToMessage.file_name}</span>;
    }
    
    const text = replyToMessage.message_text || '';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  const getSenderName = () => {
    if (!replyToMessage.sender) return 'Unknown';
    return replyToMessage.sender.first_name
      ? `${replyToMessage.sender.first_name} ${replyToMessage.sender.last_name || ''}`.trim()
      : replyToMessage.sender.username;
  };

  return (
    <div className="bg-gray-100 rounded-t-lg px-4 py-2 flex items-center justify-between border-l-4 border-primary-500">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-primary-600 font-medium mb-1">
          Replying to {getSenderName()}
        </div>
        <div className="text-sm text-gray-600 truncate">
          {getPreviewContent()}
        </div>
      </div>
      <button
        onClick={onCancel}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        title="Cancel reply"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ReplyPreview;