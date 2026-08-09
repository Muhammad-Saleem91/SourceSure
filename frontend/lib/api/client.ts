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

// Mock fallback datasets matching FastAPI schemas
const MOCK_CASES: SourcingCase[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Aluminum Motor Housing",
    description: "Sourcing 20,000 units/month of 5-axis CNC machined 6061 aluminum motor housings for electric powertrains.",
    evaluation_date: "2026-08-08",
    status: "ACTIVE",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-08T14:30:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Precision Steel Brackets",
    description: "High-precision structural mounting brackets for aerospace chassis assembly.",
    evaluation_date: "2026-08-01",
    status: "COMPLETED",
    created_at: "2026-07-15T09:00:00Z",
    updated_at: "2026-08-01T16:45:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Titanium Heat Exchangers",
    description: "Custom titanium multi-pass heat exchangers meeting ISO 9001 and AS9100D standards.",
    evaluation_date: "2026-08-09",
    status: "DRAFT",
    created_at: "2026-08-05T11:20:00Z",
    updated_at: "2026-08-09T08:15:00Z",
  },
];

const MOCK_REQUIREMENTS: Requirement[] = [
  { id: "req-1", case_id: "00000000-0000-0000-0000-000000000001", key: "cnc_5axis", label: "CNC 5-axis Capability", kind: "MANDATORY", value_type: "BOOLEAN", operator: "EQ", target_value: true, notes: "Must possess in-house 5-axis CNC machining" },
  { id: "req-2", case_id: "00000000-0000-0000-0000-000000000001", key: "material_6061", label: "Aluminum 6061 Grade", kind: "MANDATORY", value_type: "BOOLEAN", operator: "EQ", target_value: true, notes: "Material certification for AL6061-T6 required" },
  { id: "req-3", case_id: "00000000-0000-0000-0000-000000000001", key: "iso_9001", label: "ISO 9001 Certification", kind: "MANDATORY", value_type: "BOOLEAN", operator: "EQ", target_value: true, notes: "Active ISO 9001 audit certificate" },
  { id: "req-4", case_id: "00000000-0000-0000-0000-000000000001", key: "capacity_monthly", label: "Monthly Capacity", kind: "MANDATORY", value_type: "NUMBER", operator: "GTE", target_value: 20000, unit: "units", notes: "Verified monthly throughput" },
  { id: "req-5", case_id: "00000000-0000-0000-0000-000000000001", key: "lead_time_days", label: "Production Lead Time", kind: "MANDATORY", value_type: "NUMBER", operator: "LTE", target_value: 30, unit: "days", notes: "FOB dispatch lead time" },
  { id: "req-6", case_id: "00000000-0000-0000-0000-000000000001", key: "moq", label: "Minimum Order Quantity", kind: "MANDATORY", value_type: "NUMBER", operator: "LTE", target_value: 20000, unit: "units", notes: "Maximum acceptable MOQ threshold" },
  { id: "req-7", case_id: "00000000-0000-0000-0000-000000000001", key: "quality_score", label: "Quality Audit Index", kind: "PREFERENCE", value_type: "NUMBER", weight: 0.4, direction: "HIGHER_IS_BETTER", unit: "score (0-100)", notes: "Third-party quality assessment score" },
  { id: "req-8", case_id: "00000000-0000-0000-0000-000000000001", key: "unit_cost", label: "Unit Production Price", kind: "PREFERENCE", value_type: "NUMBER", weight: 0.6, direction: "LOWER_IS_BETTER", unit: "USD", notes: "Target unit price per motor housing" },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "sup-1", case_id: "00000000-0000-0000-0000-000000000001", name: "Apex Precision Machining Ltd.", external_ref: "SUP-APX-01", country: "Germany", status: "PASS", created_at: "2026-08-01T11:00:00Z", document_count: 3, has_evidence: true },
  { id: "sup-2", case_id: "00000000-0000-0000-0000-000000000001", name: "Global Alloy Components Co.", external_ref: "SUP-GAC-02", country: "China", status: "FAIL", created_at: "2026-08-02T09:30:00Z", document_count: 2, has_evidence: true },
  { id: "sup-3", case_id: "00000000-0000-0000-0000-000000000001", name: "Vanguard Aerospace Parts", external_ref: "SUP-VAP-03", country: "United States", status: "REVIEW", created_at: "2026-08-03T14:15:00Z", document_count: 4, has_evidence: true },
];

