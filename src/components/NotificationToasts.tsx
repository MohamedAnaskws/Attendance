// src/components/NotificationToasts.tsx
import React from 'react';

interface NewMessageToastProps {
  senderName: string;
  conversationName: string;
  content: string;
}

export const NewMessageToast: React.FC<NewMessageToastProps> = ({ senderName, conversationName, content }) => (
  <div className="flex flex-col">
    <span className="font-semibold text-primary-600">{senderName}</span>
    <span className="text-sm text-gray-600">{conversationName}</span>
    <span className="text-xs text-gray-500 mt-1 truncate max-w-[250px]">{content}</span>
  </div>
);

interface MentionToastProps {
  mentionedBy: string;
  conversationName: string;
  messagePreview: string;
}

export const MentionToast: React.FC<MentionToastProps> = ({ mentionedBy, conversationName, messagePreview }) => (
  <div className="flex flex-col">
    <span className="font-semibold text-yellow-600">📢 @{mentionedBy} mentioned you</span>
    <span className="text-sm text-gray-600">in {conversationName}</span>
    <span className="text-xs text-gray-500 mt-1 truncate max-w-[250px]">"{messagePreview}"</span>
  </div>
);