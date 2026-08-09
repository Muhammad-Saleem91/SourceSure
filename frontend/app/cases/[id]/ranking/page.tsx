"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import {
  RankingScenarioResponse,
  Requirement,
  Evidence,
  NormalizationMethod,
} from "@/lib/types";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";

export default function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [scenario, setScenario] = useState<RankingScenarioResponse | null>(null);
  const [preferences, setPreferences] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scenario Builder state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>("MIN_MAX_V1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence Drawer state
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    title: string;
    evidenceList: Evidence[];
  }>({ isOpen: false, title: "", evidenceList: [] });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scen, reqs] = await Promise.all([
        api.getRankingScenario(id),
        api.getRequirements(id),
      ]);
      setScenario(scen);
      const prefList = reqs.filter((r: Requirement) => r.kind === "PREFERENCE");
      setPreferences(prefList);

      // Initialize default weights map
      const initialWeights: Record<string, number> = {};
      prefList.forEach((r: Requirement) => {
        initialWeights[r.key] = r.weight || 0.5;
      });

      setWeights(initialWeights);
    } catch (err) {
      console.error("Failed to load ranking data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createRankingScenario(id, {
        name: scenarioName.trim(),
        weights,
        normalization_method: normalizationMethod,
      });
      setScenario(created);
      setShowCreateModal(false);
      setScenarioName("");
    } catch (err: any) {
      alert(err.message || "Failed to create ranking scenario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspectEvidence = async (supplierId: string, supplierName: string) => {
    const evidenceList = await api.getEvidence(supplierId);
    setDrawerData({
      isOpen: true,
      title: `${supplierName} — Scoring Evidence Verification`,
      evidenceList,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Scenario Action */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Phase 4 Multi-Criteria Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Supplier Ranking & Leaderboard
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Calculates weighted scores across preference requirements using min-max normalization. Strictly enforces PASS-only eligibility.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Ranking Scenario
        </button>
      </div>

      {/* PASS-Only Golden Rule Banner */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-950 dark:text-purple-200 text-xs space-y-1.5">
        <div className="font-extrabold flex items-center gap-2 uppercase tracking-wider text-purple-800 dark:text-purple-300">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
          Backend Phase 4 Golden Rule: PASS-Only Candidates
        </div>
        <p className="leading-relaxed">
          Only suppliers who passed 100% of Phase 3 mandatory checks are scored and ranked. Suppliers with status <span className="font-extrabold text-red-600">FAIL</span> or <span className="font-extrabold text-amber-600">REVIEW</span> are excluded server-side from score calculation to maintain audit integrity.
        </p>
      </div>

      {/* Active Scenario Card */}
      {isLoading || !scenario ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading ranking scenario...</div>
      ) : (
        <div className="space-y-8">
          {/* Active Scenario Header */}
          <div className="glass-card p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-gray-400">Active Scenario</span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{scenario.name}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                <span>Method: <strong className="text-purple-600 dark:text-purple-400">{scenario.normalization_method}</strong></span>
                <span>•</span>
                <span>Created: {new Date(scenario.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Weights Summary Bar */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Weight Distribution</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(scenario.weights).map(([k, w]) => (
                  <div key={k} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase truncate">{k}</span>
                    <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                      {(w * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Cards */}
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
                      onClick={() => handleInspectEvidence(res.supplier_id, res.supplier_name || "Supplier")}
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
                          <th className="px-4 py-3 font-bold">Normalized Score (0-1)</th>
                          <th className="px-4 py-3 font-bold">Criterion Weight</th>
                          <th className="px-4 py-3 font-bold">Weighted Score Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {res.score_components.map((sc) => (
                          <tr key={sc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {sc.field_key || sc.requirement_id}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                              {String(sc.raw_value ?? "N/A")}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {sc.normalized_score !== undefined ? sc.normalized_score.toFixed(3) : "1.000"}
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
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-6 z-10 border border-gray-200 dark:border-gray-800 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Create Ranking Scenario</h3>
              <p className="text-xs text-gray-500">Configure weighting priorities across preference requirements.</p>
            </div>

            <form onSubmit={handleCreateScenario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality Priority Benchmark"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Normalization Algorithm
                </label>
                <select
                  value={normalizationMethod}
                  onChange={(e) => setNormalizationMethod(e.target.value as NormalizationMethod)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                >
                  <option value="MIN_MAX_V1">MIN_MAX_V1 (Linear Min-Max Rescaling)</option>
                  <option value="Z_SCORE">Z_SCORE (Standard Deviation Scaling)</option>
                  <option value="LINEAR_SCALE">LINEAR_SCALE (Ratio Scaling)</option>
                </select>
              </div>

              {/* Preferences Sliders */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                  Criterion Weights
                </span>

                {preferences.map((p) => (
                  <div key={p.key} className="space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{p.label}</span>
                      <span className="font-mono text-purple-600 font-extrabold">
                        {((weights[p.key] || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights[p.key] || 0.5}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [p.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Calculating..." : "Compute Ranking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={drawerData.isOpen}
        onClose={() => setDrawerData((prev) => ({ ...prev, isOpen: false }))}
        title={drawerData.title}
        evidenceList={drawerData.evidenceList}
      />
    </div>
  );
}
