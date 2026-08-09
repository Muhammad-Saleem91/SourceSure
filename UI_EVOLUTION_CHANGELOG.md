# SourceSure Frontend — UI Evolution Changelog

This documents what changed in this pass, mapped to the sections of the
Master Plan doc that called for it. Most of the frontend (all seven tabs,
StatusBadge, SummaryCard, Drawer, EligibilityMatrix, ScenarioConfiguration,
etc.) already existed going into this pass — the work below is what was
still missing or inconsistent with the plan.

## 1. Remove internal phase labels (§ "The user should never need to
   understand your internal phases")
- `components/CaseTabs.tsx` — dropped the `phase` field and `P0`/`P1`/…
  badges entirely; tabs are now plain business labels (Overview,
  Requirements, Documents & Evidence, Eligibility, Ranking, Sensitivity,
  Decision).
- Removed remaining "Phase 3 / Phase 4 / Phase 5" copy from the
  Eligibility, Requirements, Ranking, Decision, and Overview pages,
  reworded to business language ("Deterministic Rule Engine",
  "Eligibility Gate Criteria", "Multi-Criteria Ranking Engine",
  "Decision & Audit Package").
- Case header status pills and the attention banner already matched the
  plan's target wording — no change needed there.

## 2. § 21–22 "Relative Score" naming + tooltip
- `components/ranking/RankingResults.tsx`: the score breakdown table
  column was labeled **"Normalized Score (0-1)"** — renamed to
  **"Relative Score"** (shown as `x / 100`) with a hover/focus tooltip
  explaining Min-Max scaling, matching the plan's exact caution against
  making procurement managers "enroll in Data Science 101."
- The same table previously showed the raw `field_key`/`requirement_id`
  as the criterion name. It now resolves the human-readable requirement
  `label` (via the preference requirements already loaded on the Ranking
  page) and falls back to the key only if no label is found.

## 3. § 18 "Require weights to total 100%"
- The "Create Ranking Scenario" modal (`app/cases/[id]/ranking/page.tsx`)
  had sliders but no total, and let you submit any combination. Added a
  live **Total Weight** readout, a warning message when it's off, and the
  submit button is now disabled until weights sum to exactly 100%.

## 4. § 29 Human Decision controls
- `app/cases/[id]/decision/page.tsx` previously had a single
  select-supplier + rationale + "Approve" flow. Replaced with the
  three-way control described in the plan:
  - **Approve recommended supplier**
  - **Select another eligible supplier** (reveals a PASS-only supplier
    picker)
  - **Defer decision** (no supplier required, just notes)
  Each mode produces a distinct audit-log entry and the submit button
  label adapts ("Confirm Decision" vs "Record Deferred Decision").

## 5. § 13 Conflict Evidence Drawer (VS layout)
- `components/evidence/EvidenceDrawer.tsx` previously rendered all
  evidence as a flat list, including conflicting claims, distinguished
  only by a FAIL badge. Evidence is now grouped by field; any field with
  more than one claim where at least one is `CONFLICTING` is broken out
  into its own red-bordered panel with the two sources shown side-by-side
  separated by a "VS" divider, plus a one-line "human review required"
  note — matching the plan's Source 1 / VS / Source 2 mock-up.

## 6. § 35–36 Empty states & friendly errors
- Requirements page: the Mandatory and Preference tables now show an
  inline empty state with a direct "+ Add Requirement" action (pre-filled
  to the right kind) instead of just rendering an empty table.
- Replaced three remaining raw `alert(err.message)` error paths
  (Eligibility "Re-run Engine", Ranking "Compute Ranking", Decision
  "Confirm Decision") with inline, human-readable error banners instead
  of exposing backend/HTTP error text.

## Not changed in this pass
- Sensitivity comparison bar chart and "Ranking Impact Detected" rank
  movement narrative already matched § 23–24 — no change made.
- Status pills / attention banner already matched § 3–4 — no change made.
- Requirements "Add Requirement" modal already avoided exposing raw
  `field_key`/enum names — no change made.
- Deeper backend-integration items from the plan (§ 38–39: enriching
  ranking responses with real `supplier_name`, wiring the real Phase 5
  decision schema) are backend-owned and out of scope for a
  frontend-only pass.
