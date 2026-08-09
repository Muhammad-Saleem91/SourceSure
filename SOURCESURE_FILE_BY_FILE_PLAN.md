# SourceSure Frontend: File-by-File Action Plan

This is your **step-by-step execution guide**. Check off files as you complete them.

---

## PHASE 0 QUICK WINS — 2.5 hours

### File 1: `components/CaseTabs.tsx` — Remove Phase Labels ✓

**Time: 30 min**

**Changes:**
1. Remove `phase` property from all tab objects
2. Remove all `isFuture`, `phase` conditional logic  
3. Remove badge rendering that shows "P0", "P1", etc.
4. Keep tab names simple and business-focused
5. Remove imports for phase-related logic

**Before & After:**
```typescript
// BEFORE
{ name: "Overview & Suppliers", href: `/cases/${caseId}`, phase: "0/1" },
{ name: "Requirements Schema", href: `/cases/${caseId}/requirements`, phase: "1" },
...
{isFuture ? (
  <span className="...">Future</span>
) : (
  <span className="...">P{tab.phase}</span>
)}

// AFTER
{ name: "Overview", href: `/cases/${caseId}` },
{ name: "Requirements", href: `/cases/${caseId}/requirements` },
...
// No phase badges at all
```

**Testing:**
- [ ] All tabs render without phase badges
- [ ] Tab styling is clean and minimal
- [ ] Active tab highlight still works

---

### File 2: `app/cases/[id]/layout.tsx` — Update Status Pills ✓

**Time: 30 min**

**Changes:**
1. Replace phase-based status text with business states
2. Extract status logic into helper function `getStatusPills()`
3. Update all pill colors and labels
4. Remove references to "Phase 3", "Phase 4", etc.

**Before & After:**
```typescript
// BEFORE
{analysis.eligibility_ready
  ? 'Eligibility: Ready'
  : 'Eligibility: Pending Uploads'}

{analysis.ranking_ready
  ? 'Ranking: Unlocked (Phase 4)'
  : 'Ranking: Gated (Phase 3)'}

// AFTER
// After evidence extraction:
pills = ['Evidence Ready', 'Eligibility Ready']

// After eligibility evaluation:
pills = ['Eligibility Complete', 'Ranking Ready']
```

**Testing:**
- [ ] Case shows "ACTIVE" + appropriate status
- [ ] No "Phase X" text anywhere
- [ ] Status updates when backend state changes

---

### File 3: `app/cases/[id]/layout.tsx` — Improve Attention Banner ✓

**Time: 30 min**

**Changes:**
1. Make banner warnings specific and actionable
2. Add warning type (CONFLICT, REVIEW, MISSING)
3. Link each warning to relevant tab + supplier
4. Show clear CTA: [Review Evidence] or [Upload Documents]
5. Remove generic "Pipeline Attention Items" text

**Before & After:**
```typescript
// BEFORE
Pipeline Attention Items (1)
Supplier Vanguard Aerospace Parts requires human review...

// AFTER
⚠ Human Review Required

Vanguard Aerospace Parts has conflicting evidence for ISO 9001 certification.
[Review Evidence]
```

**Testing:**
- [ ] Warnings are specific (supplier name, requirement)
- [ ] Action buttons link to correct tab
- [ ] Banner only shows when there are actual warnings

---

### File 4: `app/cases/[id]/page.tsx` — Enhance Supplier Rows ✓

**Time: 60 min**

**Changes:**
1. Fetch eligibility results for each supplier
2. Show eligibility status reason in plain text
3. Update metadata line to: "Country · # documents"
4. Update button text: "Review Conflict" (if REVIEW) vs "View Evidence"
5. Link buttons to Evidence drawer

**Before & After:**
```typescript
// BEFORE
Ref: SUP-APX-01
Country: Germany
Docs: 3

// AFTER
Germany · 3 documents
All mandatory requirements satisfied
```

**Key Requirement:**
- Must call `GET /cases/{caseId}/eligibility` to get per-supplier reasons
- Map eligibility.overall_status + eligibility.reason to UI

**Testing:**
- [ ] Supplier rows show eligibility status
- [ ] Reason text is clear and specific
- [ ] PASS suppliers show "All requirements satisfied"
- [ ] FAIL suppliers show specific failure reason
- [ ] REVIEW suppliers show "Conflicting evidence"

