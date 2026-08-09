# SourceSure Frontend: Code Patterns & Quick Refactors

This document has **copy-paste ready** code for common patterns used in the master plan implementation.

---

## 1. Status Badge Component

Use everywhere statuses appear (PASS/FAIL/REVIEW/PENDING).

```typescript
// frontend/components/ui/StatusBadge.tsx

interface StatusBadgeProps {
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'PENDING';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const baseColors = {
    PASS: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    FAIL: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    REVIEW: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    PENDING: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs font-bold',
    md: 'px-3 py-1.5 text-xs font-bold uppercase',
    lg: 'px-4 py-2 text-sm font-bold uppercase',
  };

  return (
    <span className={`rounded-full ${baseColors[status]} ${sizes[size]} ${className}`}>
      {status}
    </span>
  );
}
```

**Usage:**
```typescript
<StatusBadge status="PASS" />
<StatusBadge status="FAIL" size="lg" />
```

---

## 2. Summary Card Component

Reusable for all metric cards (Overview tab).

```typescript
// frontend/components/ui/SummaryCard.tsx

interface SummaryCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'gray' | 'emerald' | 'indigo' | 'amber';
  icon?: React.ReactNode;
}

export function SummaryCard({
  label,
  value,
  subtitle,
  color = 'gray',
  icon,
}: SummaryCardProps) {
  const labelColors = {
    gray: 'text-gray-500',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-xs font-bold uppercase tracking-wider ${labelColors[color]}`}>
            {label}
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white mt-2">
            {value}
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
```

**Usage:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <SummaryCard label="Suppliers" value={4} subtitle="2 PASS · 1 FAIL · 1 REVIEW" />
  <SummaryCard label="Requirements" value={4} color="indigo" subtitle="2 Mandatory · 2 Preference" />
  <SummaryCard label="Eligible" value={2} color="emerald" subtitle="PASS suppliers only" />
  <SummaryCard label="Attention" value={analysis.warnings?.length || 0} color="amber" subtitle="Suppliers need review" />
</div>
```

---

## 3. Table with Expandable Rows

For Eligibility Matrix and other tables.

```typescript
// frontend/components/ui/ExpandableTable.tsx

interface ExpandableTableProps<T> {
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  rows: T[];
  keyExtractor: (row: T) => string;
  expandedRenderer?: (row: T) => React.ReactNode;
}

export function ExpandableTable<T>({
  columns,
  rows,
  keyExtractor,
  expandedRenderer,
}: ExpandableTableProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = keyExtractor(row);
            const isExpanded = expandedId === rowId;

            return (
              <React.Fragment key={rowId}>
                <tr
                  className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : rowId)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-gray-900 dark:text-white">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
                {isExpanded && expandedRenderer && (
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <td colSpan={columns.length} className="px-6 py-6">
                      {expandedRenderer(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Usage:**
```typescript
<ExpandableTable
  columns={[
    { key: 'name', label: 'Supplier' },
    { key: 'iso_status', label: 'ISO 9001', render: (row) => <StatusBadge status={row.iso_status} /> },
    { key: 'lead_time_status', label: 'Lead Time', render: (row) => <StatusBadge status={row.lead_time_status} /> },
    { key: 'overall_status', label: 'Overall', render: (row) => <StatusBadge status={row.overall_status} size="lg" /> },
  ]}
  rows={suppliers}
  keyExtractor={(row) => row.id}
  expandedRenderer={(supplier) => (
    <div className="space-y-4">
      <RequirementDetail supplier={supplier} />
    </div>
  )}
