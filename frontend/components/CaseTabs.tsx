"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Overview", href: `/cases/${caseId}` },
    { name: "Requirements", href: `/cases/${caseId}/requirements` },
    { name: "Documents & Evidence", href: `/cases/${caseId}/documents` },
    { name: "Eligibility", href: `/cases/${caseId}/eligibility` },
    { name: "Ranking", href: `/cases/${caseId}/ranking` },
    { name: "Sensitivity", href: `/cases/${caseId}/sensitivity` },
    { name: "Decision", href: `/cases/${caseId}/decision` },
  ];

  return (
    <div className="border-b border-gray-200/80 dark:border-gray-800 mb-8 overflow-x-auto">
      <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-all
                ${isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
