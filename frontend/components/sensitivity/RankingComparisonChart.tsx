import React from 'react';
import { RankingResult } from '@/lib/types';

interface RankingComparisonChartProps {
  baseline: RankingResult[];
  comparison: RankingResult[];
}

export function RankingComparisonChart({ baseline, comparison }: RankingComparisonChartProps) {
  // Combine and sort by baseline score
  const chartData = baseline.map(b => {
    const comp = comparison.find(c => c.supplier_id === b.supplier_id);
    return {
      supplier_name: b.supplier_name,
      baseline_score: b.total_score || 0,
      comparison_score: comp ? (comp.total_score || 0) : 0,
    };
  }).sort((a, b) => b.baseline_score - a.baseline_score);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Score Comparison</h3>
      
      <div className="space-y-6">
        {chartData.map((data, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
              <span>{data.supplier_name || `Supplier ${idx}`}</span>
            </div>
            
            <div className="space-y-1.5">
              {/* Baseline Bar */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-gray-500 text-right uppercase tracking-wider">Baseline</span>
                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-r-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gray-400 dark:bg-gray-600 transition-all" 
                    style={{ width: `${Math.max(0, Math.min(100, data.baseline_score))}%` }} 
                  />
                </div>
                <span className="w-8 text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300">
                  {data.baseline_score.toFixed(1)}
                </span>
              </div>
              
              {/* Comparison Bar */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-purple-500 text-right uppercase tracking-wider">Compare</span>
                <div className="flex-1 h-3 bg-purple-50 dark:bg-purple-900/30 rounded-r-full overflow-hidden flex">
                  <div 
                    className="h-full bg-purple-500 transition-all" 
                    style={{ width: `${Math.max(0, Math.min(100, data.comparison_score))}%` }} 
                  />
                </div>
                <span className="w-8 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {data.comparison_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-6 border-t border-gray-100 dark:border-gray-800 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-[10px] uppercase font-bold text-gray-500">Baseline Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-[10px] uppercase font-bold text-purple-600">Comparison Score</span>
        </div>
      </div>
    </div>
  );
}