---

## PHASE 1 SUMMARY CARDS — 1.5 hours

### File 5: `components/ui/SummaryCard.tsx` — Create Component (NEW) ✓

**Time: 30 min**

**Changes:**
1. Create new reusable component
2. Accept: label, value, subtitle, color, icon
3. Keep styling consistent with existing cards
4. Support color variants: gray, emerald, indigo, amber

**Code Template:**
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
  // See SOURCESURE_CODE_PATTERNS.md for full implementation
}
```

**Testing:**
- [ ] Card renders with all color variants
- [ ] Icon displays in top-right
- [ ] Text hierarchy is clear (label → value → subtitle)

---

### File 6: `app/cases/[id]/page.tsx` — Update Summary Cards ✓

**Time: 60 min**

**Changes:**
1. Import new SummaryCard component
2. Update metric cards to use component (lines 89-112)
3. Add fourth card for "Attention Required" (only if warnings exist)
4. Calculate supplier counts: passCount, failCount, reviewCount
5. Calculate requirement counts: mandatoryCount, preferenceCount

**Before & After:**
```typescript
// BEFORE
3 cards, hardcoded labels

// AFTER
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <SummaryCard label="Suppliers" value={4} ... />
  <SummaryCard label="Requirements" value={4} ... />
  <SummaryCard label="Eligible for Ranking" value={2} ... />
  {analysis.warnings?.length > 0 && (
    <SummaryCard label="Attention Required" value={analysis.warnings.length} ... />
  )}
</div>
```

**Testing:**
- [ ] All four cards render
- [ ] Card values update when suppliers/requirements change
- [ ] Attention card only shows when needed
- [ ] On mobile, cards adjust to 3 columns

---

## PHASE 2 ELIGIBILITY MATRIX — 2-3 hours

### File 7: `components/ui/StatusBadge.tsx` — Create Component (NEW) ✓

**Time: 20 min**

**Use everywhere:** PASS/FAIL/REVIEW/PENDING statuses

**Code Template:** See SOURCESURE_CODE_PATTERNS.md, Pattern #1

**Testing:**
- [ ] Badge renders with correct colors
- [ ] All 4 statuses supported
- [ ] Size variants (sm, md, lg) work

---

### File 8: `components/eligibility/EligibilityMatrix.tsx` — Create Component (NEW) ✓

**Time: 90 min**

**Changes:**
1. Create table with dynamic columns (suppliers × requirements)
2. Fetch eligibility data: `GET /cases/{caseId}/eligibility`
3. Render table rows with StatusBadge for each cell
4. Add "Overall" column showing overall supplier status
5. Add expandable row detail for clicking requirement cells
6. Add summary section at bottom

**Key Features:**
- Table should show: Supplier Name | Req1 | Req2 | ... | Overall
- Each cell is clickable to show breakdown
- Summary shows: "X suppliers eligible, Y excluded, Z review"
- Bottom button: "Continue to Ranking"

**API Response Expected:**
```typescript
interface EligibilityResponse {
  supplier_id: string;
  supplier_name: string;
  overall_status: 'PASS' | 'FAIL' | 'REVIEW';
  results: Array<{
    requirement_id: string;
    requirement_name: string;
    status: 'PASS' | 'FAIL' | 'REVIEW' | 'PENDING';
    reason: string;
    observed_value?: string;
  }>;
}
```

**Testing:**
- [ ] Table renders all suppliers and requirements
- [ ] Status colors are correct
- [ ] Clicking requirement cell shows detail
- [ ] Summary counts are accurate
- [ ] "Continue to Ranking" button only shows if PASS suppliers exist

---

### File 9: `app/cases/[id]/eligibility/page.tsx` — Create Page (NEW) ✓

**Time: 60 min**

**Changes:**
1. Create new page component
2. Fetch eligibility data on mount
3. Handle loading/error states
4. Render EligibilityMatrix component
5. Add optional expandable detail drawer

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { EligibilityMatrix } from "@/components/eligibility/EligibilityMatrix";
import { LoadingState } from "@/components/ui/LoadingState";

export default function EligibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [eligibility, setEligibility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getEligibility(id)
      .then(setEligibility)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <LoadingState />;

  return <EligibilityMatrix data={eligibility} />;
}
```

