"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Overview & Suppliers", href: `/cases/${caseId}`, phase: "0/1" },
    { name: "Requirements Schema", href: `/cases/${caseId}/requirements`, phase: "1" },
    { name: "Documents & Evidence", href: `/cases/${caseId}/documents`, phase: "2" },
    { name: "Eligibility Matrix", href: `/cases/${caseId}/eligibility`, phase: "3" },
    { name: "Ranking Scenarios", href: `/cases/${caseId}/ranking`, phase: "4" },
    { name: "Sensitivity Sandbox", href: `/cases/${caseId}/sensitivity`, phase: "4" },
    { name: "Decision Summary", href: `/cases/${caseId}/decision`, phase: "5" },


  ];

  return (
    <div className="border-b border-gray-200/80 dark:border-gray-800 mb-8 overflow-x-auto">
      <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const isFuture = tab.phase.includes("Future");

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2
                ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                    : isFuture
                    ? "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                }
              `}
            >
              <span>{tab.name}</span>
              {isFuture ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {tab.phase}
                </span>
              ) : (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isActive
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  P{tab.phase}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

