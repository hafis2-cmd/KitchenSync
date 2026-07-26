import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertCircle, Sparkles, Tag, Check } from 'lucide-react';
import { RestaurantTable } from '../types';
import { updateTableCustomNote } from '../lib/api';

interface TableNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable | null;
  onNoteUpdated?: (tableId: string, newNote: string) => void;
}

const PRESET_NOTES = [
  '🎂 Birthday celebration',
  '⚠️ Allergy alert (Gluten/Nuts)',
  '⭐ VIP Guest',
  '👶 Highchair required',
  '🥂 Anniversary dinner',
  '🪟 Window seat preferred',
  '🤫 Quiet corner requested',
  '💼 Business meeting',
];

export const TableNoteModal: React.FC<TableNoteModalProps> = ({
  isOpen,
  onClose,
  table,
  onNoteUpdated,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (table) {
      setNote(table.customStatusNote || '');
    }
  }, [table]);

  if (!isOpen || !table) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateTableCustomNote(table.id, note.trim());
      if (onNoteUpdated) {
        onNoteUpdated(table.id, note.trim());
      }
      onClose();
    } catch (err) {
      console.error('Failed to update table note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    try {
      await updateTableCustomNote(table.id, '');
      setNote('');
      if (onNoteUpdated) {
        onNoteUpdated(table.id, '');
      }
      onClose();
    } catch (err) {
      console.error('Failed to clear table note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Table #{table.tableNumber} Custom Note
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Temporary waiter comments & alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Quick Preset Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Quick Presets & Tags
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {PRESET_NOTES.map((preset) => {
                const isSelected = note.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (note.includes(preset)) {
                        setNote(note.replace(preset, '').trim());
                      } else {
                        setNote(note ? `${note} • ${preset}` : preset);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Text Area */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Custom Comment / Allergy Details
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Birthday celebration, severely allergic to peanuts, needs highchair..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              Note will be pinned to Table #{table.tableNumber} across all waitstaff and manager screens until cleared.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            {table.customStatusNote ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 text-xs font-semibold transition-colors"
              >
                Clear Note
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? 'Saving...' : 'Save Table Note'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
