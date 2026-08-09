"use client";

import { Document } from "@/lib/types";

interface DocumentSummaryPanelProps {
  documents: Document[];
  onUploadClick: () => void;
}

export function DocumentSummaryPanel({ documents, onUploadClick }: DocumentSummaryPanelProps) {
  const getBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <span className="badge-pass px-2 py-0.5 rounded text-[10px] font-bold">READY</span>;
      case "NEEDS_REVIEW":
        return <span className="badge-review px-2 py-0.5 rounded text-[10px] font-bold">NEEDS REVIEW</span>;
      case "ERROR":
        return <span className="badge-fail px-2 py-0.5 rounded text-[10px] font-bold">ERROR</span>;
      default:
        return <span className="badge-pending px-2 py-0.5 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl border p-6 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Uploaded Documents ({documents.length})</h3>
          <p className="text-[11px] text-gray-500">Ingested supplier certificates & specifications</p>
        </div>
        <button
          onClick={onUploadClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-1"
        >
          + Upload
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-xl">
          No files uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex justify-between items-center"
            >
              <div className="truncate max-w-[200px]">
                <span className="font-bold text-xs text-gray-900 dark:text-white truncate block">{doc.display_name}</span>
                <span className="text-[10px] font-mono text-gray-400">
                  {doc.page_count ? `${doc.page_count} pages` : "File"} • {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
              {getBadge(doc.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
