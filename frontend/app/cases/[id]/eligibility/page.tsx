"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import {
  EligibilityMatrixResponse,
  Requirement,
  Evidence,
  CheckStatus,
  EligibilityCheck,
} from "@/lib/types";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";

export default function EligibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [matrixData, setMatrixData] = useState<EligibilityMatrixResponse | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Evidence drawer state
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    title: string;
    requirementKey?: string;
    checkStatus?: CheckStatus;
    reasonCode?: string;
    explanation?: string;
    evidenceList: Evidence[];
  }>({
    isOpen: false,
    title: "",
    evidenceList: [],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matrix, reqs] = await Promise.all([
        api.getEligibilityMatrix(id),
        api.getRequirements(id),
      ]);
      setMatrixData(matrix);
      setRequirements(reqs.filter((r) => r.kind === "MANDATORY"));
    } catch (err) {
      console.error("Failed to load eligibility matrix", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunEngine = async () => {
    setIsRunning(true);
    setRunMessage(null);
    try {
      const res = await api.runEligibility(id);
      setRunMessage(
        `Eligibility Engine evaluated ${res.suppliers_evaluated} suppliers: PASS (${res.results.PASS || 0}), FAIL (${res.results.FAIL || 0}), REVIEW (${res.results.REVIEW || 0})`
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to trigger eligibility engine");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCellClick = async (
    supplierName: string,
    reqLabel: string,
    reqKey: string,
    check?: EligibilityCheck,
    supplierId?: string
  ) => {
    let evidenceList: Evidence[] = [];
    if (supplierId) {
      const allEv = await api.getEvidence(supplierId);
      if (check && check.evidence_ids.length > 0) {
        evidenceList = allEv.filter((ev) => check.evidence_ids.includes(ev.id));
      } else {
        evidenceList = allEv.filter((ev) => ev.field_key === reqKey);
      }
    }

    setDrawerData({
      isOpen: true,
      title: `${supplierName} — ${reqLabel}`,
      requirementKey: reqKey,
      checkStatus: check?.status || "PENDING",
      reasonCode: check?.reason_code,
      explanation: check?.explanation,
      evidenceList,
    });
  };

  const getStatusIcon = (status?: CheckStatus) => {
    switch (status) {
      case "PASS":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800 shadow-sm hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "FAIL":
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center justify-center mx-auto border border-red-300 dark:border-red-800 shadow-sm hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "REVIEW":
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800 shadow-sm hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 flex items-center justify-center mx-auto border border-gray-300 dark:border-gray-700">
            <span className="text-xs font-mono">?</span>
          </div>
        );
    }
  };

  const getOverallBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return (
          <span className="badge-pass px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            PASS
          </span>
        );
      case "FAIL":
        return (
          <span className="badge-fail px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            FAIL
          </span>
        );
      case "REVIEW":
        return (
          <span className="badge-review px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" /></svg>
            REVIEW
          </span>
        );
      default:
        return <span className="badge-pending px-3 py-1 rounded-full text-xs font-black uppercase">PENDING</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner & Re-run Button */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Phase 3 Deterministic Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Eligibility Evaluation Matrix
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Evaluates supplier compliance against mandatory requirements. Cell colors indicate check status. Click any cell to inspect verbatim evidence citations.
          </p>
        </div>

        <button
          onClick={handleRunEngine}
          disabled={isRunning}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 self-start md:self-auto"
        >
          <svg className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRunning ? "Running Rule Engine..." : "Re-run Eligibility Engine"}
        </button>
      </div>

      {runMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {runMessage}
        </div>
      )}

      {/* PASS-Only Gating Callout Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-500/30 text-gray-800 dark:text-gray-200 space-y-2">
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          PASS-Only Gating Boundary Enforcement
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <strong>Mandatory Rule:</strong> Only suppliers achieving an overall verdict of <span className="font-extrabold text-emerald-600 dark:text-emerald-400">PASS</span> qualify for Phase 4 multi-criteria ranking. Suppliers flagged as <span className="font-bold text-red-600">FAIL</span> or <span className="font-bold text-amber-600">REVIEW</span> are excluded until resolved by human compliance signoff or document re-ingestion.
        </p>
      </div>

      {/* Matrix Table */}
      {isLoading || !matrixData ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading eligibility matrix data...</div>
      ) : (
        <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-gray-600 dark:text-gray-300 border-collapse">
              <thead className="text-[11px] uppercase tracking-wider bg-gray-50/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4 font-extrabold text-left sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 min-w-[240px] border-r border-gray-200 dark:border-gray-700 shadow-sm">
                    Mandatory Requirement
                  </th>
                  {matrixData.suppliers.map((sup) => (
                    <th key={sup.supplier_id} scope="col" className="px-6 py-4 font-extrabold text-center min-w-[180px]">
                      <div className="text-sm text-gray-900 dark:text-white font-bold">{sup.supplier_name}</div>
                      <div className="mt-1 flex justify-center">{getOverallBadge(sup.overall_status)}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-indigo-50/20 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Sticky Row Title */}
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="font-bold text-sm">{req.label}</div>
                      <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {req.key} ({req.operator || "EQ"} {String(req.target_value)} {req.unit || ""})
                      </div>
                    </td>

                    {/* Supplier Cells */}
                    {matrixData.suppliers.map((sup) => {
                      const check = sup.checks.find(
                        (c) => c.requirement_id === req.id || c.reason_code.includes(req.key) || true
                      );
                      const status = check?.status || "PENDING";

                      return (
                        <td
                          key={sup.supplier_id}
                          onClick={() =>
                            handleCellClick(
                              sup.supplier_name,
                              req.label,
                              req.key,
                              check,
                              sup.supplier_id
                            )
                          }
                          className="px-6 py-4 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-800/60 transition-all group"
                          title="Click to view evidence citation details"
                        >
                          <div className="space-y-1">
                            {getStatusIcon(status)}
                            {check?.observed_value !== undefined && (
                              <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                Observed: {String(check.observed_value)} {check.observed_unit || ""}
                              </div>
                            )}
                            <div className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Inspect Evidence &rarr;
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50/90 dark:bg-gray-800/90 border-t-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <td className="px-6 py-4 font-black text-gray-900 dark:text-white sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-right uppercase tracking-wider">
                    Phase 4 Ranking Eligibility
                  </td>
                  {matrixData.suppliers.map((sup) => (
                    <td key={sup.supplier_id} className="px-6 py-4 text-center">
                      {sup.overall_status === "PASS" ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          ELIGIBLE FOR RANKING
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          EXCLUDED
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={drawerData.isOpen}
        onClose={() => setDrawerData((prev) => ({ ...prev, isOpen: false }))}
        title={drawerData.title}
        requirementKey={drawerData.requirementKey}
        checkStatus={drawerData.checkStatus}
        reasonCode={drawerData.reasonCode}
        explanation={drawerData.explanation}
        evidenceList={drawerData.evidenceList}
      />
    </div>
  );
}
