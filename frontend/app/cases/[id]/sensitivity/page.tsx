"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { RankingScenarioResponse, RankingResult } from "@/lib/types";
import { RankingComparisonChart } from "@/components/sensitivity/RankingComparisonChart";
import Link from "next/link";

export default function SensitivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [scenarios, setScenarios] = useState<RankingScenarioResponse[]>([]);
  const [baselineId, setBaselineId] = useState<string>('');
  const [compareToId, setCompareToId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
  }, [id]);

  const loadScenarios = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getRankingScenarios(id);
      setScenarios(data);
      if (data.length > 0) setBaselineId(data[0].id);
      if (data.length > 1) setCompareToId(data[1].id);
    } catch (err: any) {
      setLoadError(err?.message || "Unable to load ranking scenarios from the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Sensitivity Analysis
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Compare how ranking changes when preference weights change across different scenarios.
          </p>
        </div>
        <Link
          href={`/cases/${id}/ranking`}
          className="bg-accent-600 hover:bg-accent-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          &larr; Back to Leaderboard
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading sensitivity models...</div>
      ) : loadError ? (
        <div className="p-8 text-center text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
          {loadError}
        </div>
      ) : scenarios.length < 2 ? (
        <div className="p-12 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <p className="mb-4">You need at least two ranking scenarios to perform a sensitivity analysis.</p>
          <Link
            href={`/cases/${id}/ranking`}
            className="text-accent-600 hover:text-accent-700 font-bold"
          >
            Go to Ranking to create another scenario &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Scenario Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl border shadow-sm">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Baseline Scenario
              </label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-accent-500 outline-none transition-shadow"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card p-6 rounded-2xl border shadow-sm border-purple-200 dark:border-purple-900/50">
              <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
                Compare To Alternative
              </label>
              <select
                value={compareToId}
                onChange={(e) => setCompareToId(e.target.value)}
                className="w-full px-4 py-2.5 border border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
              >
                {scenarios.filter(s => s.id !== baselineId).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Grid */}
          {baselineId && compareToId && (
            <SensitivityComparison
              caseId={id}
              baselineScenarioId={baselineId}
              compareScenarioId={compareToId}
            />
          )}
        </>
      )}
    </div>
  );
}

interface SensitivityComparisonProps {
  caseId: string;
  baselineScenarioId: string;
  compareScenarioId: string;
}

function SensitivityComparison({
  caseId,
  baselineScenarioId,
  compareScenarioId,
}: SensitivityComparisonProps) {
  const [baseline, setBaseline] = useState<RankingResult[] | null>(null);
  const [comparison, setComparison] = useState<RankingResult[] | null>(null);

  useEffect(() => {
    loadComparison();
  }, [baselineScenarioId, compareScenarioId]);

  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const loadComparison = async () => {
    setComparisonError(null);
    try {
      const [b, c] = await Promise.all([
        api.getRankingScenario(caseId, baselineScenarioId),
        api.getRankingScenario(caseId, compareScenarioId),
      ]);
      setBaseline(b.results);
      setComparison(c.results);
    } catch (err: any) {
      setComparisonError(err?.message || "Unable to load scenario results for comparison.");
    }
  };

  if (comparisonError) {
    return (
      <div className="text-center p-8 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
        {comparisonError}
      </div>
    );
  }

  if (!baseline || !comparison) return <div className="text-center p-8 text-sm text-gray-500">Loading comparison...</div>;

  return (
    <div className="space-y-8">
      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingList results={baseline} title="Baseline Leaderboard" type="baseline" />
        <RankingList results={comparison} title="Alternative Leaderboard" type="comparison" />
      </div>

      {/* Impact Summary */}
      <RankingImpactSummary baseline={baseline} comparison={comparison} />

      {/* Bar Chart Comparison */}
      <RankingComparisonChart baseline={baseline} comparison={comparison} />
    </div>
  );
}

function RankingList({ results, title, type }: { results: RankingResult[]; title: string, type: 'baseline' | 'comparison' }) {
  const isBaseline = type === 'baseline';
  const colorClass = isBaseline ? 'text-gray-900 dark:text-white' : 'text-purple-900 dark:text-purple-100';
  const rankColorClass = isBaseline ? 'text-accent-600' : 'text-purple-600';
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className={`font-bold uppercase tracking-wider text-xs mb-4 ${isBaseline ? 'text-gray-500' : 'text-purple-600'}`}>{title}</h3>
      <div className="space-y-3">
        {results
          .map((result) => (
            <div key={result.supplier_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-black ${rankColorClass}`}>#{result.rank}</span>
                <span className={`font-semibold ${colorClass}`}>
                  {result.supplier_name || `Supplier ${result.supplier_id}`}
                </span>
              </div>
              <span className={`text-lg font-black font-mono ${colorClass}`}>
                {result.total_score.toFixed(1)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function RankingImpactSummary({
  baseline,
  comparison,
}: {
  baseline: RankingResult[];
  comparison: RankingResult[];
}) {
  // Calculate rank changes
  const changes = baseline.map((b) => {
    const comp = comparison.find(c => c.supplier_id === b.supplier_id);
    const baselineRank = b.rank;
    const comparisonRank = comp ? comp.rank : null;
    return {
      supplier_name: b.supplier_name || `Supplier ${b.supplier_id}`,
      baseline_rank: baselineRank,
      comparison_rank: comparisonRank,
      moved: comparisonRank ? baselineRank - comparisonRank : 0,
    };
  });

  const significantChanges = changes.filter(c => c.moved !== 0);

  if (significantChanges.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex items-start gap-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-300 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-1">Ranking is Stable</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
            The supplier rankings remain completely unchanged between the two scenarios. This indicates high confidence in the current leaderboard despite variations in business priority weighting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
        <h3 className="font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider text-xs">Ranking Impact Detected</h3>
      </div>
      <div className="space-y-3">
        {significantChanges.map((change) => (
          <div key={change.supplier_name} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30">
            <span className="font-semibold text-gray-900 dark:text-white">{change.supplier_name}</span>
            <div className="flex items-center gap-3 font-mono text-sm font-bold">
              <span className="text-gray-500">#{change.baseline_rank}</span>
              <span className="text-gray-400">&rarr;</span>
              <span className={change.moved > 0 ? 'text-emerald-600' : 'text-red-600'}>#{change.comparison_rank}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ml-2 ${change.moved > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {change.moved > 0 ? '↑' : '↓'} {Math.abs(change.moved)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
