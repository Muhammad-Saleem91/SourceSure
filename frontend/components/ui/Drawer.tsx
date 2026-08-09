import React from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, side = 'right', children }: DrawerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div 
        className={`absolute top-0 bottom-0 ${
          side === 'right' ? 'right-0' : 'left-0'
        } w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col`}
      >
        {children}
      </div>
    </div>
  );
}
