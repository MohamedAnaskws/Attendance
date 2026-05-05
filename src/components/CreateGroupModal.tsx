// src/components/CreateGroupModal.tsx
import React, { useState, useEffect } from 'react';
import { getUsers, createGroup } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'react-toastify';
import { User, Conversation } from '@/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { loadConversations, selectConversation } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset form when modal opens
      setGroupName('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📝 Creating group:', { group_name: groupName, member_ids: selectedUsers });
      
      const response = await createGroup({
        group_name: groupName,
        member_ids: selectedUsers
      });
      
      console.log('✅ Group created response:', response.data);
      
      const newConversation = response.data;
      
      // Force reload conversations to include the new group
      await loadConversations();
      console.log('📋 Conversations reloaded');
      
      // Optionally select the new conversation if it exists
      if (newConversation && newConversation.id) {
        const { conversations } = useChatStore.getState();
        const foundConv = conversations.find(c => c.id === newConversation.id);
        if (foundConv) {
          selectConversation(foundConv);
        }
      }
      
      toast.success('Group created successfully!');
      onClose();
      
    } catch (error: any) {
      console.error('❌ Failed to create group:', error);
      console.error('Error response:', error.response?.data);
      
      // Better error message handling
      let errorMessage = 'Failed to create group';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Specific check for duplicate group name
      if (errorMessage.toLowerCase().includes('already exists') || 
          errorMessage.toLowerCase().includes('group name')) {
        toast.error(`⚠️ ${errorMessage}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Group</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter group name"
              required
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Members ({selectedUsers.length} selected)
            </label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No other users found</div>
              ) : (
                users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium">
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;