"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Supplier, Requirement, Evidence, Document } from "@/lib/types";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";

export default function CaseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Supplier Modal state
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierRef, setNewSupplierRef] = useState("");
  const [newSupplierCountry, setNewSupplierCountry] = useState("Germany");

  // Document Upload Modal state
  const [uploadSupplier, setUploadSupplier] = useState<Supplier | null>(null);

  // Evidence Drawer state
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    title: string;
    evidenceList: Evidence[];
  }>({ isOpen: false, title: "", evidenceList: [] });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [supList, reqList] = await Promise.all([
        api.getSuppliers(id),
        api.getRequirements(id),
      ]);
      setSuppliers(supList);
      setRequirements(reqList);
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    try {
      await api.createSupplier(id, {
        name: newSupplierName.trim(),
        external_ref: newSupplierRef.trim() || undefined,
        country: newSupplierCountry.trim(),
      });
      setNewSupplierName("");
      setNewSupplierRef("");
      setShowAddSupplier(false);
      loadData();
    } catch (err) {
      alert("Failed to add supplier");
    }
  };

  const handleViewEvidence = async (supplier: Supplier) => {
    const evidenceList = await api.getEvidence(supplier.id);
    setDrawerData({
      isOpen: true,
      title: `${supplier.name} — Extracted Evidence Claims`,
      evidenceList,
    });
  };

  const passCount = suppliers.filter((s) => s.status === "PASS").length;

  return (
    <div className="space-y-8">
      {/* Metrics Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shortlisted Suppliers</div>
          <div className="text-4xl font-black text-gray-900 dark:text-white mt-2">{suppliers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Candidates in evaluation batch</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Configured Requirements</div>
          <div className="text-4xl font-black text-gray-900 dark:text-white mt-2">{requirements.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            {requirements.filter((r) => r.kind === "MANDATORY").length} Mandatory • {requirements.filter((r) => r.kind === "PREFERENCE").length} Preference
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Eligible (PASS) Suppliers</div>
          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{passCount}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Qualifies for Phase 4 Ranking
          </div>
        </div>
      </div>

      {/* Supplier Management Section */}
      <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/40">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Supplier Evaluation Batch
              <span className="text-xs font-mono font-normal text-gray-500">({suppliers.length} suppliers)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload compliance documents and extract evidence claims per supplier.
            </p>
          </div>

          <button
            onClick={() => setShowAddSupplier(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-500">Loading supplier records...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No suppliers added yet. Click &quot;Add Supplier&quot; to begin.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{s.name}</h3>
                    <span
                      className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        s.status === "PASS"
                          ? "badge-pass"
                          : s.status === "FAIL"
                          ? "badge-fail"
                          : s.status === "REVIEW"
                          ? "badge-review"
                          : "badge-pending"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-3 font-mono">
                    <span>Ref: {s.external_ref || "SUP-REF-N/A"}</span>
                    <span>•</span>
                    <span>Country: {s.country || "N/A"}</span>
                    <span>•</span>
                    <span>Docs: {s.document_count ?? 0}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setUploadSupplier(s)}
                    className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Documents
                  </button>

                  <button
                    onClick={() => handleViewEvidence(s)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Inspect Evidence Trace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddSupplier(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-6 z-10 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Add Supplier Candidate</h3>
            <p className="text-xs text-gray-500 mb-6">Register a new vendor to evaluate for this sourcing case.</p>

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision Components Inc."
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  External Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUP-PCI-88"
                  value={newSupplierRef}
                  onChange={(e) => setNewSupplierRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  placeholder="e.g. Germany, Japan, USA"
                  value={newSupplierCountry}
                  onChange={(e) => setNewSupplierCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md"
                >
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {uploadSupplier && (
        <DocumentUploadModal
          isOpen={!!uploadSupplier}
          onClose={() => setUploadSupplier(null)}
          supplierId={uploadSupplier.id}
          supplierName={uploadSupplier.name}
          onSuccess={() => loadData()}
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
