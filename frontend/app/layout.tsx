import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SourceSure | Deterministic Procurement Evaluation & Evidence Traceability",
  description: "AI-powered supplier shortlisting and audit-ready evidence extraction.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">

      <body className="min-h-full flex flex-col transition-colors duration-200">
        <header className="sticky top-0 z-40 w-full glass-nav">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  SourceSure
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md">
                  v1.0
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/" className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/cases" className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Cases Directory
              </Link>
              <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">System Ready</span>
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 py-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold text-slate-700 dark:text-slate-300">SourceSure Screening Engine</span>
              <span>•</span>
              <span>Audit-Ready Evidence Verification</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Deterministic rule engine is the sole source of truth.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}



