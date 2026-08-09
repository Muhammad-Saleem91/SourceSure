"use client";

import { EligibilityMatrixResponse, Requirement, EligibilityCheck } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface EligibilityMatrixProps {
  matrix: EligibilityMatrixResponse;
  requirements: Requirement[];
  onCellClick: (
    supplierName: string,
    reqLabel: string,
    reqKey: string,
    check?: EligibilityCheck,
    supplierId?: string
  ) => void;
}

export function EligibilityMatrix({ matrix, requirements, onCellClick }: EligibilityMatrixProps) {
  const passCount = matrix.suppliers.filter(s => s.overall_status === 'PASS').length;
  const failCount = matrix.suppliers.filter(s => s.overall_status === 'FAIL').length;
  const reviewCount = matrix.suppliers.filter(s => s.overall_status === 'REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white">
                Supplier
              </th>
              {requirements.map((req) => (
                <th key={req.id} className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white">
                  {req.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.suppliers.map((supplier) => {
              return (
                <tr key={supplier.supplier_id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {supplier.supplier_name}
                  </td>
                  {requirements.map((req) => {
                    const check = supplier.checks.find(c => c.requirement_id === req.id || c.reason_code.includes(req.key));
                    return (
                      <td key={req.id} className="px-6 py-4">
                        <StatusBadge 
                          status={check?.status || 'PENDING'} 
                          clickable 
                          onClick={() => onCellClick(supplier.supplier_name, req.label, req.key, check, supplier.supplier_id)} 
                        />
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 font-bold">
                    <StatusBadge status={supplier.overall_status || 'PENDING'} size="large" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Eligibility Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {passCount} suppliers eligible for ranking
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
              {failCount} supplier excluded
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {reviewCount} supplier requires review
            </div>
          </div>
        </div>
        <button className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">
          Continue to Ranking
        </button>
      </div>
    </div>
  );
}
