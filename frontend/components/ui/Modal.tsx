import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full shadow-2xl p-6 z-10 border border-gray-200 dark:border-gray-800 transition-all transform scale-100 opacity-100">
        <div className="mb-6">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
        
        {children}
      </div>
    </div>
  );
}
