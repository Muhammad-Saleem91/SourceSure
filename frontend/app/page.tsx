import Link from "next/link";
import { api } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cases = await api.getCases();

  return (
    <div className="flex-1 flex flex-col space-y-10 py-2">
      {/* Hero Banner */}
      <div className="max-w-3xl space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Audit-Ready Manufacturing Decision Engine
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Deterministic Sourcing & Verifiable Evidence Traceability
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          SourceSure connects engineering requirements to supplier documents with 100% citation coverage. Evaluated deterministically by server-side rule engines.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/cases/00000000-0000-0000-0000-000000000001`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
          >
            Explore Demo Case &rarr;
          </Link>
          <Link
            href="/cases/new"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-5 py-2.5 rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            + New Case
          </Link>
        </div>
      </div>

      {/* Highlights & Pipeline Readiness Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card-hover p-5 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Workspaces</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{cases.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Sourcing cases configured</div>
          </div>
        </div>

        <div className="glass-card-hover p-5 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requirements</span>
            <span className="badge-pass px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Mandatory vs Preference</div>
            <div className="text-xs text-slate-500 mt-0.5">Operators & weight limits</div>
          </div>
        </div>

        <div className="glass-card-hover p-5 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligibility</span>
            <span className="badge-pass px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">PASS-Only Gating</div>
            <div className="text-xs text-slate-500 mt-0.5">FAIL/REVIEW excluded</div>
          </div>
        </div>

        <div className="glass-card-hover p-5 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Decision Audit</span>
            <span className="badge-pass px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Human Award Signoff</div>
            <div className="text-xs text-slate-500 mt-0.5">CSV export & audit log</div>
          </div>
        </div>
      </div>

      {/* Sourcing Cases Section Header */}
      <div className="space-y-5 pt-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Active Sourcing Workspaces</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage rules, documents, and candidate shortlists.</p>
          </div>
          <Link
            href="/cases/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            + New Case
          </Link>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cases.map((c) => (
            <Link href={`/cases/${c.id}`} key={c.id} className="group">
              <div className="glass-card-hover rounded-2xl p-5 border cursor-pointer h-full flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.status === 'ACTIVE'
                        ? 'badge-pass'
                        : 'badge-pending'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {c.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-400">Date: {c.evaluation_date || "N/A"}</span>
                  <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    Open &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
