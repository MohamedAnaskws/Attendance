import React, { useEffect, useRef } from 'react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🙏'];

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="bg-white rounded-full shadow-xl border border-gray-100 p-2 flex gap-1 z-50"
    >
      {REACTIONS.map((reaction) => (
        <button
          key={reaction}
          onClick={() => onSelect(reaction)}
          className="hover:bg-gray-100 rounded-full p-1 transition-transform hover:scale-125 text-xl"
          title={reaction}
        >
          {reaction}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
