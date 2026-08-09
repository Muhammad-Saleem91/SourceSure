export type SourcingCaseStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export interface SourcingCase {
  id: string;
  name: string;
  description?: string;
  evaluation_date?: string;
  status: SourcingCaseStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplierSnapshot {
  id: string;
  name: string;
  status: string;
  document_count: number;
  has_evidence: boolean;
}

export interface CaseAnalysis {
  case: SourcingCase;
  suppliers: SupplierSnapshot[];
  has_documents: boolean;
  eligibility_ready: boolean;
  ranking_ready: boolean;
  decision_ready: boolean;
  warnings: string[];
  active_scenario_id?: string | null;
}

export type RequirementKind = "MANDATORY" | "PREFERENCE";
export type ValueType = "BOOLEAN" | "NUMBER" | "STRING" | "DATE";
export type Operator = "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "EXISTS";
export type Direction = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export interface Requirement {
  id: string;
  case_id: string;
  key: string;
  label: string;
  kind: RequirementKind;
  value_type: ValueType;
  operator?: Operator;
  target_value?: any;
  unit?: string;
  allowed_values?: any[];
  weight?: number;
  direction?: Direction;
  notes?: string;
}

export type SupplierStatus = "PENDING" | "PASS" | "FAIL" | "REVIEW";

export interface Supplier {
  id: string;
  case_id: string;
  name: string;
  external_ref?: string;
  country?: string;
  status: SupplierStatus;
  created_at: string;
  document_count?: number;
  has_evidence?: boolean;
}

export type DocumentStatus = "UPLOADED" | "PARSING" | "EXTRACTING" | "READY" | "NEEDS_REVIEW" | "ERROR";

export interface Document {
  id: string;
  supplier_id: string;
  display_name: string;
  stored_path?: string;
  mime_type?: string;
  sha256?: string;
  status: DocumentStatus;
  page_count?: number;
  uploaded_at: string;
  error_code?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export type EvidenceState = "SUPPORTED" | "LOW_CONFIDENCE" | "CONFLICTING" | "OVERRIDDEN";

export interface Evidence {
  id: string;
  supplier_id: string;
  document_id: string;
  extraction_run_id?: string;
  field_key: string;
  raw_value: string;
  normalized_value?: any;
  unit?: string;
  state: EvidenceState;
  confidence: number;
  quoted_text?: string;
  page_number?: number;
  sheet_name?: string;
  cell_range?: string;
  section?: string;
  provenance_method?: string;
  validation_reason?: string;
  retrieval_date?: string;
  created_at: string;
}

export type CheckStatus = "PASS" | "FAIL" | "REVIEW" | "PENDING";

export interface EligibilityCheck {
  id: string;
  case_id: string;
  supplier_id: string;
  requirement_id: string;
  status: CheckStatus;
  observed_value?: any;
  observed_unit?: string;
  reason_code: string;
  explanation?: string;
  evidence_ids: string[];
  rule_version?: string;
  evaluated_at?: string;
}

export interface SupplierEligibilitySummary {
  supplier_id: string;
  supplier_name: string;
  overall_status: SupplierStatus;
  checks: EligibilityCheck[];
}

export interface EligibilityMatrixResponse {
  case_id: string;
  requirement_keys: string[];
  suppliers: SupplierEligibilitySummary[];
}

export interface EligibilityRunResponse {
  case_id: string;
  suppliers_evaluated: number;
  results: Record<string, number>;
}

export type NormalizationMethod = "MIN_MAX_V1" | "Z_SCORE" | "LINEAR_SCALE";

export interface ScoreComponentResponse {
  id: string;
  requirement_id: string;
  field_key?: string;
  raw_value?: any;
  normalized_score?: number;
  weight: number;
  weighted_score: number;
  evidence_ids: string[];
}

export interface RankingResultResponse {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  eligibility_result_id?: string;
  total_score: number;
  rank: number;
  ranking_version?: string;
  calculated_at?: string;
  score_components: ScoreComponentResponse[];
}

export type RankingResult = RankingResultResponse;
export type RankedSupplier = RankingResultResponse;

export interface RankingScenarioResponse {
  id: string;
  case_id: string;
  name: string;
  weights: Record<string, number>;
  normalization_method: NormalizationMethod;
  created_at: string;
  results: RankingResultResponse[];
}


export interface DecisionSummary {
  id: string;
  case_id: string;
  scenario_id: string;
  recommended_supplier_id?: string;
  generated_text: string;
  assumptions: string[];
  limitations: string[];
  review_actions: string[];
  human_decision?: string;
  human_decision_at?: string;
}

export interface RobustnessSupplierResult {
  supplier_id: string;
  supplier_name?: string;
  top_rank_percentage: number;
  tested_scenarios: number;
}

export interface RobustnessResponse {
  case_id: string;
  base_scenario_id: string;
  tested_scenarios: number;
  results: RobustnessSupplierResult[];
}


export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: any;
    request_id?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