/>
```

---

## 4. Drawer Component

Side panel for details/modals.

```typescript
// frontend/components/ui/Drawer.tsx

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: DrawerProps) {
  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ml-auto w-full ${widths[size]} h-screen bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Usage:**
```typescript
<Drawer
  isOpen={isOpen}
  onClose={onClose}
  title="Evidence Trace"
  size="md"
>
  <EvidenceDetails evidence={selectedEvidence} />
</Drawer>
```

---

## 5. Refactor: CaseTabs (Remove Phase Labels)

**Before:**
```typescript
{ name: "Overview & Suppliers", href: `/cases/${caseId}`, phase: "0/1" },
{ name: "Requirements Schema", href: `/cases/${caseId}/requirements`, phase: "1" },
...
{isFuture && <span className="...">P{tab.phase}</span>}
```

**After:**
```typescript
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
                ${
                  isActive
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
```

---

## 6. Refactor: Case Header Status

**Before:**
```typescript
<span className="...">
  Eligibility: {analysis.eligibility_ready ? 'Ready' : 'Pending Uploads'}
</span>
<span className="...">
  Ranking: {analysis.ranking_ready ? 'Unlocked (Phase 4)' : 'Gated (Phase 3)'}
</span>
```

**After:**
```typescript
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

// In JSX:
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
```

---

## 7. Attention Banner Improvements

**Before:**
```typescript
{analysis.warnings && analysis.warnings.length > 0 && (
  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900">
    <div className="font-bold flex items-center gap-2">
      Pipeline Attention Items ({analysis.warnings.length}):
    </div>
    <ul className="list-disc list-inside pl-5 space-y-0.5">
      {analysis.warnings.map((w, idx) => (
        <li key={idx}>{w}</li>
      ))}
    </ul>
  </div>
)}
```

**After:**
```typescript
interface AttentionWarning {
  id: string;
  type: 'CONFLICT' | 'REVIEW' | 'MISSING_DOCS';
  supplier_id: string;
  supplier_name: string;
  criterion?: string;
  message: string;
  action_href?: string;
}

export function AttentionBanner({ warnings }: { warnings: AttentionWarning[] }) {
  if (!warnings || warnings.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONFLICT':
        return '⚔';
      case 'REVIEW':
        return '👁';
      default:
        return '⚠';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
      <h3 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 text-sm">
        ⚠ Human Review Required
      </h3>

      <div className="mt-4 space-y-3">
        {warnings.map((warning) => (
          <div key={warning.id} className="flex items-start gap-3">
            <span className="text-lg">{getIcon(warning.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>{warning.supplier_name}</strong> has {warning.type === 'CONFLICT' ? 'conflicting evidence' : 'missing documents'} for{' '}
                <strong>{warning.criterion || 'a requirement'}</strong>.
              </p>
              {warning.action_href && (
                <a
                  href={warning.action_href}
                  className="text-xs text-amber-700 dark:text-amber-300 hover:underline font-semibold mt-1 inline-block"
                >
                  Review Evidence →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Supplier Row Improvements

**Before:**
```typescript
<div className="text-xs text-gray-500 flex items-center gap-3 font-mono">
  <span>Ref: {s.external_ref || "SUP-REF-N/A"}</span>
  <span>•</span>
  <span>Country: {s.country || "N/A"}</span>
  <span>•</span>
  <span>Docs: {s.document_count ?? 0}</span>
</div>
```

**After (Needs eligibility data):**
```typescript
interface SupplierRowProps {
  supplier: Supplier;
  eligibility: EligibilityResult;
  onUploadClick: () => void;
  onViewEvidenceClick: () => void;
}

export function SupplierRow({
  supplier,
  eligibility,
  onUploadClick,
  onViewEvidenceClick,
}: SupplierRowProps) {
  return (
    <div className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {supplier.name}
          </h3>
          <StatusBadge status={eligibility.overall_status} />
        </div>

        {/* Location & Docs */}
        <div className="text-xs text-gray-500 font-mono">
          {supplier.country} · {supplier.document_count || 0} documents
        </div>

        {/* Reason for status */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {eligibility.reason || getStatusExplanation(eligibility)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onUploadClick}
          className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Documents
        </button>

        {eligibility.overall_status === 'REVIEW' ? (
          <button
            onClick={onViewEvidenceClick}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Conflict
          </button>
        ) : (
          <button
            onClick={onViewEvidenceClick}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Evidence
          </button>
        )}
      </div>
    </div>
  );
}

function getStatusExplanation(eligibility: EligibilityResult): string {
  if (eligibility.overall_status === 'PASS') {
    return 'All mandatory requirements satisfied';
  } else if (eligibility.overall_status === 'FAIL') {
    const failedRequirement = eligibility.results.find(r => r.status === 'FAIL');
    return failedRequirement?.reason || 'Does not meet mandatory requirements';
  } else if (eligibility.overall_status === 'REVIEW') {
    return 'Conflicting evidence detected';
  }
  return '';
}
```

---

## 9. Loading State Pattern

```typescript
// frontend/components/ui/LoadingState.tsx

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots';
}

export function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex gap-1">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{message}</p>
      </div>
    );
  }

  // Default spinner
  return (
    <div className="text-center py-8">
      <div className="inline-flex">
        <div className="w-6 h-6 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <p className="text-xs text-gray-500 mt-3">{message}</p>
    </div>
  );
}
```

---

## 10. Empty State Pattern

```typescript
// frontend/components/ui/EmptyState.tsx

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {icon && <div className="mb-4 text-4xl opacity-30">{icon}</div>}
      {title && <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{title}</h3>}
      <p className="text-xs text-gray-500 mb-4 max-w-xs">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**Usage:**
