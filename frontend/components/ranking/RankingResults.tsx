import React, { useState } from 'react';
import { RankingScenarioResponse, Requirement } from '@/lib/types';

interface RankingResultsProps {
  scenario: RankingScenarioResponse;
  onInspectEvidence: (supplierId: string, supplierName: string) => void;
  preferences?: Requirement[];
}

function RelativeScoreHeader() {
  const [open, setOpen] = useState(false);
  return (
    <th className="px-4 py-3 font-bold relative">
      <span className="inline-flex items-center gap-1">
        Relative Score
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-black flex items-center justify-center normal-case"
          aria-label="What is a Relative Score?"
        >
          i
        </button>
      </span>
      {open && (
        <div className="absolute z-10 top-full left-0 mt-2 w-64 p-3 rounded-xl bg-gray-900 text-white text-[11px] font-normal leading-relaxed shadow-lg normal-case">
          Converts each supplier&apos;s raw metric onto a common 0–100 scale using Min-Max scaling. 100 is the strongest eligible supplier for that criterion, 0 is the weakest &mdash; it is not a pass/fail grade.
        </div>
      )}
    </th>
  );
}

export function RankingResults({ scenario, onInspectEvidence, preferences = [] }: RankingResultsProps) {
  const labelFor = (requirementId: string, fieldKey?: string) => {
    const match = preferences.find((r) => r.id === requirementId || r.key === fieldKey);
    return match?.label || fieldKey || requirementId;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
        Ranked Supplier Leaderboard ({scenario.results.length} Eligible Candidate)
      </h3>

      {scenario.results.map((res) => (
        <div
          key={res.id}
          className="glass-card rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-md p-6 space-y-6"
        >
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                #{res.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">
                    {res.supplier_name || `Supplier ${res.supplier_id}`}
                  </h4>
                  <span className="badge-pass px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                    ELIGIBLE (PASS)
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  Calculated at: {res.calculated_at ? new Date(res.calculated_at).toLocaleTimeString() : "Just now"}
                </span>
              </div>
            </div>

            {/* Total Score Display */}
            <div className="flex items-center gap-4 bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Overall Score</span>
                <span className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {res.total_score.toFixed(1)} <span className="text-sm">/ 100</span>
                </span>
              </div>
              <button
                onClick={() => onInspectEvidence(res.supplier_id, res.supplier_name || "Supplier")}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs shadow-md transition-colors"
              >
                Inspect Score Evidence
              </button>
            </div>
          </div>

          {/* Score Component Breakdown Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Mathematical Score Contribution Breakdown (Raw &rarr; Normalized &rarr; Weighted)
            </span>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="text-[10px] uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-bold">Preference Criterion</th>
                    <th className="px-4 py-3 font-bold">Observed Raw Value</th>
                    <RelativeScoreHeader />
                    <th className="px-4 py-3 font-bold">Criterion Weight</th>
                    <th className="px-4 py-3 font-bold">Weighted Score Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {res.score_components.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {labelFor(sc.requirement_id, sc.field_key)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {String(sc.raw_value ?? "N/A")}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {sc.normalized_score !== undefined ? Math.round(sc.normalized_score * 100) : 100}
                        <span className="text-gray-400"> / 100</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-700 dark:text-purple-300 font-bold">
                        {(sc.weight * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        +{sc.weighted_score.toFixed(1)} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
