# SourceSure Frontend Implementation Roadmap
## Master Plan → Execution Guide

Your current UI is **70-80% of the visual foundation**. This document maps the master plan into concrete sprints and component work.

---

## PHASE 0: Quick Wins (Immediate Impact, 2-3 hours)

### 1. Remove Phase Labels from CaseTabs

**File:** `frontend/components/CaseTabs.tsx`

Current:
```typescript
{ name: "Overview & Suppliers", href: `/cases/${caseId}`, phase: "0/1" },
```

Replace with **business concepts**:
```typescript
const tabs = [
  { name: "Overview", href: `/cases/${caseId}` },
  { name: "Requirements", href: `/cases/${caseId}/requirements` },
  { name: "Documents & Evidence", href: `/cases/${caseId}/documents` },
  { name: "Eligibility", href: `/cases/${caseId}/eligibility` },
  { name: "Ranking", href: `/cases/${caseId}/ranking` },
  { name: "Sensitivity", href: `/cases/${caseId}/sensitivity` },
  { name: "Decision", href: `/cases/${caseId}/decision` },
];
```

Remove all phase badges. Render as plain tabs.

### 2. Update Case Header Status Labels

**File:** `frontend/app/cases/[id]/layout.tsx` (lines 43-71)

Current logic shows:
```
ACTIVE
Eligibility: Ready
Ranking: Gated (Phase 3)
```

Change to **business states**:

```typescript
// Before evidence extraction:
- ACTIVE
- Evidence Pending

// After evidence extraction:
- ACTIVE
- Evidence Ready
- Eligibility Ready

// After eligibility evaluation:
- ACTIVE
- Eligibility Complete
- Ranking Ready

// After ranking:
- ACTIVE
- Eligibility Complete
- Ranking Complete

// After decision readiness:
- ACTIVE
- Decision Ready
```

Logic should check case analysis fields (eligibility_ready, ranking_ready, etc.) and render appropriate status pills.

### 3. Improve Attention Banner

**File:** `frontend/app/cases/[id]/layout.tsx` (lines 76-90)

Current:
```
Pipeline Attention Items (1)
Supplier Vanguard Aerospace Parts requires human review...
```

Change to actionable:
```
⚠ Human Review Required

Vanguard Aerospace Parts has conflicting evidence
for ISO 9001 certification.

[Review Evidence]
```

Each warning should be specific about:
- Which supplier
- Which requirement
- Why it needs review

Add an action button that links to the Evidence tab with that specific supplier pre-selected.

### 4. Improve Supplier Row Information

**File:** `frontend/app/cases/[id]/page.tsx` (lines 146-199)

Current:
```
Apex Precision Machining Ltd.   PASS

Ref: SUP-APX-01
Country: Germany
Docs: 3
```

Evolve to:
```
Apex Precision Machining Ltd.                    PASS

Germany · 3 documents
All mandatory requirements satisfied

[Upload Documents] [View Evidence]
```

For FAIL:
```
Global Alloy Components Co.                      FAIL

China · 2 documents
Lead time 45 days exceeds required maximum of 30

[Upload Documents] [View Evidence]
```

For REVIEW:
```
Vanguard Aerospace Parts                         REVIEW

United States · 4 documents
Conflicting ISO 9001 evidence requires human review

[Upload Documents] [Review Conflict]
```

This requires fetching eligibility status for each supplier and showing the **reason** for the status in plain English.

**API Integration:**
- `GET /cases/{caseId}/eligibility` → returns supplier eligibility with reasons
- Map those reasons to human-readable explanations

---

## PHASE 1: Summary Cards (1-2 hours)

**File:** `frontend/app/cases/[id]/page.tsx` (lines 89-112)

Current three cards are good. Evolve to **four cards** as shown in the master plan:

```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* SUPPLIERS */}
  <div className="glass-card p-6 rounded-2xl">
    <div className="text-xs font-bold text-gray-500 uppercase">Suppliers</div>
    <div className="text-4xl font-black text-gray-900 mt-2">{suppliers.length}</div>
    <div className="text-xs text-gray-500 mt-2">
      {passCount} PASS · {failCount} FAIL · {reviewCount} REVIEW
    </div>
  </div>

  {/* REQUIREMENTS */}
  <div className="glass-card p-6 rounded-2xl">
    <div className="text-xs font-bold text-gray-500 uppercase">Requirements</div>
    <div className="text-4xl font-black text-gray-900 mt-2">{requirements.length}</div>
    <div className="text-xs text-gray-500 mt-2">
      {mandatoryCount} Mandatory · {preferenceCount} Preferences
    </div>
  </div>

  {/* ELIGIBLE FOR RANKING */}
  <div className="glass-card p-6 rounded-2xl">
    <div className="text-xs font-bold text-indigo-600 uppercase">Eligible for Ranking</div>
    <div className="text-4xl font-black text-indigo-600 mt-2">{passCount}</div>
    <div className="text-xs text-indigo-600 mt-2">PASS suppliers only</div>
  </div>

  {/* ATTENTION REQUIRED */}
  {analysis.warnings?.length > 0 && (
    <div className="glass-card p-6 rounded-2xl bg-amber-50/50">
      <div className="text-xs font-bold text-amber-600 uppercase">Attention Required</div>
      <div className="text-4xl font-black text-amber-600 mt-2">{analysis.warnings.length}</div>
      <div className="text-xs text-amber-600 mt-2">
        {analysis.warnings.length === 1 ? 'Supplier requires review' : 'Suppliers require review'}
      </div>
    </div>
  )}
</div>
```

On narrow screens, collapse to 3 cards (put Attention in the banner instead).

---

## PHASE 2: Eligibility Matrix (Priority 2, ~2 hours)

**File:** Create new component `frontend/components/eligibility/EligibilityMatrix.tsx`

This is one of your **strongest demo screens**. Make it shine.

### EligibilityMatrix Component

```typescript
interface EligibilityMatrixProps {
  suppliers: Supplier[];
  eligibilityData: EligibilityResult[];
  requirements: Requirement[];
}

const EligibilityMatrix = ({ suppliers, eligibilityData, requirements }: EligibilityMatrixProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Eligibility Matrix</h2>
        <p className="text-sm text-gray-500 mt-1">
          Mandatory requirements are evaluated using deterministic rules.
          Only PASS suppliers may proceed to ranking.
        </p>
      </div>

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
                  {req.name}
                </th>
              ))}
              <th className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => {
              const supplierEligibility = eligibilityData.find(e => e.supplier_id === supplier.id);
              return (
                <tr key={supplier.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {supplier.name}
                  </td>
                  {requirements.map((req) => {
                    const result = supplierEligibility?.results.find(r => r.requirement_id === req.id);
                    return (
                      <td key={req.id} className="px-6 py-4">
                        <StatusBadge status={result?.status || 'PENDING'} clickable onClick={() => handleExpandRow(supplier, req)} />
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 font-bold">
                    <StatusBadge status={supplierEligibility?.overall_status || 'PENDING'} size="large" />
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
              {analysis.passCount} suppliers eligible for ranking
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
              {analysis.failCount} supplier excluded
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {analysis.reviewCount} supplier requires review
            </div>
          </div>
        </div>
        <button className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">
          Continue to Ranking
        </button>
      </div>
    </div>
  );
};
```

### StatusBadge Component

```typescript
const StatusBadge = ({ status, size = 'default' }: { status: 'PASS' | 'FAIL' | 'REVIEW' | 'PENDING'; size?: 'default' | 'large' }) => {
  const colors = {
    PASS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    FAIL: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase ${colors[status]} ${size === 'large' ? 'text-sm px-4 py-2' : ''}`}>
      {status}
    </span>
  );
};
```

### Eligibility Detail Drawer

When clicking a requirement result, show:

```typescript
interface EligibilityDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  requirement: Requirement;
  result: EligibilityResult;
}

