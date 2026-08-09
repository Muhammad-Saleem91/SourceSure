import {
  SourcingCase,
  CaseAnalysis,
  Requirement,
  Supplier,
  Document,
  Evidence,
  EligibilityMatrixResponse,
  EligibilityRunResponse,
  RankingScenarioResponse,
  RobustnessResponse,
  DecisionSummary,
} from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.error) {
      throw new Error(errorData.error.message || "An API error occurred");
    }
    if (errorData?.detail) {
      throw new Error(typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail));
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API Services without mock data fallback

export const api = {
  // Cases API
  async getCases(): Promise<SourcingCase[]> {
    return fetcher<SourcingCase[]>("/cases");
  },

  async getCase(id: string): Promise<SourcingCase> {
    return fetcher<SourcingCase>(`/cases/${id}`);
  },

  async getCaseAnalysis(id: string): Promise<CaseAnalysis> {
    return fetcher<CaseAnalysis>(`/cases/${id}/analysis`);
  },

  async createCase(data: Partial<SourcingCase>): Promise<SourcingCase> {
    return fetcher<SourcingCase>("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Requirements API
  async getRequirements(caseId: string): Promise<Requirement[]> {
    return fetcher<Requirement[]>(`/cases/${caseId}/requirements`);
  },

  async updateRequirements(caseId: string, requirements: Requirement[]): Promise<Requirement[]> {
    return fetcher<Requirement[]>(`/cases/${caseId}/requirements`, {
      method: "PUT",
      body: JSON.stringify({ requirements }),
    });
  },

  // Suppliers API
  async getSuppliers(caseId: string): Promise<Supplier[]> {
    const res = await fetcher<{ suppliers: Supplier[]; total: number }>(`/cases/${caseId}/suppliers`);
    return res.suppliers;
  },

  async createSupplier(caseId: string, data: { name: string; external_ref?: string; country?: string }): Promise<Supplier> {
    return fetcher<Supplier>(`/cases/${caseId}/suppliers`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Documents & Evidence API
  async getDocuments(supplierId: string): Promise<Document[]> {
    return fetcher<Document[]>(`/suppliers/${supplierId}/documents`);
  },

  async uploadDocument(supplierId: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/suppliers/${supplierId}/documents`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData?.error) throw new Error(errorData.error.message || "An API error occurred");
      if (errorData?.detail) throw new Error(typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail));
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  async getEvidence(supplierId: string): Promise<Evidence[]> {
    const res = await fetcher<{ evidence: Evidence[]; total: number }>(`/suppliers/${supplierId}/evidence`);
    return res.evidence;
  },

  // Eligibility API
  async getEligibilityMatrix(caseId: string): Promise<EligibilityMatrixResponse> {
    return fetcher<EligibilityMatrixResponse>(`/cases/${caseId}/eligibility`);
  },

  async runEligibility(caseId: string, supplierIds?: string[]): Promise<EligibilityRunResponse> {
    return fetcher<EligibilityRunResponse>(`/cases/${caseId}/eligibility-runs`, {
      method: "POST",
      body: JSON.stringify({ supplier_ids: supplierIds }),
    });
  },

  // Phase 4 Ranking API
  async getRankingScenario(caseId: string, scenarioId?: string): Promise<RankingScenarioResponse> {
    if (scenarioId) {
      return fetcher<RankingScenarioResponse>(`/cases/${caseId}/ranking-scenarios/${scenarioId}`);
    }
    const scenarios = await fetcher<RankingScenarioResponse[]>(`/cases/${caseId}/ranking-scenarios`);
    if (scenarios.length > 0) return scenarios[0];
    throw new Error("No ranking scenarios found");
  },

  async getRankingScenarios(caseId: string): Promise<RankingScenarioResponse[]> {
    return fetcher<RankingScenarioResponse[]>(`/cases/${caseId}/ranking-scenarios`);
  },

  async createRankingScenario(
    caseId: string,
    data: { name: string; weights: Record<string, number>; normalization_method?: string }
  ): Promise<RankingScenarioResponse> {
    return fetcher<RankingScenarioResponse>(`/cases/${caseId}/ranking-scenarios`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getRobustnessAnalysis(caseId: string, baseScenarioId?: string): Promise<RobustnessResponse> {
    return fetcher<RobustnessResponse>(`/cases/${caseId}/robustness`, {
      method: "POST",
      body: JSON.stringify({ base_scenario_id: baseScenarioId }),
    });
  },

  // Phase 5 Decision API
  async getDecisionSummary(caseId: string): Promise<DecisionSummary> {
    return fetcher<DecisionSummary>(`/cases/${caseId}/decision-summaries`);
  },

  async recordHumanDecision(
    summaryId: string,
    data: { human_decision: string; notes?: string }
  ): Promise<DecisionSummary> {
    return fetcher<DecisionSummary>(`/decision-summaries/${summaryId}/human-decision`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
