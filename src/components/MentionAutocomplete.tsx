// src/components/MentionAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface MentionAutocompleteProps {
  text: string;
  cursorPosition: number;
  users: User[];
  onSelect: (username: string) => void;
  onClose: () => void;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  text,
  cursorPosition,
  users,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract the word being typed after @
    const textBeforeCursor = text.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    
    if (match) {
      setSearchTerm(match[1].toLowerCase());
    } else {
      onClose();
    }
  }, [text, cursorPosition, onClose]);

  const filteredUsers = users.filter(user => {
    const username = user.username.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return username.includes(searchTerm) || fullName.includes(searchTerm);
  }).slice(0, 5);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex].username);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (filteredUsers.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);

  if (filteredUsers.length === 0 || !searchTerm) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[200px]"
    >
      {filteredUsers.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user.username)}
          className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors ${
            index === selectedIndex ? 'bg-primary-50' : ''
          }`}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {(user.first_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
            </div>
            <div className="text-xs text-gray-400">@{user.username}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MentionAutocomplete;