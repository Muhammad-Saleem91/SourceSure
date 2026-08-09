# SourceSure Frontend Plan: Phase 0 to Phase 3

## Purpose

This plan covers the frontend work needed to support the backend through Phase 3:

- Phase 0: app shell, navigation, typed API contract, and local development readiness
- Phase 1: case and requirement management screens
- Phase 2: document and evidence surfaces
- Phase 3: real eligibility visualization and traceability

The frontend must consume backend data only. It must not infer eligibility or ranking on its own.

## Frontend Rules

1. Backend is the source of truth for case, supplier, evidence, eligibility, ranking, and decision data.
2. The frontend may render derived views, but it must not calculate eligibility or ranking independently.
3. Traceability must remain visible in the UI, especially evidence IDs, quotes, and source document references.
4. Ranking and sensitivity views stay out of scope until backend Phase 4 is complete.

## Phase 0 — Frontend Foundation

**Goal:** The Next.js app is runnable, styled, and connected to a typed backend client.

### Deliverables

- App shell with shared navigation, header, and case workspace layout
- Global design tokens and responsive styling baseline
- Typed API client in `lib/api/client.ts`
- Shared TypeScript contracts in `lib/types/index.ts`
- Placeholder landing page and case index page
- Shared loading, empty, and error states

### Recommended pages and components

- Home dashboard
- Cases list
- Case detail shell with tab navigation
- Shared layout for all case subpages

### Phase 0 gate

- `npm run dev` starts successfully
- `/` renders without error
- `/cases` renders without error
- app shell works on desktop and mobile widths

## Phase 1 — Cases and Requirements

**Goal:** Users can inspect cases, suppliers, and requirements with real backend data or a stable mock contract.

### Deliverables

- Case overview screen with case metadata and current status
- Requirements screen with mandatory and preference sections
- Requirement cards or table rows showing:
  - key
  - label
  - kind
  - operator or direction
  - target value or weight
  - unit
- Supplier list or summary panel for the active case
- Form-ready UI for editing requirements when the backend endpoint is available

### UX requirements

- Preference requirements must clearly show weights
- Mandatory requirements must be visually separated from preferences
- Empty and loading states must be explicit
- Any unsupported or missing backend field should fail visibly in development instead of being silently hidden

### Phase 1 gate

- A case can be opened from the case list
- Requirements are visible and legible for the selected case
- Frontend types compile against the backend contract
- The UI does not depend on ranking being implemented yet

## Phase 2 — Documents and Evidence

**Goal:** The UI exposes document ingestion and evidence traceability for suppliers.

### Deliverables

- Supplier document list or document timeline
- Upload entry point if the backend supports it
- Document status indicators such as uploaded, parsing, extracting, ready, or error
- Evidence panel showing:
  - field key
  - raw value
  - normalized value
  - confidence
  - quote
  - page, sheet, or section reference
- Visual link from requirement or supplier to supporting evidence

### UX requirements

- Evidence must be easy to expand from requirement or supplier context
- The same evidence record should be reusable across eligibility and later ranking trace views
- If a document or evidence item fails validation, the UI should show the backend reason code

### Phase 2 gate

- Users can see document and evidence state for each supplier
- Evidence trace data is visible without manual inspection of raw API JSON
- Missing or invalid document states are surfaced clearly

## Phase 3 — Eligibility Matrix

**Goal:** The frontend shows the real deterministic eligibility result from the backend and makes the PASS/FAIL/REVIEW boundary obvious.

### Deliverables

- Eligibility matrix for all suppliers and mandatory requirements
- Overall supplier status column
- Cell-level status presentation for PASS, FAIL, REVIEW, and PENDING
- Evidence drawer or side panel for any selected cell
- Clear distinction between supplier-level overall status and requirement-level check status

### UX requirements

- FAIL, REVIEW, and PENDING suppliers must be shown as excluded from later ranking flows
- PASS suppliers should be visually emphasized as the only ones eligible for ranking
- Cell expansion should show observed value, required value, rule, reason, and evidence reference
- Conflicting evidence should be visible as a human-review condition, not hidden behind a generic error state

### Phase 3 gate

- Eligibility data is loaded from the backend and rendered without local recomputation
- PASS-only gating is visible in the UI
- Evidence trace survives from supplier view to requirement view to evidence details
- The frontend is ready for Phase 4 ranking screens, but does not implement ranking yet

## Suggested File Scope

The current app tree already supports these areas:

- `app/page.tsx` for the landing dashboard
- `app/cases/page.tsx` for the case list
- `app/cases/[id]/layout.tsx` for the case workspace shell
- `app/cases/[id]/page.tsx` for the case overview
- `app/cases/[id]/requirements/page.tsx` for requirements
- `app/cases/[id]/eligibility/page.tsx` for eligibility
- `app/cases/[id]/ranking/page.tsx` for later Phase 4 work
- `app/cases/[id]/sensitivity/page.tsx` for later Phase 4 work
- `app/cases/[id]/decision/page.tsx` for later Phase 5 work

## Explicit Non-Goals for Phases 0 to 3

- Ranking algorithms
- Sensitivity analysis
- Decision summary generation
- Scenario comparison
- Advanced charting beyond the eligibility and evidence views

## Completion Check for Frontend Phases 0 to 3

Frontend Phase 0 to 3 is complete when:

- the app shell is stable and responsive
- case and requirement pages render correctly
- document and evidence trace views are usable
- eligibility is rendered from backend results
- PASS-only gating is obvious in the UI
- no frontend code computes ranking or eligibility independently