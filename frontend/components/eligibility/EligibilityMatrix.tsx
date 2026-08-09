"use client";

import { EligibilityMatrixResponse, CheckStatus } from "@/lib/types";

interface EligibilityMatrixProps {
  matrix: EligibilityMatrixResponse;
  onCellClick: (supplierId: string, reqKey: string) => void;
}

export function EligibilityMatrix({ matrix, onCellClick }: EligibilityMatrixProps) {
  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "PASS":
        return <span className="badge-pass px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">PASS</span>;
      case "FAIL":
        return <span className="badge-fail px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">FAIL</span>;
      case "REVIEW":
        return <span className="badge-review px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">REVIEW</span>;
      default:
        return <span className="badge-pending px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">PENDING</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-gray-600 dark:text-gray-300">
          <thead className="text-[11px] uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b">
            <tr>
              <th className="px-6 py-4 font-bold text-left sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                Requirement Key
              </th>
              {matrix.suppliers.map((s) => (
                <th key={s.supplier_id} className="px-6 py-4 font-bold text-center">
                  <div>{s.supplier_name}</div>
                  <div className="mt-1 font-mono text-[10px]">{s.overall_status}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {matrix.requirement_keys.map((reqKey) => (
              <tr key={reqKey} className="hover:bg-indigo-50/20 dark:hover:bg-gray-800/40">
                <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r">
                  {reqKey}
                </td>
                {matrix.suppliers.map((s) => {
                  const check = s.checks.find((c) => c.reason_code.includes(reqKey) || true);
                  return (
                    <td
                      key={s.supplier_id}
                      onClick={() => onCellClick(s.supplier_id, reqKey)}
                      className="px-6 py-4 text-center cursor-pointer hover:bg-indigo-50 transition-colors"
                    >
                      {getStatusIcon(check?.status || "PENDING")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
