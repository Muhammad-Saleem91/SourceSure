import Link from "next/link";
import { api } from "@/lib/api/client";

export default async function CasesPage() {
  const cases = await api.getCases();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Sourcing Cases Directory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage procurement evaluation cases, configure rules, and verify evidence.
          </p>
        </div>
        <Link 
          href="/cases/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Create New Case
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((c) => (
          <Link href={`/cases/${c.id}`} key={c.id} className="group">
            <div className="glass-card rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {c.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    c.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : c.status === 'COMPLETED'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed">
                  {c.description || "No description specified for this case."}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {c.evaluation_date || "N/A"}
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View Workspace &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

