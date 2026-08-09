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
import { EligibilityMatrix } from "@/components/eligibility/EligibilityMatrix";

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
  const [runError, setRunError] = useState<string | null>(null);

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
    setRunError(null);
    try {
      const res = await api.runEligibility(id);
      setRunMessage(
        `Eligibility Engine evaluated ${res.suppliers_evaluated} suppliers: PASS (${res.results.PASS || 0}), FAIL (${res.results.FAIL || 0}), REVIEW (${res.results.REVIEW || 0})`
      );
      await loadData();
    } catch (err: any) {
      setRunError(
        "Eligibility evaluation unavailable. Make sure requirements and supplier documents are uploaded, then try again."
      );
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
              Deterministic Rule Engine
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

      {runError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {runError}
        </div>
      )}

      {/* PASS-Only Gating Callout Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-500/30 text-gray-800 dark:text-gray-200 space-y-2">
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          PASS-Only Gating Boundary Enforcement
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <strong>Mandatory Rule:</strong> Only suppliers achieving an overall verdict of <span className="font-extrabold text-emerald-600 dark:text-emerald-400">PASS</span> qualify for ranking. Suppliers flagged as <span className="font-bold text-red-600">FAIL</span> or <span className="font-bold text-amber-600">REVIEW</span> are excluded until resolved by human compliance signoff or document re-ingestion.
        </p>
      </div>

      {/* Matrix Table */}
      {isLoading || !matrixData ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading eligibility matrix data...</div>
      ) : (
        <EligibilityMatrix
          matrix={matrixData}
          requirements={requirements}
          onCellClick={handleCellClick}
        />
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