```typescript
{requirements.length === 0 ? (
  <EmptyState
    icon="📋"
    title="No requirements yet"
    message="Define mandatory and preference criteria to begin supplier evaluation."
    action={{
      label: '+ Add Requirement',
      onClick: () => setShowModal(true),
    }}
  />
) : (
  <RequirementsList requirements={requirements} />
)}
```

---

## 11. API Error Handling Pattern

```typescript
// frontend/lib/api/errors.ts

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    // Friendly messages for common errors
    if (error.code === 'ELIGIBILITY_NOT_READY') {
      return 'Run eligibility evaluation before ranking suppliers.';
    }
    if (error.code === 'INVALID_WEIGHTS') {
      return 'Preference weights must total 100%.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

// In components:
try {
  const results = await api.calculateRanking(caseId, weights);
} catch (error) {
  setErrorMessage(getErrorMessage(error));
}
```

---

## 12. Quick Refactor Checklist

- [ ] Remove all "P0", "P1", "Phase X" text from UI
- [ ] Replace phase labels with status-based descriptions
- [ ] Refactor case header to use getStatusPills() function
- [ ] Extract StatusBadge to shared component
- [ ] Improve supplier rows to show eligibility reasons
- [ ] Create LoadingState component
- [ ] Create EmptyState component
- [ ] Create ErrorState component
- [ ] Add Drawer component (for Evidence, Decision details)
- [ ] Add SummaryCard component (for Overview metrics)
- [ ] Update Attention Banner to show actionable warnings
- [ ] Update AttentionBanner to link to relevant tab/supplier

---

## 13. Props Convention

Keep props consistent across components:

```typescript
// ✅ Good
interface SupplierCardProps {
  supplier: Supplier;
  eligibility: EligibilityResult;
  onUploadClick: () => void;
  onViewEvidenceClick: () => void;
}

// ❌ Avoid
interface SupplierCardProps {
  sup: Supplier;
  el?: EligibilityResult;
  upload?: () => void;
  showEvidence?: () => void;
}

// ✅ Handle loading/error at page level
export default function CasePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return <CaseContent />;
}
```

---

## 14. Hook for Fetching with Loading

```typescript
// frontend/lib/hooks/useFetch.ts

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList,
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, isLoading, error, refetch };
}
```

**Usage:**
```typescript
const { data: suppliers, isLoading, error } = useFetch(
  () => api.getSuppliers(caseId),
  [caseId],
);

if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error.message} />;

return <SupplierList suppliers={suppliers!} />;
```

---

This document is a **working copy**. Update it as you refactor and discover new patterns.
