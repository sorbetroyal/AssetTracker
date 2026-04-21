'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className={`p-3 rounded-2xl ${
              variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 
              variant === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
              'bg-blue-500/10 text-blue-500'
            }`}>
              <AlertCircle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-zinc-400 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 hover:text-white transition-all duration-300"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 rounded-2xl font-black transition-all duration-300 ${
                variant === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20' :
                variant === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-600 shadow-lg shadow-amber-500/20' :
                'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
