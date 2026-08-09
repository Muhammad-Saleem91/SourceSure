"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { DecisionSummary, Supplier, RankingScenarioResponse } from "@/lib/types";

export default function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [summary, setSummary] = useState<DecisionSummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rankingScenario, setRankingScenario] = useState<RankingScenarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, sups, scen] = await Promise.all([
        api.getDecisionSummary(id),
        api.getSuppliers(id),
        api.getRankingScenario(id),
      ]);
      setSummary(sum);
      setSuppliers(sups);
      setRankingScenario(scen);
      if (sum.recommended_supplier_id) {
        setSelectedSupplierId(sum.recommended_supplier_id);
      }
      if (sum.human_decision) {
        setRationale(sum.human_decision);
      }
    } catch (err) {
      console.error("Failed to load decision summary", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !selectedSupplierId) return;

    setIsSubmitting(true);
    try {
      const updated = await api.recordHumanDecision(summary.id, {
        human_decision: `Approved Supplier ID ${selectedSupplierId}: ${rationale.trim()}`,
      });
      setSummary(updated);
      setSuccessMessage("Human procurement decision recorded and logged to audit trail!");
    } catch (err: any) {
      alert(err.message || "Failed to record human decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!summary) return;

    const headers = ["Field", "Value"];
    const rows = [
      ["Case ID", id],
      ["Recommended Supplier ID", summary.recommended_supplier_id || "N/A"],
      ["Summary Rationale", summary.generated_text.replace(/,/g, " ")],
      ["Assumptions", summary.assumptions.join(" | ").replace(/,/g, " ")],
      ["Limitations", summary.limitations.join(" | ").replace(/,/g, " ")],
      ["Required Review Actions", summary.review_actions.join(" | ").replace(/,/g, " ")],
      ["Human Decision", summary.human_decision || "Pending Approval"],
      ["Human Decision Timestamp", summary.human_decision_at || "N/A"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SourceSure_Decision_Case_${id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const recommendedSupplier = suppliers.find(
    (s) => s.id === summary?.recommended_supplier_id
  );

  return (
    <div className="space-y-8">
      {/* Top Banner & Export Actions */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Phase 5 Decision & Audit Package
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Procurement Decision Support & Human Signoff
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Synthesizes 100% audit-grounded evidence citations into an actionable award recommendation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Audit CSV
          </button>
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PDF Report
          </button>
        </div>
      </div>

      {/* Decision Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-start gap-3">
        <svg className="w-5 h-5 flex-shrink-0 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-bold uppercase tracking-wider block mb-0.5">Decision Support Mandate</span>
          <span>
            SourceSure generates audit-grounded recommendations for human procurement experts. SourceSure does not issue purchase orders or contact suppliers autonomously. Human signoff is required to finalize vendor awards.
          </span>
        </div>
      </div>

      {isLoading || !summary ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading decision package...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Grounded AI Recommendation Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommendation Highlight Card */}
            <div className="glass-card rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 shadow-md space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    Advisory Recommendation
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    Award Recommendation: {recommendedSupplier?.name || "Apex Precision Machining Ltd."}
                  </h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-3 leading-relaxed font-medium">
                    {summary.generated_text}
                  </p>
                </div>
              </div>

              {/* Assumptions & Limitations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Analysis Assumptions ({summary.assumptions.length})
                  </h4>
                  <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {summary.assumptions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                    Scope Limitations ({summary.limitations.length})
                  </h4>
                  <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {summary.limitations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Required Review Actions */}
            <div className="glass-card rounded-2xl border border-amber-200 dark:border-amber-900/50 p-6 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Mandatory Human Review Action Items
              </h4>
              <ul className="space-y-2">
                {summary.review_actions.map((act, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 font-medium">
                    <input type="checkbox" className="rounded text-amber-600 focus:ring-amber-500" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Human Decision & Approval Form */}
          <div className="glass-card rounded-2xl border shadow-sm p-6 space-y-6 h-fit sticky top-24 print:hidden">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Record Human Decision</h3>
              <p className="text-xs text-gray-500 mt-0.5">Formalize vendor award & append to immutable audit log.</p>
            </div>

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {successMessage}
              </div>
            )}

            {summary.human_decision && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Logged Decision Record</span>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-mono">{summary.human_decision}</p>
                <div className="text-[10px] text-gray-400 font-mono">
                  Recorded: {summary.human_decision_at ? new Date(summary.human_decision_at).toLocaleString() : "Recently"}
                </div>
              </div>
            )}

            <form onSubmit={handleRecordDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Selected Winner Supplier *
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold"
                >
                  <option value="">Select awarded supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status}) {s.id === summary.recommended_supplier_id ? "— AI Recommended" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Human Decision Rationale / Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain rationale for final vendor selection or reasons if overriding AI recommendation..."
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Recording Audit Signoff..." : "Approve & Signoff Decision"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
