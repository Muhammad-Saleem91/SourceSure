import React, { useState } from 'react';
import { RankingScenarioResponse } from '@/lib/types';

interface ScenarioConfigurationProps {
  scenario: RankingScenarioResponse;
}

export function ScenarioConfiguration({ scenario }: ScenarioConfigurationProps) {
  const [weights, setWeights] = useState(scenario.weights);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleWeightChange = (criterion: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [criterion]: value / 100,
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Business Priorities</h3>

      <div className="space-y-6">
        {Object.entries(weights).map(([criterion, weight]) => (
          <div key={criterion}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-gray-900 dark:text-white">{criterion}</label>
              <span className="text-sm font-bold text-indigo-600">{(weight * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={(weight * 100).toFixed(0)}
                onChange={(e) => handleWeightChange(criterion, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={(weight * 100).toFixed(0)}
                onChange={(e) => handleWeightChange(criterion, parseInt(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-black"
              />
            </div>
            {/* Visual bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${(weight * 100).toFixed(0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">Total Weight</span>
          <span className={`text-lg font-bold ${Math.abs(totalWeight - 1) < 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
            {(totalWeight * 100).toFixed(0)}%
          </span>
        </div>
        {Math.abs(totalWeight - 1) >= 0.01 && (
          <p className="text-xs text-red-600 mt-2">
            Weights must total 100%
          </p>
        )}
      </div>
    </div>
  );
}
