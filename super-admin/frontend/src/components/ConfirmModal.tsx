import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'success' | 'warning';
  showInput?: boolean;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  showInput = false,
  inputPlaceholder = 'Enter reason...',
  onConfirm,
  onClose,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue('');
  };

  const colors = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div
            className={`p-3 rounded-xl border ${
              type === 'danger'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1 pr-6">
            <h4 className="text-lg font-bold font-heading text-white">{title}</h4>
            <p className="text-sm text-slate-400 mt-1.5">{message}</p>
          </div>
        </div>

        {showInput && (
          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Reason / Notes:
            </label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (showInput && !inputValue.trim() && type === 'danger')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-lg transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${colors[type]}`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