**Testing:**
- [ ] Page loads eligibility data
- [ ] Matrix renders correctly
- [ ] Loading state shows during fetch

---

## PHASE 3 EVIDENCE & DOCUMENTS — 2-3 hours

### File 10: `components/ui/Drawer.tsx` — Create Component (NEW) ✓

**Time: 30 min**

**Use for:** Evidence details, decision dialogs, requirement details

**Features:**
- Slide-in from right
- Close button + backdrop click to close
- Title + content + optional footer
- Size variants: sm, md, lg
- Dark mode support

**Code Template:** See SOURCESURE_CODE_PATTERNS.md, Pattern #4

**Testing:**
- [ ] Drawer slides in from right
- [ ] Backdrop click closes drawer
- [ ] Title and content render
- [ ] Footer renders if provided

---

### File 11: `components/evidence/EvidenceDrawer.tsx` — Enhance (REFACTOR) ✓

**Time: 90 min**

**Current File:** Already exists, needs refactoring

**Changes:**
1. Show evidence hierarchy: Fact → Quote → Location → Document
2. Add left column: list of evidence items
3. Add right column: detail panel (shows when item selected)
4. Show metadata: verification method, confidence, location
5. For conflicts: show VS layout with both sources

**Layout:**
```
┌─────────────────────────────┐
│ Evidence Trace              │
├──────────────┬──────────────┤
│              │              │
│ Evidence     │ Details      │
│ List         │ (selected)   │
│              │              │
│ ✓ ISO 9001   │ Fact: Yes    │
│ → Supported  │ Quote: "..." │
│              │ Location: p1 │
│ ✓ Lead Time  │ Doc: file.pdf│
│ → Supported  │              │
│              │              │
│ ⚠ Quality    │ ⚠ Conflict   │
│ → Conflict   │   vs Quality │
│              │              │
└──────────────┴──────────────┘
```

**Testing:**
- [ ] Evidence list renders
- [ ] Clicking evidence shows details
- [ ] Quote and location display correctly
- [ ] Conflict view shows side-by-side comparison
- [ ] Drawer closes properly

---

### File 12: `app/cases/[id]/documents/page.tsx` — Create Page (NEW) ✓

**Time: 60 min**

**Changes:**
1. Create new page for Documents & Evidence tab
2. Group documents/evidence by supplier
3. Show upload button per supplier
4. Show evidence summary: "4 claims, 4 supported, 0 conflicts"
5. Link to Evidence Drawer for viewing

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Supplier, Document, Evidence } from "@/lib/types";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api.getSuppliers(id).then(setSuppliers);
  }, [id]);

  return (
    <div className="space-y-6">
      {suppliers.map((supplier) => (
        <SupplierDocumentsCard
          key={supplier.id}
          supplier={supplier}
          onViewEvidence={() => setDrawerOpen(true)}
        />
      ))}
    </div>
  );
}
```

**Testing:**
- [ ] Page loads suppliers
- [ ] Documents grouped by supplier
- [ ] Evidence summary shows correctly
- [ ] Upload button works
- [ ] Evidence drawer opens on click

---

## PHASE 4 RANKING — 3-4 hours

### File 13: `components/ranking/ScenarioConfiguration.tsx` — Create Component (NEW) ✓

**Time: 60 min**

**Changes:**
1. Show weight sliders for each preference criterion
2. Display total weight (must be 100%)
3. Use visual bar to show weight distribution
4. Allow number input for precise control
5. Show validation: "Weights must total 100%"

**Key:**
- Don't save automatically
- Caller handles POST /ranking on submit
- Show helpful tooltip about normalization

**Testing:**
- [ ] Sliders work smoothly
- [ ] Total weight calculates correctly
- [ ] Red warning if total ≠ 100%
- [ ] Can input numbers directly

---

### File 14: `components/ranking/RankingResults.tsx` — Create Component (NEW) ✓

**Time: 90 min**

**Changes:**
1. Fetch and display ranking results per scenario
2. Show ranked suppliers with scores
3. Show "Excluded from Ranking" section for FAIL/REVIEW
4. Add expandable "View Score Breakdown" button
5. Display supplier dominant criterion (strongest advantage)

**Layout:**
```
#1  Supplier A                       60.0
PASS

