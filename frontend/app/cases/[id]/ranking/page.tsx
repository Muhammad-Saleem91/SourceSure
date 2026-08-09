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
import { ScenarioConfiguration } from "@/components/ranking/ScenarioConfiguration";
import { RankingResults } from "@/components/ranking/RankingResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

export default function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [scenario, setScenario] = useState<RankingScenarioResponse | null>(null);
  const [preferences, setPreferences] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Scenario Builder state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>("MIN_MAX_V1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  // Evidence Drawer state
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    title: string;
    evidenceList: Evidence[];
  }>({ isOpen: false, title: "", evidenceList: [] });

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [scenarios, reqs] = await Promise.all([
        api.getRankingScenarios(id),
        api.getRequirements(id),
      ]);
      // Most recent scenario is the "active" one shown on this screen.
      setScenario(scenarios[0] || null);
      const prefList = reqs.filter((r: Requirement) => r.kind === "PREFERENCE");
      setPreferences(prefList);

      // Initialize default weights map
      const initialWeights: Record<string, number> = {};
      prefList.forEach((r: Requirement) => {
        initialWeights[r.key] = r.weight || 0.5;
      });

      setWeights(initialWeights);
    } catch (err: any) {
      setLoadError(err?.message || "Unable to load ranking data from the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const totalWeightPct = Math.round(
    Object.values(weights).reduce((sum, w) => sum + (w || 0), 0) * 100
  );
  const weightsValid = totalWeightPct === 100;

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim() || !weightsValid) return;

    setIsSubmitting(true);
    setScenarioError(null);
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
      setScenarioError(err?.message || "Unable to create ranking scenario. Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspectEvidence = async (supplierId: string, supplierName: string) => {
    try {
      const evidenceList = await api.getEvidence(supplierId);
      setDrawerData({
        isOpen: true,
        title: `${supplierName} — Scoring Evidence Verification`,
        evidenceList,
      });
    } catch (err: any) {
      setLoadError(err?.message || "Unable to load evidence for this supplier.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Scenario Action */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Multi-Criteria Ranking Engine
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
          Golden Rule: PASS-Only Candidates
        </div>
        <p className="leading-relaxed">
          Only suppliers who passed 100% of mandatory eligibility checks are scored and ranked. Suppliers with status <span className="font-extrabold text-red-600">FAIL</span> or <span className="font-extrabold text-amber-600">REVIEW</span> are excluded server-side from score calculation to maintain audit integrity.
        </p>
      </div>

      {/* Active Scenario Card */}
      {isLoading ? (
        <LoadingState message="Loading ranking scenario..." />
      ) : loadError ? (
        <ErrorState title="Couldn't load ranking data" message={loadError} />
      ) : !scenario ? (
        <EmptyState
          title="No ranking scenario yet"
          message="Create a scenario above to weight preference requirements and score every PASS supplier."
        />
      ) : (
        <div className="space-y-8">
          {/* Active Scenario Header & Configuration */}
          <ScenarioConfiguration scenario={scenario} />

          {/* Leaderboard Cards */}
          <RankingResults scenario={scenario} onInspectEvidence={handleInspectEvidence} preferences={preferences} />
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

                <div className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold ${
                  weightsValid
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                }`}>
                  <span>Total Weight</span>
                  <span className="font-mono">{totalWeightPct}%</span>
                </div>
                {!weightsValid && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Preference weights must total 100% before you can compute a ranking. Adjust the sliders above.
                  </p>
                )}
              </div>

              {scenarioError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold">
                  {scenarioError}
                </div>
              )}

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
                  disabled={isSubmitting || !weightsValid}
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
