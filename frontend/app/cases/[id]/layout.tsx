import { CaseTabs } from "@/components/CaseTabs";
import { api } from "@/lib/api/client";
import Link from "next/link";

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
            {/* Case status badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              sourcingCase.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
            }`}>
              {sourcingCase.status}
            </span>

            {/* Eligibility readiness pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              analysis.eligibility_ready
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${analysis.eligibility_ready ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
              Eligibility: {analysis.eligibility_ready ? 'Ready' : 'Pending Uploads'}
            </span>

            {/* Ranking readiness pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              analysis.ranking_ready
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${analysis.ranking_ready ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
              Ranking: {analysis.ranking_ready ? 'Unlocked (Phase 4)' : 'Gated (Phase 3)'}
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Warnings Alert */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Pipeline Attention Items ({analysis.warnings.length}):
          </div>
          <ul className="list-disc list-inside pl-5 space-y-0.5">
            {analysis.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
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