Strongest advantage: Delivery Reliability

[View Score Breakdown]


#2  Supplier D                       40.0
PASS

Strongest advantage: Quality Score

[View Score Breakdown]


Excluded from Ranking

Supplier B  FAIL
Mandatory lead time not satisfied

Supplier C  REVIEW
Conflicting ISO evidence
```

**API Response Expected:**
```typescript
interface RankingResult {
  rank: number;
  supplier_id: string;
  supplier_name: string;
  score: number;
  eligibility_status: 'PASS' | 'FAIL' | 'REVIEW';
  dominant_criterion: string;
  criterion_scores: Array<{
    criterion: string;
    raw_value: string;
    normalized_score: number;
    weight: number;
    contribution: number;
  }>;
}
```

**Testing:**
- [ ] Results load and display
- [ ] Ranking order is correct
- [ ] Scores are visible
- [ ] Excluded section shows excluded suppliers
- [ ] Score breakdown expands

---

### File 15: `components/ranking/ScoreBreakdown.tsx` — Create Component (NEW) ✓

**Time: 60 min**

**Changes:**
1. Show per-criterion breakdown
2. Display: Raw Value | Relative Score | Weight | Contribution
3. Add tooltip about "Relative Score" (Min-Max normalization)
4. Link [View Evidence] to open Evidence Drawer
5. Use card layout for each criterion

**Example:**
```
Quality Score
Raw Value: 88%
Relative Score: 0 / 100
Weight: 40%
Contribution: 0 points

[View Evidence]
```

**Key:**
- "Relative Score" not "Normalized Score" (simpler terminology)
- Tooltip: "Converts different metrics onto 0–100 scale"
- Evidence link should open drawer with that criterion's evidence

**Testing:**
- [ ] All criterion scores display
- [ ] Math is correct (weight × normalized = contribution)
- [ ] Tooltip appears on hover
- [ ] Evidence link opens drawer

---

### File 16: `app/cases/[id]/ranking/page.tsx` — Create Page (NEW) ✓

**Time: 120 min**

**Changes:**
1. Fetch existing ranking scenarios
2. Show scenario selector dropdown
3. Display selected scenario configuration
4. Render RankingResults component
5. Add "+ New Scenario" button → modal
6. Handle scenario creation (POST /ranking)

**Key Workflow:**
1. Page loads scenarios from API
2. User selects scenario (or creates new one)
3. Configuration shows current weights
4. Results show current ranking
5. User can create new scenario with different weights

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ScenarioConfiguration } from "@/components/ranking/ScenarioConfiguration";
import { RankingResults } from "@/components/ranking/RankingResults";
import { NewScenarioModal } from "@/components/ranking/NewScenarioModal";

export default function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);

  useEffect(() => {
    api.getRankingScenarios(id).then((data) => {
      setScenarios(data);
      if (data.length > 0) setSelectedScenario(data[0].id);
    });
  }, [id]);

  const handleCreateScenario = async (name: string, weights: Record<string, number>) => {
    await api.createRankingScenario(id, { name, weights });
    setShowNewScenarioModal(false);
    // Reload scenarios
  };

  const selectedScenarioData = scenarios.find((s) => s.id === selectedScenario);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Supplier Ranking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare eligible suppliers using preference criteria and transparent weighted scoring.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex items-center gap-4">
        <select
          value={selectedScenario || ''}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="px-4 py-2 border rounded-lg"
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

      {selectedScenarioData && (
        <>
          <ScenarioConfiguration scenario={selectedScenarioData} />
          <RankingResults scenario={selectedScenarioData} caseId={id} />
        </>
      )}

      {showNewScenarioModal && (
        <NewScenarioModal
          onCreate={handleCreateScenario}
          onCancel={() => setShowNewScenarioModal(false)}
        />
      )}
    </div>
  );
}
```

**Testing:**
- [ ] Page loads scenarios
- [ ] Scenario selector works
- [ ] Configuration displays
- [ ] Results display for selected scenario
- [ ] New scenario modal works
- [ ] New scenario appears in dropdown after creation

