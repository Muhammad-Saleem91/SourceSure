import React from 'react';

interface StatusBadgeProps {
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'PENDING' | string;
  size?: 'default' | 'large';
  clickable?: boolean;
  onClick?: () => void;
}

export function StatusBadge({ status, size = 'default', clickable = false, onClick }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    PASS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    FAIL: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const badgeColor = colors[status] || colors.PENDING;
  const cursorClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';
  const sizeClass = size === 'large' ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1.5';

  return (
    <span 
      onClick={onClick}
      className={`rounded-lg font-bold uppercase inline-flex items-center justify-center ${badgeColor} ${sizeClass} ${cursorClass}`}
    >
      {status}
    </span>
  );
}
