"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Supplier, Document, Evidence } from "@/lib/types";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    title: string;
    evidenceList: Evidence[];
  }>({ isOpen: false, title: "", evidenceList: [] });

  const loadCaseSuppliers = async () => {
    setIsLoading(true);
    try {
      const supList = await api.getSuppliers(id);
      setSuppliers(supList);
      if (supList.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supList[0].id);
      }
    } catch (err) {
      console.error("Failed to load suppliers", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupplierDocsAndEvidence = async (supplierId: string) => {
    if (!supplierId) return;
    try {
      const [docs, evs] = await Promise.all([
        api.getDocuments(supplierId),
        api.getEvidence(supplierId),
      ]);
      setDocuments(docs);
      setEvidenceList(evs);
    } catch (err) {
      console.error("Failed to load docs/evidence", err);
    }
  };

  useEffect(() => {
    loadCaseSuppliers();
  }, [id]);

  useEffect(() => {
    if (selectedSupplierId) {
      loadSupplierDocsAndEvidence(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <span className="badge-pass px-2.5 py-0.5 rounded-full text-[10px] font-bold">READY</span>;
      case "NEEDS_REVIEW":
        return <span className="badge-review px-2.5 py-0.5 rounded-full text-[10px] font-bold">NEEDS REVIEW</span>;
      case "ERROR":
        return <span className="badge-fail px-2.5 py-0.5 rounded-full text-[10px] font-bold">ERROR</span>;
      default:
        return <span className="badge-pending px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Supplier Selector */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Documents & Evidence Traceability
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
            Upload supplier certificates, brochures, and quotes. Inspect extracted claims with direct line, page, and sheet citations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeSupplier && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Supplier Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto">
        {suppliers.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSupplierId(s.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedSupplierId === s.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span>{s.name}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedSupplierId === s.id
                  ? "bg-indigo-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {s.status}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading documents & evidence...</div>
      ) : !activeSupplier ? (
        <div className="p-12 text-center text-xs text-gray-500">No active supplier selected.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Uploaded Documents Timeline */}
          <div className="glass-card rounded-2xl border shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Document Files ({documents.length})
              </h3>
              <span className="text-[10px] font-mono text-gray-400">PDF / XLSX / DOCX</span>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 border border-dashed rounded-xl">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="truncate max-w-[200px]">
                        <span className="font-bold text-xs text-gray-900 dark:text-white truncate block">
                          {doc.display_name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {doc.page_count ? `${doc.page_count} pages` : "File"} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      {getDocStatusBadge(doc.status)}
                    </div>

                    {doc.error_message && (
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-[10px] font-mono text-red-700 dark:text-red-300">
                        {doc.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Extracted Evidence Claims Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Extracted Evidence Claims ({evidenceList.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verifiable claims parsed from supplier files with confidence metrics.
                </p>
              </div>

              {evidenceList.length > 0 && (
                <button
                  onClick={() =>
                    setDrawerData({
                      isOpen: true,
                      title: `${activeSupplier.name} — Full Traceability Drawer`,
                      evidenceList,
                    })
                  }
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Open Audit Drawer &rarr;
                </button>
              )}
            </div>

            {evidenceList.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No evidence claims extracted for this supplier yet. Upload a document to trigger ingestion.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="text-[10px] uppercase tracking-wider bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-3 font-bold">Field Key</th>
                      <th className="px-6 py-3 font-bold">Extracted Raw Value</th>
                      <th className="px-6 py-3 font-bold">Confidence</th>
                      <th className="px-6 py-3 font-bold">Citation Excerpt</th>
                      <th className="px-6 py-3 font-bold">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {evidenceList.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {ev.field_key}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-white max-w-xs truncate">
                          {ev.raw_value}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            ev.confidence >= 0.9 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {Math.round(ev.confidence * 100)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 italic text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          &ldquo;{ev.quoted_text || "N/A"}&rdquo;
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            ev.state === "SUPPORTED"
                              ? "badge-pass"
                              : ev.state === "CONFLICTING"
                              ? "badge-fail"
                              : "badge-review"
                          }`}>
                            {ev.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {activeSupplier && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          supplierId={activeSupplier.id}
          supplierName={activeSupplier.name}
          onSuccess={() => loadSupplierDocsAndEvidence(activeSupplier.id)}
        />
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
