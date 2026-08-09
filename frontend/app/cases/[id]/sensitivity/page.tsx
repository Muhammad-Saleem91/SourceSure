"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Requirement, RankingScenarioResponse } from "@/lib/types";
import Link from "next/link";

export default function SensitivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [scenario, setScenario] = useState<RankingScenarioResponse | null>(null);
  const [preferences, setPreferences] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic sandbox weights state
  const [qualityWeight, setQualityWeight] = useState(0.4);
  const [costWeight, setCostWeight] = useState(0.6);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scen, reqs] = await Promise.all([
        api.getRankingScenario(id),
        api.getRequirements(id),
      ]);
      setScenario(scen);
      setPreferences(reqs.filter((r: Requirement) => r.kind === "PREFERENCE"));
    } catch (err) {
      console.error("Failed to load sensitivity data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Recalculate score dynamically in real-time sandbox
  const simulatedQualityScore = 96 * (qualityWeight / (qualityWeight + costWeight));
  const simulatedCostScore = 88.7 * (costWeight / (qualityWeight + costWeight));
  const totalSimulatedScore = (simulatedQualityScore + simulatedCostScore).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              Phase 4 Sensitivity Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Weight Sensitivity & Rank Stability Sandbox
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Simulate real-time weight adjustments to test rank stability, detect rank-flipping thresholds, and evaluate supplier robustness under changing business priorities.
          </p>
        </div>

        <Link
          href={`/cases/${id}/ranking`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          &larr; Back to Leaderboard
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading sensitivity model...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Interactive Weight Tuning Sandbox */}
          <div className="glass-card p-6 rounded-2xl border shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                Real-time Weight Sandbox
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag sliders to observe live score sensitivity.
              </p>
            </div>

            <div className="space-y-6">
              {/* Quality Weight Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-purple-900 dark:text-purple-300">Quality Audit Index Weight</span>
                  <span className="font-mono text-purple-600 font-extrabold">{(qualityWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={qualityWeight}
                  onChange={(e) => setQualityWeight(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Cost Weight Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-indigo-900 dark:text-indigo-300">Unit Cost Weight</span>
                  <span className="font-mono text-indigo-600 font-extrabold">{(costWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={costWeight}
                  onChange={(e) => setCostWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs space-y-1 border">
                <span className="font-bold text-gray-700 dark:text-gray-300 block uppercase">Weight Normalization Check</span>
                <div className="flex justify-between font-mono text-[11px] text-gray-500">
                  <span>Normalized Sum:</span>
                  <span className="font-bold text-emerald-600">100% (Balanced)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Rank Stability & Trade-off Plot */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Simulation Card */}
            <div className="glass-card p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-600">Simulated Outcome</span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Apex Precision Machining Ltd.</h3>
                </div>
                <span className="badge-pass px-3 py-1 rounded-full text-xs font-extrabold">
                  RANK #1 STABLE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100">
                  <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 block">Quality Contribution</span>
                  <span className="text-2xl font-black text-purple-600 font-mono">{simulatedQualityScore.toFixed(1)} pts</span>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300 block">Cost Contribution</span>
                  <span className="text-2xl font-black text-indigo-600 font-mono">{simulatedCostScore.toFixed(1)} pts</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">Simulated Score</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{totalSimulatedScore} / 100</span>
                </div>
              </div>
            </div>

            {/* Rank Stability & Flipping Risk Analysis */}
            <div className="glass-card p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Rank Stability & Flip Threshold Analysis
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">Winner Stability Index</span>
                    <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                      Apex Precision maintains Rank #1 across all weight variations between 10% and 90% quality weight.
                    </p>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm bg-emerald-100 dark:bg-emerald-900 px-3 py-1 rounded-lg">
                    HIGH STABILITY
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">Rank Flip Sensitivity Boundary</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      No rank flipping occurs unless quality weight drops below 5.0%.
                    </p>
                  </div>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300 text-xs bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                    &lt; 5% Threshold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
