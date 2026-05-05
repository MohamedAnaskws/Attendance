// src/components/TemplateModal.tsx
import React, { useState, useEffect } from 'react';
import { Template, TemplateCreate } from '@/types';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/services/api';
import { toast } from 'react-toastify';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (message: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<TemplateCreate>({
    title: '',
    message_text: '',
    icon: '📝',
    is_favorite: false
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, searchTerm, showFavoritesOnly]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await getTemplates(showFavoritesOnly, searchTerm || undefined);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.message_text.trim()) {
      toast.error('Please enter message text');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
        toast.success('Template updated');
      } else {
        await createTemplate(formData);
        toast.success('Template created');
      }
      setShowCreateForm(false);
      setEditingTemplate(null);
      setFormData({ title: '', message_text: '', icon: '📝', is_favorite: false });
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      message_text: template.message_text,
      icon: template.icon,
      is_favorite: template.is_favorite
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (templateId: number) => {
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

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate(template.message_text);
    onClose();
  };

  const commonIcons = ['📝', '👍', '👋', '🙏', '🎉', '✅', '❌', '⚠️', '💡', '🔔', '📢', '💬', '🤝', '🎯', '⭐'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">📋 Message Templates</h2>
            <p className="text-xs text-gray-500 mt-1">Quick replies for common messages</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingTemplate(null);
                setFormData({ title: '', message_text: '', icon: '📝', is_favorite: false });
              }}
              className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                showFavoritesOnly ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>⭐</span> Favorites
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-medium mb-3">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {commonIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Message Text</label>
                <textarea
                  value={formData.message_text}
                  onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                  placeholder="Enter your message template here..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFavorite"
                  checked={formData.is_favorite}
                  onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isFavorite" className="text-sm">Add to favorites</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                  }}
                  className="px-3 py-1.5 border rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-500">No templates yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first template to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-3 flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{template.icon}</span>
                        <span className="font-medium">{template.title}</span>
                        {template.is_favorite && (
                          <span className="text-xs text-yellow-500">⭐</span>
                        )}
                        {template.usage_count > 0 && (
                          <span className="text-xs text-gray-400">
                            Used {template.usage_count} times
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.message_text}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
          Click on any template to use it in chat
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;