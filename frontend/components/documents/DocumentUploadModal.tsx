"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Document } from "@/lib/types";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  onSuccess: (newDoc: Document) => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a document file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const doc = await api.uploadDocument(supplierId, file);
      setIsUploading(false);
      onSuccess(doc);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/60 dark:bg-gray-800/60">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Upload Supplier Document</h2>
            <p className="text-xs text-gray-500 mt-0.5">Supplier: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{supplierName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                : "border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 hover:border-indigo-400"
            }`}
          >
            <svg className="w-10 h-10 text-indigo-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Drag & drop document file here, or{" "}
              <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                browse files
                <input
                  type="file"
                  accept=".pdf,.xlsx,.docx,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Supports PDF, XLSX, DOCX, CSV (Max 50MB)</p>

            {file && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 text-xs font-mono text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <span className="truncate max-w-[240px] font-bold">{file.name}</span>
                <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading & Extraction Enqueued...
                </>
              ) : (
                "Upload Document & Start Extraction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
