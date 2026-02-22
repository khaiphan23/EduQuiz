import React, { useState } from 'react';
import { X, Copy, Check, Globe, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, link }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLocalOrPreview = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.hostname.includes('.goog'); // Detect Google IDX/AI Studio previews

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center sm:text-left">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0">
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">
              Chia sẻ bài trắc nghiệm
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">
                Gửi liên kết này cho học sinh để họ bắt đầu làm bài.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Liên kết chia sẻ
            </label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                readOnly
                value={link}
                className="block w-full rounded-l-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={onClose} className="w-full sm:w-auto">
              Xong
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};