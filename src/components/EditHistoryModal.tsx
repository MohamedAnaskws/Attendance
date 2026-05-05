// src/components/EditHistoryModal.tsx - Updated to accept editHistory prop

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { EditHistoryEntry } from '@/types';
import { getMessageEditHistory } from '@/services/api';
import { toast } from 'react-toastify';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: number;
  currentText?: string;
  editCount?: number;
  editHistory?: EditHistoryEntry[]; // NEW prop to receive history directly
}

const EditHistoryModal: React.FC<EditHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  messageId,
  currentText,
  editCount = 0,
  editHistory: propEditHistory // Accept from props
}) => {
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<EditHistoryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && messageId) {
      // Use props if provided, otherwise fetch
      if (propEditHistory && propEditHistory.length > 0) {
        console.log(`📜 Using ${propEditHistory.length} edit history entries from props`);
        setEditHistory(propEditHistory);
        setLoading(false);
        if (propEditHistory.length > 0 && !selectedVersion) {
          setSelectedVersion(propEditHistory[propEditHistory.length - 1]);
        }
      } else {
        loadEditHistory();
      }
    }
  }, [isOpen, messageId, propEditHistory]);

  const loadEditHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMessageEditHistory(messageId);
      console.log(`📜 Loaded ${response.data.length} edit history entries for message ${messageId}`);
      setEditHistory(response.data || []);
      
      if (response.data && response.data.length > 0 && !selectedVersion) {
        setSelectedVersion(response.data[response.data.length - 1]);
      }
    } catch (error: any) {
      console.error('Failed to load edit history:', error);
      setError(error.response?.data?.detail || 'Failed to load edit history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { relative: 'unknown', full: 'unknown' };
      }
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        full: format(date, 'PPP p')
      };
    } catch {
      return { relative: 'unknown', full: 'unknown' };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary-50 to-purple-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Message Edit History
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {editHistory.length} {editHistory.length === 1 ? 'edit' : 'edits'} • Total edits: {editCount || editHistory.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* History List - Left Panel */}
          <div className="w-full md:w-1/2 border-r overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading history...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-500 text-sm">{error}</p>
                <button 
                  onClick={loadEditHistory}
                  className="mt-3 text-primary-500 text-sm hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : editHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-500">No edit history</p>
                <p className="text-xs text-gray-400 mt-1">This message has not been edited</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* Current version first - Always shown */}
                {currentText && (
                  <div
                    className={`p-3 cursor-pointer transition-all ${
                      selectedVersion === null ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedVersion(null)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                        <span className="text-xs text-gray-400">Latest version</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1">
                      {currentText.length > 100 ? currentText.substring(0, 100) + '...' : currentText}
                    </p>
                  </div>
                )}
                
                {/* Edit history entries (show newest first for better UX) */}
                {[...editHistory].reverse().map((history) => {
                  const dates = formatDate(history.edited_at);
                  const isSelected = selectedVersion?.id === history.id;
                  
                  return (
                    <div
                      key={history.id}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedVersion(history)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            Version {history.edit_number}
                          </span>
                          <span className="text-xs text-gray-400" title={dates.full}>
                            {dates.relative}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Edited by {history.edited_by_name || history.edited_by_username}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {history.previous_text?.substring(0, 100) || '(No text content)'}
                        {history.previous_text && history.previous_text.length > 100 && '...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Panel - Right Panel */}
          <div className="w-full md:w-1/2 overflow-y-auto bg-white p-4">
            {selectedVersion ? (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-800">Version Preview</h3>
                    <p className="text-xs text-gray-500">Version {selectedVersion.edit_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedVersion.edited_at).full}
                    </p>
                    <p className="text-xs text-primary-600">
                      by {selectedVersion.edited_by_name || selectedVersion.edited_by_username}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {selectedVersion.previous_text || (
                      <span className="text-gray-400 italic">No text content in this version</span>
                    )}
                  </p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {selectedVersion.previous_text && (
                    <button
                      onClick={() => copyToClipboard(selectedVersion.previous_text!)}
                      className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 px-2 py-1 rounded border border-primary-200 hover:bg-primary-50 transition"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy to clipboard
                    </button>
                  )}
                </div>
              </div>
            ) : currentText ? (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-800">Current Version</h3>
                    <p className="text-xs text-gray-500">Latest message</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {editHistory.length} previous {editHistory.length === 1 ? 'edit' : 'edits'}
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {currentText}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(currentText)}
                    className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 px-2 py-1 rounded border border-primary-200 hover:bg-primary-50 transition"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy to clipboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p>Select a version to preview</p>
                  <p className="text-xs mt-1">Click on any edit in the left panel</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center rounded-b-xl">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Current version
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              Previous versions
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Click to view
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHistoryModal;