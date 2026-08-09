"use client";

import { ScoreComponentResponse } from "@/lib/types";

interface ScoreBreakdownProps {
  components: ScoreComponentResponse[];
}

export function ScoreBreakdown({ components }: ScoreBreakdownProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
        <thead className="text-[10px] uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b">
          <tr>
            <th className="px-4 py-3 font-bold">Preference Field</th>
            <th className="px-4 py-3 font-bold">Raw Value</th>
            <th className="px-4 py-3 font-bold">Normalized (0-1)</th>
            <th className="px-4 py-3 font-bold">Weight</th>
            <th className="px-4 py-3 font-bold">Score Contribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {components.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
              <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">{c.field_key || c.requirement_id}</td>
              <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{String(c.raw_value ?? "N/A")}</td>
              <td className="px-4 py-3 font-mono">{c.normalized_score !== undefined ? c.normalized_score.toFixed(3) : "1.000"}</td>
              <td className="px-4 py-3 font-mono text-purple-700 dark:text-purple-300 font-bold">{(c.weight * 100).toFixed(0)}%</td>
              <td className="px-4 py-3 font-mono font-black text-emerald-600 dark:text-emerald-400">+{c.weighted_score.toFixed(1)} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
