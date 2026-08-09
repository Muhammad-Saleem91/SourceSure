"use client";

import { Evidence, CheckStatus } from "@/lib/types";

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  requirementKey?: string;
  checkStatus?: CheckStatus;
  reasonCode?: string;
  explanation?: string;
  evidenceList: Evidence[];
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  title,
  requirementKey,
  checkStatus,
  reasonCode,
  explanation,
  evidenceList,
}: EvidenceDrawerProps) {
  if (!isOpen) return null;

  const getStatusBadge = (status?: CheckStatus) => {
    switch (status) {
      case "PASS":
        return <span className="badge-pass px-2.5 py-1 rounded-full text-xs font-bold uppercase">PASS</span>;
      case "FAIL":
        return <span className="badge-fail px-2.5 py-1 rounded-full text-xs font-bold uppercase">FAIL</span>;
      case "REVIEW":
        return <span className="badge-review px-2.5 py-1 rounded-full text-xs font-bold uppercase">HUMAN REVIEW</span>;
      default:
        return <span className="badge-pending px-2.5 py-1 rounded-full text-xs font-bold uppercase">PENDING</span>;
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return "bg-emerald-500 text-emerald-700 dark:text-emerald-300";
    if (conf >= 0.7) return "bg-amber-500 text-amber-700 dark:text-amber-300";
    return "bg-red-500 text-red-700 dark:text-red-300";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl h-full flex flex-col z-10 border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-gray-50/60 dark:bg-gray-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                Traceability Audit Drawer
              </span>
              {getStatusBadge(checkStatus)}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
            {requirementKey && (
              <p className="text-xs font-mono text-gray-500 mt-1">Field Key: {requirementKey}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Reason & Verdict Explanation */}
          {(reasonCode || explanation) && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <span>Rule Engine Verdict</span>
                <span className="font-mono text-[11px] bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-200">
                  {reasonCode || "EVALUATED"}
                </span>
              </div>
              {explanation && (
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {explanation}
                </p>
              )}
            </div>
          )}

          {/* Evidence Records List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center justify-between">
              <span>Supporting Evidence Claims ({evidenceList.length})</span>
              <span className="text-[10px] text-gray-400 font-normal">Extracted by Document Ingestion Pipeline</span>
            </h3>

            {evidenceList.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs text-gray-500">No linked evidence citations found for this check.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm space-y-4"
                  >
                    {/* Top Meta Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
                          EVIDENCE #{ev.id}
                        </span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                          Field: <span className="font-mono text-indigo-600 dark:text-indigo-400">{ev.field_key}</span>
                        </div>
                      </div>

                      {/* Evidence State & Confidence */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            ev.state === "SUPPORTED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : ev.state === "CONFLICTING"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {ev.state}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                          <span>Confidence:</span>
                          <span className="font-bold">{Math.round(ev.confidence * 100)}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className={`h-full ${getConfidenceColor(ev.confidence)}`}
                              style={{ width: `${ev.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Raw vs Normalized Values */}
                    <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Raw Text Value</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200 break-words">{ev.raw_value}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Normalized Value</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {String(ev.normalized_value)} {ev.unit || ""}
                        </span>
                      </div>
                    </div>

                    {/* Quoted Text Excerpt with Citation location */}
                    {ev.quoted_text && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                          <span>Verbatim Citation Excerpt</span>
                          <span className="font-mono text-gray-500">
                            {ev.page_number ? `Page ${ev.page_number}` : ""}
                            {ev.sheet_name ? `Sheet: ${ev.sheet_name}` : ""}
                            {ev.cell_range ? ` (${ev.cell_range})` : ""}
                            {ev.section ? ` • ${ev.section}` : ""}
                          </span>
                        </div>
                        <blockquote className="p-3 rounded-xl border-l-4 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs italic text-gray-700 dark:text-gray-300 leading-relaxed">
                          &ldquo;{ev.quoted_text}&rdquo;
                        </blockquote>
                      </div>
                    )}

                    {/* Validation Reason or Provenance Note */}
                    {(ev.validation_reason || ev.provenance_method) && (
                      <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span>Method: {ev.provenance_method || "AI_PARSER"}</span>
                        {ev.validation_reason && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Warning: {ev.validation_reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Close Traceability Panel
          </button>
        </div>
      </div>
    </div>
  );
}
