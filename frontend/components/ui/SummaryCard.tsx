import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext: React.ReactNode;
  titleColorClass?: string;
  valueColorClass?: string;
  subtextColorClass?: string;
}

export function SummaryCard({
  title,
  value,
  subtext,
  titleColorClass = 'text-gray-500',
  valueColorClass = 'text-gray-900 dark:text-white',
  subtextColorClass = 'text-gray-500',
}: SummaryCardProps) {
  return (
    <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
      <div className={`text-xs font-bold uppercase tracking-wider ${titleColorClass}`}>
        {title}
      </div>
      <div className={`text-4xl font-black mt-2 ${valueColorClass}`}>
        {value}
      </div>
      <div className={`text-xs mt-1 font-medium ${subtextColorClass}`}>
        {subtext}
      </div>
    </div>
  );
}
