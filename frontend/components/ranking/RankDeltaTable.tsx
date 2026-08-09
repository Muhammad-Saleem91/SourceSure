"use client";

import { RankingResultResponse } from "@/lib/types";

interface RankDeltaTableProps {
  baseResults: RankingResultResponse[];
  simulatedResults: RankingResultResponse[];
}

export function RankDeltaTable({ baseResults, simulatedResults }: RankDeltaTableProps) {
  return (
    <div className="glass-card rounded-2xl border p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
        Rank Delta & Sensitivity Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
          <thead className="text-[10px] uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-700 border-b">
            <tr>
              <th className="px-4 py-3 font-bold">Supplier Name</th>
              <th className="px-4 py-3 font-bold">Base Rank</th>
              <th className="px-4 py-3 font-bold">Simulated Rank</th>
              <th className="px-4 py-3 font-bold">Score Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {baseResults.map((base) => {
              const sim = simulatedResults.find((s) => s.supplier_id === base.supplier_id) || base;
              const scoreDelta = sim.total_score - base.total_score;

              return (
                <tr key={base.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{base.supplier_name}</td>
                  <td className="px-4 py-3 font-mono font-bold">Rank #{base.rank}</td>
                  <td className="px-4 py-3 font-mono font-bold text-purple-600">Rank #{sim.rank}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${scoreDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)} pts
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