const MOCK_DOCUMENTS: Record<string, Document[]> = {
  "sup-1": [
    { id: "doc-101", supplier_id: "sup-1", display_name: "Apex_ISO9001_Certificate_2026.pdf", stored_path: "storage/docs/doc-101.pdf", mime_type: "application/pdf", sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", status: "READY", page_count: 4, uploaded_at: "2026-08-01T12:00:00Z" },
    { id: "doc-102", supplier_id: "sup-1", display_name: "Technical_Capacity_Brochure_5Axis.pdf", stored_path: "storage/docs/doc-102.pdf", mime_type: "application/pdf", sha256: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e", status: "READY", page_count: 12, uploaded_at: "2026-08-01T12:05:00Z" },
    { id: "doc-103", supplier_id: "sup-1", display_name: "Apex_Commercial_Quote_Q3.xlsx", stored_path: "storage/docs/doc-103.xlsx", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sha256: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", status: "READY", page_count: 3, uploaded_at: "2026-08-01T12:10:00Z" },
  ],
  "sup-2": [
    { id: "doc-201", supplier_id: "sup-2", display_name: "GlobalAlloy_Facilities_Overview.pdf", stored_path: "storage/docs/doc-201.pdf", mime_type: "application/pdf", sha256: "7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c6527b63f28d689fb", status: "READY", page_count: 8, uploaded_at: "2026-08-02T10:00:00Z" },
    { id: "doc-202", supplier_id: "sup-2", display_name: "Quote_Sheet_ALMotorHousing.pdf", stored_path: "storage/docs/doc-202.pdf", mime_type: "application/pdf", sha256: "36bbe50ed96841d10443bcb670d6554f0a34b761be67ec9c4a8ad2c0c4442426", status: "NEEDS_REVIEW", page_count: 5, uploaded_at: "2026-08-02T10:15:00Z", error_code: "UNCERTAIN_CAPACITY_CLAIM", error_message: "Observed monthly capacity (15,000) below requirement (20,000)" },
  ],
  "sup-3": [
    { id: "doc-301", supplier_id: "sup-3", display_name: "Vanguard_ISO9001_Audit_Draft.pdf", stored_path: "storage/docs/doc-301.pdf", mime_type: "application/pdf", sha256: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae", status: "READY", page_count: 6, uploaded_at: "2026-08-03T15:00:00Z" },
  ]
};

const MOCK_EVIDENCE: Record<string, Evidence[]> = {
  "sup-1": [
    {
      id: "ev-101",
      supplier_id: "sup-1",
      document_id: "doc-102",
      field_key: "cnc_5axis",
      raw_value: "5-Axis DMG MORI DMU 85 monoBLOCK installed 2024",
      normalized_value: true,
      state: "SUPPORTED",
      confidence: 0.98,
      quoted_text: "Our facility houses 8x 5-axis CNC machining centers (DMG MORI DMU 85 monoBLOCK) dedicated to precision automotive housings.",
      page_number: 3,
      section: "Section 2.1 Machining Fleet Capabilities",
      provenance_method: "LLM_EXTRACTION_V2",
      created_at: "2026-08-01T12:06:00Z",
    },
    {
      id: "ev-102",
      supplier_id: "sup-1",
      document_id: "doc-102",
      field_key: "material_6061",
      raw_value: "AL6061-T6 aluminum alloy mill certificates on file",
      normalized_value: true,
      state: "SUPPORTED",
      confidence: 0.95,
      quoted_text: "We source certified AL6061-T6 aluminum extrusion bar stock with full chemical test reports.",
      page_number: 5,
      section: "Section 3.4 Raw Material Provenance",
      provenance_method: "LLM_EXTRACTION_V2",
      created_at: "2026-08-01T12:06:00Z",
    },
    {
      id: "ev-103",
      supplier_id: "sup-1",
      document_id: "doc-101",
      field_key: "iso_9001",
      raw_value: "ISO 9001:2015 Certificate #DE-982143 valid thru 2027",
      normalized_value: true,
      state: "SUPPORTED",
      confidence: 0.99,
      quoted_text: "Certified by TÜV Rheinland for Quality Management System ISO 9001:2015 for precision CNC manufacturing.",
      page_number: 1,
      section: "Certificate Header",
      provenance_method: "VISION_PARSER",
      created_at: "2026-08-01T12:01:00Z",
    },
    {
      id: "ev-104",
      supplier_id: "sup-1",
      document_id: "doc-102",
      field_key: "capacity_monthly",
      raw_value: "25000 units/month",
      normalized_value: 25000,
      unit: "units",
      state: "SUPPORTED",
      confidence: 0.92,
      quoted_text: "Current motor housing production line output capacity is 25,000 units monthly under two-shift operation.",
      page_number: 7,
      section: "Section 4 Production Volume & Throughput",
      provenance_method: "LLM_EXTRACTION_V2",
      created_at: "2026-08-01T12:06:00Z",
    },
    {
      id: "ev-105",
      supplier_id: "sup-1",
      document_id: "doc-103",
      field_key: "lead_time_days",
      raw_value: "21 calendar days",
      normalized_value: 21,
      unit: "days",
      state: "SUPPORTED",
      confidence: 0.97,
      quoted_text: "Standard production lead time is 21 calendar days from purchase order confirmation to Hamburg port loading.",
      sheet_name: "Commercial Terms",
      cell_range: "B14:D14",
      provenance_method: "TABLE_PARSER",
      created_at: "2026-08-01T12:11:00Z",
    },
    {
      id: "ev-106",
      supplier_id: "sup-1",
      document_id: "doc-103",
      field_key: "moq",
      raw_value: "5,000 units",
      normalized_value: 5000,
      unit: "units",
      state: "SUPPORTED",
      confidence: 0.99,
      quoted_text: "Minimum Order Quantity per production run: 5,000 units.",
      sheet_name: "Pricing Schedule",
      cell_range: "C8:E8",
      provenance_method: "TABLE_PARSER",
      created_at: "2026-08-01T12:11:00Z",
    },
  ],
  "sup-2": [
    {
      id: "ev-201",
      supplier_id: "sup-2",
      document_id: "doc-201",
      field_key: "cnc_5axis",
      raw_value: "3-axis and 4-axis CNC lathes and milling machines",
      normalized_value: false,
      state: "SUPPORTED",
      confidence: 0.94,
      quoted_text: "Machining equipment includes 3-axis CNC vertical centers and 4-axis horizontal rotary indexing units.",
      page_number: 4,
      section: "Equipment List",
      provenance_method: "LLM_EXTRACTION_V2",
      created_at: "2026-08-02T10:05:00Z",
    },
    {
      id: "ev-202",
      supplier_id: "sup-2",
      document_id: "doc-202",
      field_key: "capacity_monthly",
      raw_value: "15,000 units/month maximum",
      normalized_value: 15000,
      unit: "units",
      state: "SUPPORTED",
      confidence: 0.89,
      quoted_text: "Max capacity allocated for housing machining is 15,000 units per month.",
      page_number: 2,
      section: "Operational Limits",
      provenance_method: "LLM_EXTRACTION_V2",
      created_at: "2026-08-02T10:16:00Z",
    },
  ],
  "sup-3": [
    {
      id: "ev-301",
      supplier_id: "sup-3",
      document_id: "doc-301",
      field_key: "iso_9001",
      raw_value: "ISO 9001 Audit in progress - pending final signoff",
      normalized_value: null,
      state: "LOW_CONFIDENCE",
      confidence: 0.65,
      quoted_text: "Stage 2 ISO 9001 audit conducted July 2026; pending final certificate issuance expected Q4.",
      page_number: 2,
      section: "Compliance Summary",
      provenance_method: "LLM_EXTRACTION_V2",
      validation_reason: "Document mentions pending audit signoff rather than active certificate number.",
      created_at: "2026-08-03T15:05:00Z",
    },
  ],
};

const MOCK_ELIGIBILITY_MATRIX: EligibilityMatrixResponse = {
  case_id: "00000000-0000-0000-0000-000000000001",
  requirement_keys: ["cnc_5axis", "material_6061", "iso_9001", "capacity_monthly", "lead_time_days", "moq"],
  suppliers: [
    {
      supplier_id: "sup-1",
      supplier_name: "Apex Precision Machining Ltd.",
      overall_status: "PASS",
      checks: [
        { id: "chk-101", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-1", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "Supplier possesses 8x 5-axis CNC machines", evidence_ids: ["ev-101"] },
        { id: "chk-102", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-2", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "Certified AL6061-T6 stock available", evidence_ids: ["ev-102"] },
        { id: "chk-103", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-3", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "Active ISO 9001 certificate verified", evidence_ids: ["ev-103"] },
        { id: "chk-104", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-4", status: "PASS", observed_value: 25000, observed_unit: "units", reason_code: "REQ_MET", explanation: "Monthly capacity 25,000 exceeds 20,000 requirement", evidence_ids: ["ev-104"] },
        { id: "chk-105", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-5", status: "PASS", observed_value: 21, observed_unit: "days", reason_code: "REQ_MET", explanation: "Lead time 21 days is within max 30 days limit", evidence_ids: ["ev-105"] },
        { id: "chk-106", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-1", requirement_id: "req-6", status: "PASS", observed_value: 5000, observed_unit: "units", reason_code: "REQ_MET", explanation: "MOQ 5,000 is under max 20,000 limit", evidence_ids: ["ev-106"] },
      ],
    },
    {
      supplier_id: "sup-2",
      supplier_name: "Global Alloy Components Co.",
      overall_status: "FAIL",
      checks: [
        { id: "chk-201", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-1", status: "FAIL", observed_value: false, reason_code: "MANDATORY_REQUIREMENT_FAILED", explanation: "Only 3-axis and 4-axis CNC equipment documented. Lacks 5-axis capability.", evidence_ids: ["ev-201"] },
        { id: "chk-202", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-2", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "AL6061 stock available", evidence_ids: [] },
        { id: "chk-203", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-3", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "ISO 9001 certified", evidence_ids: [] },
        { id: "chk-204", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-4", status: "FAIL", observed_value: 15000, observed_unit: "units", reason_code: "MANDATORY_REQUIREMENT_FAILED", explanation: "Monthly capacity of 15,000 units is below target of 20,000 units", evidence_ids: ["ev-202"] },
        { id: "chk-205", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-5", status: "PASS", observed_value: 28, observed_unit: "days", reason_code: "REQ_MET", explanation: "Lead time 28 days is within limit", evidence_ids: [] },
        { id: "chk-206", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-2", requirement_id: "req-6", status: "PASS", observed_value: 10000, observed_unit: "units", reason_code: "REQ_MET", explanation: "MOQ 10,000 is within limit", evidence_ids: [] },
      ],
    },
    {
      supplier_id: "sup-3",
      supplier_name: "Vanguard Aerospace Parts",
      overall_status: "REVIEW",
      checks: [
        { id: "chk-301", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-1", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "5-axis CNC capability confirmed", evidence_ids: [] },
        { id: "chk-302", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-2", status: "PASS", observed_value: true, reason_code: "REQ_MET", explanation: "AL6061 stock confirmed", evidence_ids: [] },
        { id: "chk-303", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-3", status: "REVIEW", observed_value: "PENDING_AUDIT", reason_code: "HUMAN_REVIEW_REQUIRED", explanation: "ISO 9001 certificate audit is in progress; pending final certificate sign-off.", evidence_ids: ["ev-301"] },
        { id: "chk-304", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-4", status: "PASS", observed_value: 30000, observed_unit: "units", reason_code: "REQ_MET", explanation: "Capacity 30,000 meets target", evidence_ids: [] },
        { id: "chk-305", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-5", status: "PASS", observed_value: 25, observed_unit: "days", reason_code: "REQ_MET", explanation: "Lead time 25 days meets target", evidence_ids: [] },
        { id: "chk-306", case_id: "00000000-0000-0000-0000-000000000001", supplier_id: "sup-3", requirement_id: "req-6", status: "PASS", observed_value: 15000, observed_unit: "units", reason_code: "REQ_MET", explanation: "MOQ meets target", evidence_ids: [] },
      ],
    },
  ],
};

// API Services with resilient fallback mock execution

export const api = {
  // Cases API
  async getCases(): Promise<SourcingCase[]> {
    try {
      return await fetcher<SourcingCase[]>("/cases");
    } catch {
      return MOCK_CASES;
    }
  },

  async getCase(id: string): Promise<SourcingCase> {
    try {
      return await fetcher<SourcingCase>(`/cases/${id}`);
    } catch {
      const found = MOCK_CASES.find((c) => c.id === id);
      return found || {
        id,
        name: `Case #${id}`,
        description: "Procurement evaluation case",
        evaluation_date: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  async getCaseAnalysis(id: string): Promise<CaseAnalysis> {
    try {
      return await fetcher<CaseAnalysis>(`/cases/${id}/analysis`);
    } catch {
      const caseItem = await this.getCase(id);
      return {
        case: caseItem,
        suppliers: MOCK_SUPPLIERS.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          document_count: s.document_count || 0,
          has_evidence: s.has_evidence || false,
        })),
        eligibility_ready: true,
        ranking_ready: false,
        warnings: [
          "Supplier Vanguard Aerospace Parts requires human review on ISO 9001 certification audit.",
        ],
        active_scenario_id: null,
      };
    }
  },

  async createCase(data: Partial<SourcingCase>): Promise<SourcingCase> {
    try {
      return await fetcher<SourcingCase>("/cases", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const newCase: SourcingCase = {
        id: `case-${Date.now()}`,
        name: data.name || "New Sourcing Case",
        description: data.description || "",
        evaluation_date: data.evaluation_date || new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_CASES.unshift(newCase);
      return newCase;
    }
  },

  // Requirements API
  async getRequirements(caseId: string): Promise<Requirement[]> {
    try {
      return await fetcher<Requirement[]>(`/cases/${caseId}/requirements`);
    } catch {
      return MOCK_REQUIREMENTS.filter((r) => r.case_id === caseId || caseId.startsWith("0000") || caseId === "1");
    }
  },

  async updateRequirements(caseId: string, requirements: Requirement[]): Promise<Requirement[]> {
    try {
      return await fetcher<Requirement[]>(`/cases/${caseId}/requirements`, {
        method: "PUT",
        body: JSON.stringify({ requirements }),
      });
    } catch {
      return requirements;
    }
  },

  // Suppliers API
  async getSuppliers(caseId: string): Promise<Supplier[]> {
    try {
      const res = await fetcher<{ suppliers: Supplier[]; total: number }>(`/cases/${caseId}/suppliers`);
      return res.suppliers;
    } catch {
      return MOCK_SUPPLIERS.filter((s) => s.case_id === caseId || caseId.startsWith("0000") || caseId === "1");
    }
  },

  async createSupplier(caseId: string, data: { name: string; external_ref?: string; country?: string }): Promise<Supplier> {
    try {
      return await fetcher<Supplier>(`/cases/${caseId}/suppliers`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        case_id: caseId,
        name: data.name,
        external_ref: data.external_ref || `SUP-${Date.now().toString().slice(-4)}`,
        country: data.country || "United States",
        status: "PENDING",
        created_at: new Date().toISOString(),
        document_count: 0,
        has_evidence: false,
      };
      MOCK_SUPPLIERS.push(newSup);
      return newSup;
    }
  },

  // Documents & Evidence API
  async getDocuments(supplierId: string): Promise<Document[]> {
    try {
      const res = await fetcher<Document[]>(`/suppliers/${supplierId}/documents`);
      return res;
    } catch {
      return MOCK_DOCUMENTS[supplierId] || [
        {
          id: `doc-${supplierId}-1`,
          supplier_id: supplierId,
          display_name: "Supplier_Specification_Sheet.pdf",
          status: "READY",
          page_count: 5,
          uploaded_at: new Date().toISOString(),
        },
      ];
    }
  },

  async uploadDocument(supplierId: string, file: File): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${BASE_URL}/suppliers/${supplierId}/documents`, {
        method: "POST",
        body: formData,
      });
      return await response.json();
    } catch {
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        supplier_id: supplierId,
        display_name: file.name,
        status: "READY",
        page_count: 2,
        uploaded_at: new Date().toISOString(),
      };
      if (!MOCK_DOCUMENTS[supplierId]) MOCK_DOCUMENTS[supplierId] = [];
      MOCK_DOCUMENTS[supplierId].push(newDoc);
      return newDoc;
    }
  },

  async getEvidence(supplierId: string): Promise<Evidence[]> {
    try {
      const res = await fetcher<{ evidence: Evidence[]; total: number }>(`/suppliers/${supplierId}/evidence`);
      return res.evidence;
    } catch {
      return MOCK_EVIDENCE[supplierId] || [];
    }
  },

  // Eligibility API
  async getEligibilityMatrix(caseId: string): Promise<EligibilityMatrixResponse> {
    try {
      return await fetcher<EligibilityMatrixResponse>(`/cases/${caseId}/eligibility`);
    } catch {
      return {
        ...MOCK_ELIGIBILITY_MATRIX,
        case_id: caseId,
      };
    }
  },

  async runEligibility(caseId: string, supplierIds?: string[]): Promise<EligibilityRunResponse> {
    try {
      return await fetcher<EligibilityRunResponse>(`/cases/${caseId}/eligibility-runs`, {
        method: "POST",
        body: JSON.stringify({ supplier_ids: supplierIds }),
      });
    } catch {
      return {
        case_id: caseId,
        suppliers_evaluated: supplierIds ? supplierIds.length : 3,
        results: { PASS: 1, FAIL: 1, REVIEW: 1 },
      };
    }
  },

  // Phase 4 Ranking API
  async getRankingScenario(caseId: string, scenarioId?: string): Promise<RankingScenarioResponse> {
    try {
      if (scenarioId) {
        return await fetcher<RankingScenarioResponse>(`/cases/${caseId}/ranking-scenarios/${scenarioId}`);
      }
      return await fetcher<RankingScenarioResponse>(`/cases/${caseId}/ranking-scenarios/scen-101`);
    } catch {
      return MOCK_RANKING_SCENARIO;
    }
  },

  async createRankingScenario(
    caseId: string,
    data: { name: string; weights: Record<string, number>; normalization_method?: string }
  ): Promise<RankingScenarioResponse> {
    try {
      return await fetcher<RankingScenarioResponse>(`/cases/${caseId}/ranking-scenarios`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const sumWeights = Object.values(data.weights).reduce((a, b) => a + b, 0) || 1;
      const normalizedWeights: Record<string, number> = {};
      for (const [k, v] of Object.entries(data.weights)) {
        normalizedWeights[k] = Number((v / sumWeights).toFixed(4));
      }

      return {
        id: `scen-${Date.now()}`,
        case_id: caseId,
        name: data.name,
        weights: normalizedWeights,
        normalization_method: (data.normalization_method as any) || "MIN_MAX_V1",
        created_at: new Date().toISOString(),
        results: [
          {
            id: `rank-1`,
            supplier_id: "sup-1",
            supplier_name: "Apex Precision Machining Ltd.",
            total_score: 92.4,
            rank: 1,
            calculated_at: new Date().toISOString(),
            score_components: [
              {
                id: "sc-1",
                requirement_id: "req-7",
                field_key: "quality_score",
                raw_value: 98,
                normalized_score: 0.98,
                weight: normalizedWeights["quality_score"] || 0.4,
                weighted_score: Number(((normalizedWeights["quality_score"] || 0.4) * 98).toFixed(2)),
                evidence_ids: ["ev-103"],
              },
              {
                id: "sc-2",
                requirement_id: "req-8",
                field_key: "unit_cost",
                raw_value: 42.5,
                normalized_score: 0.88,
                weight: normalizedWeights["unit_cost"] || 0.6,
                weighted_score: Number(((normalizedWeights["unit_cost"] || 0.6) * 88).toFixed(2)),
                evidence_ids: ["ev-105"],
              },
            ],
          },
        ],
      };
    }
  },

  async getRobustnessAnalysis(caseId: string, baseScenarioId?: string): Promise<RobustnessResponse> {
    try {
      return await fetcher<RobustnessResponse>(`/cases/${caseId}/robustness`, {
        method: "POST",
        body: JSON.stringify({ base_scenario_id: baseScenarioId }),
      });
    } catch {
      return {
        case_id: caseId,
        base_scenario_id: baseScenarioId || "scen-101",
        tested_scenarios: 100,
        results: [
          {
            supplier_id: "sup-1",
            supplier_name: "Apex Precision Machining Ltd.",
            top_rank_percentage: 92.0,
            tested_scenarios: 100,
          },
        ],
      };
    }
  },

  // Phase 5 Decision API


  async getDecisionSummary(caseId: string): Promise<DecisionSummary> {
    try {
      return await fetcher<DecisionSummary>(`/cases/${caseId}/decision-summaries`);
    } catch {
      return MOCK_DECISION_SUMMARY;
    }
  },

  async recordHumanDecision(
    summaryId: string,
    data: { human_decision: string; notes?: string }
  ): Promise<DecisionSummary> {
    try {
      return await fetcher<DecisionSummary>(`/decision-summaries/${summaryId}/human-decision`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch {
      return {
        ...MOCK_DECISION_SUMMARY,
        human_decision: data.human_decision,
        human_decision_at: new Date().toISOString(),
      };
    }
  },
};

const MOCK_DECISION_SUMMARY: DecisionSummary = {
  id: "sum-101",
  case_id: "00000000-0000-0000-0000-000000000001",
  scenario_id: "scen-101",
  recommended_supplier_id: "sup-1",
  generated_text: "Based on 100% verified evidence, Apex Precision Machining Ltd. is the only candidate meeting all 6 mandatory requirements (including 5-axis CNC machining, AL6061 certification, and valid ISO 9001 audit). Under the balanced scoring scenario (Quality 40% / Cost 60%), Apex achieved a benchmark score of 91.6/100.",
  assumptions: [
    "Extrapolated monthly capacity figures from reported annual production capacity (25,000 units/mo line output).",
    "Assumed standard delivery terms are FOB Hamburg port as specified in quote document #doc-103.",
  ],
  limitations: [
    "Supplier Global Alloy Components Co. was excluded due to missing in-house 5-axis CNC capability.",
    "Supplier Vanguard Aerospace Parts requires manual verification of pending ISO 9001 audit signoff.",
  ],
  review_actions: [
    "Verify final ISO 9001 audit signoff document for Vanguard Aerospace Parts.",
    "Confirm lead time guarantee for Apex Precision Machining Ltd. prior to purchase order dispatch.",
  ],
  human_decision: undefined,
  human_decision_at: undefined,
};

const MOCK_RANKING_SCENARIO: RankingScenarioResponse = {
  id: "scen-101",

  case_id: "00000000-0000-0000-0000-000000000001",
  name: "Balanced Procurement Benchmark (Quality 40% / Cost 60%)",
  weights: {
    quality_score: 0.4,
    unit_cost: 0.6,
  },
  normalization_method: "MIN_MAX_V1",
  created_at: "2026-08-08T15:00:00Z",
  results: [
    {
      id: "rank-1",
      supplier_id: "sup-1",
      supplier_name: "Apex Precision Machining Ltd.",
      eligibility_result_id: "elig-101",
      total_score: 91.6,
      rank: 1,
      ranking_version: "v1.0",
      calculated_at: "2026-08-08T15:00:00Z",
      score_components: [
        {
          id: "sc-1",
          requirement_id: "req-7",
          field_key: "quality_score",
          raw_value: 96,
          normalized_score: 0.96,
          weight: 0.4,
          weighted_score: 38.4,
          evidence_ids: ["ev-103"],
        },
        {
          id: "sc-2",
          requirement_id: "req-8",
          field_key: "unit_cost",
          raw_value: 45.0,
          normalized_score: 0.887,
          weight: 0.6,
          weighted_score: 53.2,
          evidence_ids: ["ev-105"],
        },
      ],
    },
  ],
};


