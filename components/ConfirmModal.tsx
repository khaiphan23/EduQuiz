import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  preventCloseOnConfirm?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDestructive = false,
  isLoading = false,
  preventCloseOnConfirm = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={isLoading ? undefined : onClose}
      ></div>
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="sm:flex sm:items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDestructive ? 'bg-red-100' : 'bg-indigo-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-indigo-600'}`} />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'danger' : 'primary'} 
            onClick={() => {
              onConfirm();
              if (!preventCloseOnConfirm) onClose();
            }} 
            className={`w-full sm:w-auto ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