const EligibilityDetailDrawer = ({ isOpen, onClose, supplier, requirement, result }: EligibilityDetailDrawerProps) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="right">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{requirement.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{supplier.name}</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Requirement</label>
          <p className="text-sm font-mono text-gray-900 mt-1">
            {requirement.operator} {requirement.value} {requirement.unit}
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Observed</label>
          <p className="text-sm font-mono text-gray-900 mt-1">{result.observed_value}</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Evaluation</label>
          <StatusBadge status={result.status} size="large" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
          <p className="text-sm text-gray-700 mt-1">{result.reason}</p>
        </div>

        {result.status === 'REVIEW' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Conflicting Evidence</label>
            <button className="mt-2 w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold">
              Review Sources
            </button>
          </div>
        )}

        {result.evidence_ids?.length > 0 && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Evidence</label>
            <div className="mt-2 space-y-2">
              {result.evidence_ids.map((id) => (
                <div key={id} className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                  Evidence #{id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
```

**API Integration:**
- `GET /cases/{caseId}/eligibility` → full eligibility matrix with per-requirement results
- `GET /cases/{caseId}/evidence?supplier_id={id}` → evidence for review

---

## PHASE 3: Evidence Drawer Enhancement (Priority 3, ~1.5 hours)

**File:** `frontend/components/evidence/EvidenceDrawer.tsx`

Enhance to show the **evidence trace hierarchy**:

```
Fact
↓
Quote
↓
Location
↓
Document
```

### Enhanced EvidenceDrawer

```typescript
interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  evidenceList: Evidence[];
  conflictingEvidence?: Evidence[];
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  title,
  evidenceList,
  conflictingEvidence,
}: EvidenceDrawerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-screen bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Conflict indicator */}
          {conflictingEvidence && conflictingEvidence.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Conflicting Evidence Detected
              </div>
            </div>
          )}

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 gap-4">
            {evidenceList.map((evidence) => (
              <div
                key={evidence.id}
                onClick={() => setSelectedEvidence(evidence)}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{evidence.criterion}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{evidence.requirement_id}</p>
                  </div>
                  <StatusBadge status={evidence.status} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{evidence.extracted_value}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel (if selected) */}
        {selectedEvidence && (
          <div className="border-l border-gray-200 dark:border-gray-800 w-1/2 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Criterion</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedEvidence.criterion}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Extracted Value</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
                  {selectedEvidence.extracted_value}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <StatusBadge status={selectedEvidence.status} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Exact Supporting Quote</label>
                <blockquote className="text-sm text-gray-700 dark:text-gray-300 border-l-4 border-indigo-500 pl-3 py-1 mt-2 italic">
                  "{selectedEvidence.quote}"
                </blockquote>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Source</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedEvidence.document_name}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
                  {selectedEvidence.location}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Verification Method</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedEvidence.verification_method}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Confidence</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedEvidence.confidence}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Conflict Evidence Drawer

Create a separate component for showing conflicting evidence side-by-side:

**File:** `frontend/components/evidence/ConflictEvidenceDrawer.tsx`

```typescript
export function ConflictEvidenceDrawer({
  isOpen,
  onClose,
  criterion,
  evidence1,
  evidence2,
}: ConflictEvidenceDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900">Conflicting Evidence</h2>
        <p className="text-sm text-gray-500 mt-1">{criterion}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Source 1 */}
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              {evidence1.document_name}
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-600 dark:text-gray-400">Value</label>
                <p className="text-gray-900 dark:text-white font-mono mt-1">{evidence1.extracted_value}</p>
              </div>
              <div>
                <label className="font-bold text-gray-600 dark:text-gray-400">Quote</label>
                <blockquote className="italic text-gray-700 dark:text-gray-300 border-l-2 border-red-500 pl-2 mt-1">
                  "{evidence1.quote}"
                </blockquote>
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex items-center justify-center">
            <div className="font-bold text-gray-500 text-lg">VS</div>
          </div>

          {/* Source 2 */}
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              {evidence2.document_name}
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-600 dark:text-gray-400">Value</label>
                <p className="text-gray-900 dark:text-white font-mono mt-1">{evidence2.extracted_value}</p>
              </div>
              <div>
                <label className="font-bold text-gray-600 dark:text-gray-400">Quote</label>
                <blockquote className="italic text-gray-700 dark:text-gray-300 border-l-2 border-red-500 pl-2 mt-1">
                  "{evidence2.quote}"
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">STATUS</p>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mt-2">
            CONFLICTING EVIDENCE
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
            Human review required before this supplier can proceed to ranking.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
```

---

## PHASE 4: Ranking Integration (Priority 4, ~3 hours)

**File:** Enhance `frontend/app/cases/[id]/ranking/page.tsx`

### Component Structure

```typescript
export default function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scenarios, setScenarios] = useState<RankingScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [rankingResults, setRankingResults] = useState<RankingResult[] | null>(null);
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);

  // Load ranking data
  useEffect(() => {
    loadRankingData();
  }, [id]);

  const loadRankingData = async () => {
    const results = await api.getRankingScenarios(id);
    setScenarios(results);
    if (results.length > 0) {
      setSelectedScenario(results[0].id);
    }
  };

  const handleCreateScenario = async (weights: Record<string, number>) => {
    await api.createRankingScenario(id, weights);
    setShowNewScenarioModal(false);
    loadRankingData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supplier Ranking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare eligible suppliers using preference criteria and transparent weighted scoring.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex items-center gap-4">
        <select
          value={selectedScenario || ''}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              Scenario: {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowNewScenarioModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + New Scenario
        </button>
      </div>

      {/* Scenario Configuration */}
      {selectedScenario && scenarios.find(s => s.id === selectedScenario) && (
        <ScenarioConfiguration scenario={scenarios.find(s => s.id === selectedScenario)!} />
      )}

      {/* Ranking Results */}
      {selectedScenario && (
        <RankingResults
          scenario={scenarios.find(s => s.id === selectedScenario)!}
          caseId={id}
        />
      )}

      {/* Modal for New Scenario */}
      {showNewScenarioModal && (
        <NewScenarioModal
          requirements={requirements}
          onCreate={handleCreateScenario}
          onCancel={() => setShowNewScenarioModal(false)}
        />
      )}
    </div>
  );
}
```

### ScenarioConfiguration Component

```typescript
interface ScenarioConfigurationProps {
  scenario: RankingScenario;
}

function ScenarioConfiguration({ scenario }: ScenarioConfigurationProps) {
  const [weights, setWeights] = useState(scenario.weights);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleWeightChange = (criterion: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [criterion]: value,
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Business Priorities</h3>

      <div className="space-y-6">
        {Object.entries(weights).map(([criterion, weight]) => (
          <div key={criterion}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-gray-900 dark:text-white">{criterion}</label>
              <span className="text-sm font-bold text-indigo-600">{weight}%</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={weight}
                onChange={(e) => handleWeightChange(criterion, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={weight}
                onChange={(e) => handleWeightChange(criterion, parseInt(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            {/* Visual bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${weight}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">Total Weight</span>
          <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalWeight}%
          </span>
        </div>
        {totalWeight !== 100 && (
          <p className="text-xs text-red-600 mt-2">
            Weights must total 100%
          </p>
        )}
      </div>
    </div>
  );
}
```

### RankingResults Component

```typescript
interface RankingResultsProps {
  scenario: RankingScenario;
  caseId: string;
}

function RankingResults({ scenario, caseId }: RankingResultsProps) {
  const [results, setResults] = useState<RankedSupplier[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [scenario.id]);

  const loadResults = async () => {
    const data = await api.getRankingResults(caseId, scenario.id);
    setResults(data);
  };

  if (!results) return <div>Loading ranking...</div>;

  const passingSuppliers = results.filter(r => r.eligibility_status === 'PASS');
  const failedSuppliers = results.filter(r => r.eligibility_status === 'FAIL');
  const reviewSuppliers = results.filter(r => r.eligibility_status === 'REVIEW');

  return (
    <div className="space-y-6">
      {/* Ranked List */}
      <div className="space-y-4">
        {passingSuppliers.map((result, index) => (
          <div
            key={result.supplier_id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  #{index + 1} {result.supplier_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Strongest advantage: {result.dominant_criterion}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-indigo-600">{result.score.toFixed(1)}</div>
                <StatusBadge status="PASS" />
              </div>
            </div>

            {/* Score Breakdown Button */}
            <button
              onClick={() => setExpandedId(expandedId === result.supplier_id ? null : result.supplier_id)}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              {expandedId === result.supplier_id ? '▼' : '▶'} View Score Breakdown
            </button>

            {/* Expanded Score Breakdown */}
            {expandedId === result.supplier_id && (
              <ScoreBreakdown
                result={result}
                scenario={scenario}
                caseId={caseId}
              />
            )}
          </div>
        ))}
      </div>

      {/* Excluded Section */}
      {(failedSuppliers.length > 0 || reviewSuppliers.length > 0) && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Excluded from Ranking</h3>
          <div className="space-y-3">
            {failedSuppliers.map((result) => (
              <div key={result.supplier_id} className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-semibold">{result.supplier_name}</span>
                <span className="text-xs font-bold text-red-600 uppercase">FAIL</span>
              </div>
            ))}
            {reviewSuppliers.map((result) => (
              <div key={result.supplier_id} className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-semibold">{result.supplier_name}</span>
                <span className="text-xs font-bold text-amber-600 uppercase">REVIEW</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### ScoreBreakdown Component

```typescript
interface ScoreBreakdownProps {
  result: RankedSupplier;
  scenario: RankingScenario;
  caseId: string;
}

function ScoreBreakdown({ result, scenario, caseId }: ScoreBreakdownProps) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-6">
      {result.criterion_scores.map((cs) => (
        <div key={cs.criterion} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
            {cs.criterion}
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-gray-500">Raw Value</label>
              <p className="text-gray-900 dark:text-white font-mono font-bold mt-1">
                {cs.raw_value}
              </p>
            </div>

            <div>
              <label className="text-gray-500">Relative Score</label>
              <p className="text-gray-900 dark:text-white font-mono font-bold mt-1">
                {cs.normalized_score} / 100
              </p>
            </div>

            <div>
              <label className="text-gray-500">Weight</label>
              <p className="text-gray-900 dark:text-white font-mono font-bold mt-1">
                {scenario.weights[cs.criterion]}%
              </p>
            </div>

            <div>
              <label className="text-gray-500">Contribution</label>
              <p className="text-gray-900 dark:text-white font-mono font-bold mt-1">
                {cs.contribution.toFixed(1)} points
              </p>
            </div>
          </div>

          {/* Explanation tooltip */}
          <div className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded text-indigo-700 dark:text-indigo-300 text-xs">
            <strong>Relative Score:</strong> Converts different supplier metrics onto a common 0–100 scale using Min-Max normalization.
          </div>

          <button className="mt-3 text-indigo-600 hover:text-indigo-700 text-xs font-semibold">
            View Evidence
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## PHASE 5: Sensitivity Analysis (Priority 5, ~2 hours)

**File:** `frontend/app/cases/[id]/sensitivity/page.tsx`

### Sensitivity Comparison View

```typescript
export default function SensitivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scenarios, setScenarios] = useState<RankingScenario[]>([]);
  const [baselineId, setBaselineId] = useState<string>('');
  const [compareToId, setCompareToId] = useState<string>('');

  useEffect(() => {
    loadScenarios();
  }, [id]);

  const loadScenarios = async () => {
    const data = await api.getRankingScenarios(id);
    setScenarios(data);
    if (data.length > 0) setBaselineId(data[0].id);
    if (data.length > 1) setCompareToId(data[1].id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sensitivity Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare how ranking changes when preference weights change.
        </p>
      </div>

      {/* Scenario Selectors */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Baseline Scenario
          </label>
          <select
            value={baselineId}
            onChange={(e) => setBaselineId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Compare To
          </label>
          <select
            value={compareToId}
            onChange={(e) => setCompareToId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {scenarios.filter(s => s.id !== baselineId).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      {baselineId && compareToId && (
        <SensitivityComparison
          caseId={id}
          baselineScenarioId={baselineId}
          compareScenarioId={compareToId}
        />
      )}
    </div>
  );
}
```

### SensitivityComparison Component

```typescript
interface SensitivityComparisonProps {
  caseId: string;
  baselineScenarioId: string;
  compareScenarioId: string;
}

function SensitivityComparison({
  caseId,
  baselineScenarioId,
  compareScenarioId,
}: SensitivityComparisonProps) {
  const [baseline, setBaseline] = useState<RankingResult[] | null>(null);
  const [comparison, setComparison] = useState<RankingResult[] | null>(null);

  useEffect(() => {
    loadComparison();
  }, [baselineScenarioId, compareScenarioId]);

  const loadComparison = async () => {
    const [b, c] = await Promise.all([
      api.getRankingResults(caseId, baselineScenarioId),
      api.getRankingResults(caseId, compareScenarioId),
    ]);
    setBaseline(b);
    setComparison(c);
  };

  if (!baseline || !comparison) return <div>Loading comparison...</div>;

  return (
    <div className="space-y-8">
      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-6">
        <RankingList results={baseline} title="Baseline" />
        <RankingList results={comparison} title="Alternative" />
      </div>

      {/* Impact Summary */}
      <RankingImpactSummary baseline={baseline} comparison={comparison} />

      {/* Bar Chart Comparison */}
      <RankingComparisonChart baseline={baseline} comparison={comparison} />
    </div>
  );
}

function RankingList({ results, title }: { results: RankedSupplier[]; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {results
          .filter(r => r.eligibility_status === 'PASS')
          .map((result, index) => (
            <div key={result.supplier_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-indigo-600">#{index + 1}</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {result.supplier_name}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {result.score.toFixed(0)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function RankingImpactSummary({
  baseline,
  comparison,
}: {
  baseline: RankedSupplier[];
  comparison: RankedSupplier[];
}) {
  // Calculate rank changes
  const changes = baseline.map((b) => {
    const comp = comparison.find(c => c.supplier_id === b.supplier_id);
    const baselineRank = baseline.findIndex(x => x.supplier_id === b.supplier_id) + 1;
    const comparisonRank = comp ? comparison.findIndex(x => x.supplier_id === comp.supplier_id) + 1 : null;
    return {
      supplier_name: b.supplier_name,
      baseline_rank: baselineRank,
      comparison_rank: comparisonRank,
      moved: comparisonRank ? baselineRank - comparisonRank : 0,
    };
  });

  const significantChanges = changes.filter(c => c.moved !== 0);

  if (significantChanges.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl">
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
          ✓ Ranking is stable. Priority weights don't significantly change the outcome.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl">
      <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3">Ranking Impact</h3>
      <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
        {significantChanges.map((change) => (
          <p key={change.supplier_name}>
            {change.supplier_name} moves from #{change.baseline_rank} → #{change.comparison_rank}{' '}
            <span className={change.moved > 0 ? 'text-emerald-600' : 'text-red-600'}>
              {change.moved > 0 ? '↑' : '↓'}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
```

---

## PHASE 6: Requirements Tab (Priority 6, ~1.5 hours)

**File:** `frontend/app/cases/[id]/requirements/page.tsx`

### Requirements Management

```typescript
export default function RequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequirements();
  }, [id]);

  const loadRequirements = async () => {
    const data = await api.getRequirements(id);
    setRequirements(data);
  };

  const handleDelete = async (reqId: string) => {
    await api.deleteRequirement(id, reqId);
    loadRequirements();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define which conditions suppliers must satisfy and which factors should influence ranking.
        </p>
      </div>

      {/* Mandatory Requirements */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Mandatory Requirements</h2>
        <p className="text-xs text-gray-500 mb-4">
          Failure of a mandatory requirement excludes the supplier from ranking.
        </p>

        <div className="space-y-3">
          {requirements
            .filter(r => r.kind === 'MANDATORY')
            .map((req) => (
              <RequirementCard
                key={req.id}
                requirement={req}
                onEdit={() => setEditingId(req.id)}
                onDelete={() => handleDelete(req.id)}
              />
            ))}
        </div>

        {requirements.filter(r => r.kind === 'MANDATORY').length === 0 && (
          <EmptyState text="No mandatory requirements configured yet." />
        )}
      </div>

      {/* Preference Requirements */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
        <p className="text-xs text-gray-500 mb-4">
          Preference requirements affect ranking only after a supplier passes mandatory eligibility.
        </p>

        <div className="space-y-3">
          {requirements
            .filter(r => r.kind === 'PREFERENCE')
            .map((req) => (
              <RequirementCard
                key={req.id}
                requirement={req}
                onEdit={() => setEditingId(req.id)}
                onDelete={() => handleDelete(req.id)}
              />
            ))}
        </div>

        {requirements.filter(r => r.kind === 'PREFERENCE').length === 0 && (
          <EmptyState text="No preference requirements configured yet." />
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        + Add Requirement
      </button>

      {/* Modal */}
      {showModal && (
        <RequirementModal
          caseId={id}
          editingId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
          onSave={loadRequirements}
        />
      )}
    </div>
  );
}

interface RequirementCardProps {
  requirement: Requirement;
  onEdit: () => void;
  onDelete: () => void;
}

function RequirementCard({ requirement, onEdit, onDelete }: RequirementCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-start justify-between">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">{requirement.name}</h3>
        <div className="text-xs text-gray-500 mt-2 font-mono">
          {requirement.kind === 'MANDATORY'
            ? `Must ${requirement.operator} ${requirement.value} ${requirement.unit || ''}`
            : `Direction: ${requirement.direction} is better (${requirement.default_importance}% importance)`}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 text-sm font-semibold"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

---

## PHASE 7: Decision Tab (Priority 7, 2-3 hours)

**File:** `frontend/app/cases/[id]/decision/page.tsx`

This is the **culmination** of the entire workflow. Scaffold now, wire Phase 5 later.

```typescript
export default function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<'recommend' | 'alternative' | 'defer' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [id]);

  const loadDecision = async () => {
    const data = await api.getDecisionSummary(id);
    setDecision(data);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.submitDecision(id, {
        decision: selectedDecision,
        notes,
      });
      alert('Decision recorded');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!decision) return <div>Loading decision data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Decision Summary</h1>
      </div>

      {/* Recommended Supplier */}
      <RecommendationCard
        supplier={decision.recommended_supplier}
        evidence={decision.recommendation_reasons}
      />

      {/* Alternative Suppliers */}
      {decision.alternative_suppliers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Eligible Alternatives</h2>
          {decision.alternative_suppliers.map((alt) => (
            <AlternativeSupplierCard key={alt.id} supplier={alt} />
          ))}
        </div>
      )}

      {/* Exclusions */}
      {(decision.excluded_suppliers.length > 0 || decision.review_suppliers.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Excluded / Requires Attention</h2>
          {decision.excluded_suppliers.map((sup) => (
            <ExcludedSupplierCard key={sup.id} supplier={sup} reason={sup.exclusion_reason} />
          ))}
          {decision.review_suppliers.map((sup) => (
            <ReviewSupplierCard key={sup.id} supplier={sup} reason="Conflicting evidence" />
          ))}
        </div>
      )}

      {/* Sensitivity Note */}
      {decision.sensitivity_note && (
        <SensitivityNote note={decision.sensitivity_note} />
      )}

      {/* Human Decision Controls */}
      <HumanDecisionControls
        selectedDecision={selectedDecision}
        onSelect={setSelectedDecision}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

interface RecommendationCardProps {
  supplier: Supplier;
  evidence: string[];
}

function RecommendationCard({ supplier, evidence }: RecommendationCardProps) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-4">
        RECOMMENDED SUPPLIER
      </h2>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {supplier.name}
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            Rank #1 · Score 60.0
          </p>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
        {evidence.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-lg">✓</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <button className="mt-6 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:underline">
        View Full Evidence Trace
      </button>
    </div>
  );
}

function HumanDecisionControls({
  selectedDecision,
  onSelect,
  notes,
  onNotesChange,
  onSubmit,
  isSubmitting,
}: {
  selectedDecision: string | null;
  onSelect: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-6">
      <h3 className="font-bold text-gray-900 dark:text-white">Human Decision</h3>

      <div className="space-y-3">
        {[
          { id: 'recommend', label: 'Approve recommended supplier' },
          { id: 'alternative', label: 'Select another eligible supplier' },
          { id: 'defer', label: 'Defer decision' },
        ].map((option) => (
          <label key={option.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="decision"
              value={option.id}
              checked={selectedDecision === option.id}
              onChange={(e) => onSelect(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-gray-900 dark:text-white">{option.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          Decision Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Document any special considerations or reasoning..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!selectedDecision || isSubmitting}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Confirm Decision'}
      </button>
    </div>
  );
}
```

---

## Implementation Order (Priority-Based)

### **First Sprint (High Impact, Quick Wins)**
1. ✅ Remove phase labels from tabs (30 min)
2. ✅ Update case header status (30 min)
3. ✅ Improve attention banner (30 min)
4. ✅ Enhance supplier row info (60 min)

**Total: ~2.5 hours**

### **Second Sprint (Core Demo Features)**
5. Summary cards update (90 min)
6. Eligibility Matrix component (120 min)
7. Evidence Drawer enhancement (90 min)

**Total: ~5 hours**

### **Third Sprint (Ranking & Decision)**
8. Ranking tab integration (180 min)
9. Sensitivity analysis tab (120 min)
10. Decision tab scaffold (120 min)

**Total: ~8 hours**

### **Fourth Sprint (Polish)**
11. Requirements tab (90 min)
12. Empty states & error handling (60 min)
13. Loading states & skeleton (60 min)
14. Typography & spacing refinement (60 min)

**Total: ~4.5 hours**

---

## API Integration Checklist

Before starting frontend work, confirm these endpoints are ready:

- [ ] `GET /cases/{caseId}` — case details
- [ ] `GET /cases/{caseId}/suppliers` — supplier list
- [ ] `GET /cases/{caseId}/requirements` — requirement list
- [ ] `GET /cases/{caseId}/eligibility` — eligibility matrix with reasons
- [ ] `GET /cases/{caseId}/evidence` — evidence list per supplier
- [ ] `GET /cases/{caseId}/ranking` — ranking scenarios + results
- [ ] `POST /cases/{caseId}/ranking` — create new ranking scenario
- [ ] `GET /cases/{caseId}/decision` — decision summary (Phase 5)

If any endpoint is missing, frontend can stub with mock data for demo purposes.

---

## Component Library Setup

### Utility Components (Create if missing)

**`frontend/components/ui/Drawer.tsx`**
```typescript
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, side = 'right', children }: DrawerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ml-auto w-full max-w-2xl h-screen bg-white shadow-2xl`}>
        {children}
      </div>
    </div>
  );
}
```

**`frontend/components/ui/Modal.tsx`**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 border-t border-gray-200 dark:border-gray-800">{footer}</div>}
      </div>
    </div>
  );
}
```

---

## Testing & Demo Flow

Once implementation is complete, run through this demo sequence:

```
1. Open Case: "Aluminum Motor Housing"
2. Show Overview tab
   - Summary cards
   - Supplier list with status explanations
3. Click Eligibility tab
   - Show matrix
   - Expand one row to show requirements breakdown
   - Show conflict example
4. Click Evidence & Documents tab
   - Show evidence trace drawer
   - Click conflicting evidence example
5. Click Ranking tab
   - Adjust weights
   - Show ranking results
   - Expand score breakdown
6. Click Sensitivity tab
   - Compare two scenarios
   - Show ranking impact
7. Click Decision tab
   - Show recommendation
   - Show alternatives
   - Show exclusions
8. Select decision (Approve)
   - Submit
9. Show case status: "Decision Complete"
```

This demo shows the complete sourcing workflow in ~6 minutes without any backend magic feeling hidden.

---

## Known Limitations & Future Work

### Not Included in MVP:
- Real-time websocket updates
- Multi-user simultaneous editing
- PDF annotation in-browser
- Advanced charting/graphs
- Dark mode (CSS already supports it)
- Mobile-responsive (currently desktop-first)

### For Post-Hackathon:
- Supplier communication portal
- Bulk import/export
- Audit trail/decision history
- Custom report generation
- Integrations (SAP, Ariba, etc.)

---

## Success Criteria

✅ Your frontend is ready when:

1. No "Phase X" labels visible anywhere
2. Eligibility matrix is interactive and shows reasons
3. Evidence trace is navigable with clear hierarchy
4. Ranking shows normalized scores with explanations
5. Sensitivity shows ranking impact clearly
6. Decision tab is visually distinct and has approval flow
7. All loading states are present
8. Empty states guide user action
9. Error states don't show raw API errors

Your team has 70-80% of the visual foundation. The remaining work is **information architecture, component composition, and backend integration** — not a visual redesign.

**You've got this.** The backend is sophisticated; make the UI impossible to misunderstand.
