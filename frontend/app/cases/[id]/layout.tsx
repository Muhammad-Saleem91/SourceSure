import { CaseTabs } from "@/components/CaseTabs";
import { api } from "@/lib/api/client";
import Link from "next/link";
import { CaseAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

// Function to determine status pills based on case state
function getStatusPills(analysis: CaseAnalysis) {
  const pills = [];

  // Always show ACTIVE
  pills.push({
    status: 'ACTIVE',
    color: 'emerald',
  });

  // Evidence state
  if (!analysis.has_documents) {
    pills.push({
      status: 'Evidence Pending',
      color: 'gray',
    });
  } else if (!analysis.eligibility_ready) {
    pills.push({
      status: 'Evidence Ready',
      color: 'indigo',
    });
  }

  // Eligibility state
  if (analysis.eligibility_ready && !analysis.ranking_ready) {
    pills.push({
      status: 'Eligibility Complete',
      color: 'indigo',
    });
    pills.push({
      status: 'Ranking Ready',
      color: 'indigo',
    });
  }

  // Ranking state
  if (analysis.ranking_ready && !analysis.decision_ready) {
    pills.push({
      status: 'Ranking Complete',
      color: 'purple',
    });
  }

  // Decision state
  if (analysis.decision_ready) {
    pills.push({
      status: 'Decision Ready',
      color: 'purple',
    });
  }

  return pills;
}

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = await api.getCaseAnalysis(id);
  const sourcingCase = analysis.case;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl w-full flex-1 flex flex-col space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <Link href="/cases" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Cases Directory
          </Link>
          <span>/</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">
            CASE #{sourcingCase.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {sourcingCase.name}
            </h1>
            {sourcingCase.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
                {sourcingCase.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {getStatusPills(analysis).map((pill) => (
              <span key={pill.status} className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                pill.color === 'emerald' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : pill.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : pill.color === 'purple' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  pill.color === 'emerald' ? 'bg-emerald-500'
                  : pill.color === 'indigo' ? 'bg-indigo-500'
                  : pill.color === 'purple' ? 'bg-purple-500'
                  : 'bg-gray-400'
                }`}></span>
                {pill.status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Warnings Alert */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 text-sm">
            ⚠ Human Review Required
          </h3>

          <div className="mt-4 space-y-3">
            {analysis.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-lg">👁</span>
                <div className="flex-1">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {warning}
                  </p>
                  <Link
                    href={`/cases/${id}/documents`}
                    className="text-xs text-amber-700 dark:text-amber-300 hover:underline font-semibold mt-1 inline-block"
                  >
                    Review Evidence →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Sub-Navigation */}
      <CaseTabs caseId={id} />

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