---

## PHASE 5 SENSITIVITY ANALYSIS — 2 hours

### File 17: `components/ranking/RankingComparisonChart.tsx` — Create Component (NEW) ✓

**Time: 60 min**

**Changes:**
1. Show horizontal bar chart comparing two ranking scenarios
2. Supplier names on left, bars on right
3. Show score values inside/above bars
4. Color code: baseline = indigo, comparison = purple
5. Side-by-side layout for easy comparison

**Template:**
```
Baseline                        Quality Priority

Supplier A   ████████████ 60   Supplier D   ██████████████ 70 ↑
Supplier D   ████████     40   Supplier A   ██████           30 ↓
```

**Testing:**
- [ ] Chart renders both scenarios
- [ ] Bars scale correctly
- [ ] Labels visible
- [ ] Move indicators (↑↓) show for rank changes

---

### File 18: `app/cases/[id]/sensitivity/page.tsx` — Create Page (NEW) ✓

**Time: 60 min**

**Changes:**
1. Fetch all ranking scenarios
2. Allow user to select baseline + comparison scenario
3. Load ranking results for both
4. Display side-by-side comparison tables
5. Show impact summary (which suppliers moved rank)
6. Show bar chart comparison
7. Add helpful note: "Ranking stable" or "D moves #2→#1 if quality increases"

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export default function SensitivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [scenarios, setScenarios] = useState([]);
  const [baselineId, setBaselineId] = useState<string>('');
  const [compareToId, setCompareToId] = useState<string>('');

  useEffect(() => {
    api.getRankingScenarios(id).then((data) => {
      setScenarios(data);
      if (data.length > 0) setBaselineId(data[0].id);
      if (data.length > 1) setCompareToId(data[1].id);
    });
  }, [id]);

  return (
    <div className="space-y-8">
      {/* Scenario Selectors */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label>Baseline</label>
          <select value={baselineId} onChange={(e) => setBaselineId(e.target.value)}>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Compare To</label>
          <select value={compareToId} onChange={(e) => setCompareToId(e.target.value)}>
            {scenarios.filter((s) => s.id !== baselineId).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Content */}
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

**Testing:**
- [ ] Scenario selectors work
- [ ] Comparison loads
- [ ] Both rankings display
- [ ] Impact summary is clear

---

## PHASE 6 REQUIREMENTS TAB — 1.5 hours

### File 19: `components/ui/Modal.tsx` — Create Component (NEW) ✓

**Time: 20 min**

**Use for:** Add Requirement, New Scenario, decision dialogs

**Features:**
- Centered modal
- Title + content + footer
- Backdrop click to close
- Dark mode support

**Code Template:** See SOURCESURE_CODE_PATTERNS.md, Pattern #4

---

### File 20: `app/cases/[id]/requirements/page.tsx` — Create Page (NEW) ✓

**Time: 90 min**

**Changes:**
1. Fetch requirements from API
2. Group by kind: MANDATORY vs PREFERENCE
3. Show requirement cards with edit/delete buttons
4. Add "+ Add Requirement" button → modal
5. Show helpful text: "Failure of mandatory requirement excludes supplier"
6. Handle create, update, delete operations

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Requirement } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const mandatory = requirements.filter((r) => r.kind === 'MANDATORY');
  const preferences = requirements.filter((r) => r.kind === 'PREFERENCE');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Requirements</h1>
        <p className="text-sm text-gray-500">
          Define which conditions suppliers must satisfy and which factors should influence ranking.
        </p>
      </div>

      {/* Mandatory */}
      <div>
        <h2 className="text-lg font-bold mb-2">Mandatory Requirements</h2>
        <p className="text-xs text-gray-500 mb-4">
          Failure of a mandatory requirement excludes the supplier from ranking.
        </p>
        {mandatory.length === 0 ? (
          <EmptyState message="No mandatory requirements yet" />
        ) : (
          <div className="space-y-3">
            {mandatory.map((req) => (
              <RequirementCard key={req.id} requirement={req} onEdit={() => setEditingId(req.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div>
        <h2 className="text-lg font-bold mb-2">Preferences</h2>
        <p className="text-xs text-gray-500 mb-4">
          Preference requirements affect ranking only after mandatory eligibility.
        </p>
        {preferences.length === 0 ? (
          <EmptyState message="No preference requirements yet" />
        ) : (
          <div className="space-y-3">
            {preferences.map((req) => (
              <RequirementCard key={req.id} requirement={req} onEdit={() => setEditingId(req.id)} />
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl">
        + Add Requirement
      </button>

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
```

**Testing:**
- [ ] Page loads requirements
- [ ] Mandatory and preferences separated
- [ ] Edit/delete buttons work
- [ ] Add button opens modal
- [ ] New requirement appears after save
- [ ] Empty states show when needed

---

## PHASE 7 DECISION TAB — 2 hours

### File 21: `app/cases/[id]/decision/page.tsx` — Create Page (NEW) ✓

**Time: 120 min**

**Changes:**
1. Fetch decision summary from Phase 5 API (scaffold if not ready)
2. Show recommendation card (green)
3. Show eligible alternatives section
4. Show excluded/review suppliers section
5. Show sensitivity note (if exists)
6. Add human decision controls: radio buttons + notes + submit
7. Handle decision submission

**Key Features:**
- Recommendation card is prominent (green, checkmarks)
- Alternatives show rank + key strength
- Excluded show reason
- Decision options: Approve | Select Alternative | Defer
- Notes field (optional)
- Submit button disabled until decision selected

**Template:**
```typescript
"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export default function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [decision, setDecision] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getDecisionSummary(id).then(setDecision);
  }, [id]);

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

  if (!decision) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Decision Summary</h1>

      <RecommendationCard supplier={decision.recommended_supplier} />

      {decision.alternative_suppliers.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Eligible Alternatives</h2>
          <div className="space-y-3">
            {decision.alternative_suppliers.map((alt) => (
              <AlternativeSupplierCard key={alt.id} supplier={alt} />
            ))}
          </div>
        </div>
      )}

      {/* Exclusions */}
      {/* Sensitivity Note */}

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
```

**API Response Expected (Phase 5):**
```typescript
interface DecisionSummary {
  recommended_supplier: Supplier & { rank: number; score: number };
  recommendation_reasons: string[];
  alternative_suppliers: Array<{ supplier: Supplier; rank: number; score: number; strength: string }>;
  excluded_suppliers: Array<{ supplier: Supplier; exclusion_reason: string }>;
  review_suppliers: Supplier[];
  sensitivity_note?: string;
}
```

**Temporary Solution (if Phase 5 not ready):**
```typescript
// Scaffold with mock interface
const mockDecision: DecisionSummary = {
  recommended_supplier: suppliers.find(s => s.status === 'PASS') || suppliers[0],
  recommendation_reasons: ['All mandatory requirements satisfied', 'Highest score under Baseline scenario'],
  alternative_suppliers: [],
  excluded_suppliers: [],
  review_suppliers: [],
};
```

**Testing:**
- [ ] Recommendation card displays
- [ ] Alternatives show (if any)
- [ ] Exclusions show (if any)
- [ ] Decision options are selectable
- [ ] Submit button works
- [ ] Notes save with decision

---

## POLISH PHASE — 2 hours

### File 22: `components/ui/LoadingState.tsx` — Create Component (NEW) ✓

**Time: 20 min**

**Use for:** All async data loading

**Code Template:** See SOURCESURE_CODE_PATTERNS.md, Pattern #9

**Testing:**
- [ ] Spinner renders
- [ ] Message displays
- [ ] All 3 variants work (spinner, skeleton, dots)

---

### File 23: `components/ui/EmptyState.tsx` — Create Component (NEW) ✓

**Time: 20 min**

**Use for:** No data scenarios

**Code Template:** See SOURCESURE_CODE_PATTERNS.md, Pattern #10

**Testing:**
- [ ] Title + message display
- [ ] Icon renders
- [ ] Action button works

---

### File 24: `components/ui/ErrorState.tsx` — Create Component (NEW) ✓

**Time: 20 min**

**Use for:** API errors, failed data loading

**Features:**
- Show friendly error message
- Hide technical details
- Action button to retry (if applicable)

**Testing:**
- [ ] Error message displays
- [ ] Retry button works

---

### File 25: `globals.css` — Update Typography ✓

**Time: 30 min**

**Changes:**
1. Slightly increase font sizes
2. Case title: 28-32px (from current)
3. Section title: 20-24px
4. Card metric: 28-32px
5. Body: 14-16px
6. Metadata: 12-13px
7. Adjust line-height for readability

**Before → After:**
```css
/* BEFORE */
.text-lg { font-size: 1.125rem; }

/* AFTER */
.text-4xl { font-size: 2rem; } /* Case title */
.text-3xl { font-size: 1.875rem; } /* Section title */
.text-2xl { font-size: 1.5rem; } /* Card metric */
.text-base { font-size: 1rem; } /* Body */
.text-sm { font-size: 0.875rem; } /* Metadata */
```

**Testing:**
- [ ] Text is legible on projector
- [ ] Hierarchy is clear
- [ ] No text overflow

---

### File 26: `app/layout.tsx` — Update Max Width ✓

**Time: 10 min**

**Changes:**
1. Increase main content max-width: 1180-1280px (from current narrower layout)
2. Keep header at full width
3. Center content with auto margins

**Before → After:**
```typescript
// BEFORE
<main className="max-w-7xl mx-auto ...">

// AFTER
<main className="max-w-6xl lg:max-w-7xl mx-auto ...">
```

**Testing:**
- [ ] Uses screen space effectively
- [ ] Content not too wide
- [ ] Mobile still responsive

---

## API Endpoints Checklist

Before frontend work starts, confirm backend has these:

- [ ] `GET /cases/{caseId}` — case details
- [ ] `GET /cases/{caseId}/suppliers` — supplier list
- [ ] `GET /cases/{caseId}/requirements` — requirements
- [ ] `GET /cases/{caseId}/eligibility` — eligibility matrix with reasons
- [ ] `GET /cases/{caseId}/documents` — documents per supplier
- [ ] `GET /cases/{caseId}/evidence` — evidence claims
- [ ] `GET /cases/{caseId}/ranking` — ranking scenarios
- [ ] `POST /cases/{caseId}/ranking` — create ranking scenario
- [ ] `GET /cases/{caseId}/ranking/{scenarioId}` — ranking results
- [ ] `GET /cases/{caseId}/decision` — decision summary (Phase 5, can mock)
- [ ] `POST /cases/{caseId}/decision` — submit decision (Phase 5, can mock)

---

## Completion Checklist

### Phase 0 (2.5 hrs)
- [ ] File 1: CaseTabs (remove phases)
- [ ] File 2: Case header status
- [ ] File 3: Attention banner
- [ ] File 4: Supplier rows

### Phase 1 (1.5 hrs)
- [ ] File 5: SummaryCard component
- [ ] File 6: Update overview cards

### Phase 2 (2-3 hrs)
- [ ] File 7: StatusBadge component
- [ ] File 8: EligibilityMatrix component
- [ ] File 9: Eligibility page

### Phase 3 (2-3 hrs)
- [ ] File 10: Drawer component
- [ ] File 11: Enhanced EvidenceDrawer
- [ ] File 12: Documents page

### Phase 4 (3-4 hrs)
- [ ] File 13: ScenarioConfiguration
- [ ] File 14: RankingResults
- [ ] File 15: ScoreBreakdown
- [ ] File 16: Ranking page

### Phase 5 (2 hrs)
- [ ] File 17: RankingComparisonChart
- [ ] File 18: Sensitivity page

### Phase 6 (1.5 hrs)
- [ ] File 19: Modal component
- [ ] File 20: Requirements page

### Phase 7 (2 hrs)
- [ ] File 21: Decision page

### Polish (2 hrs)
- [ ] File 22: LoadingState component
- [ ] File 23: EmptyState component
- [ ] File 24: ErrorState component
- [ ] File 25: Typography in globals.css
- [ ] File 26: Layout max-width

---

**Total Time Estimate: ~27 hours of focused frontend work**

This is aggressive for a hackathon, so **prioritize phases in order**. You can ship a working product after Phase 4. Phases 5-7 make it impressive.

Start with Phase 0 (quick wins) to show immediate progress to stakeholders.
