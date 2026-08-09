"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Requirement, RequirementKind, ValueType, Operator, Direction } from "@/lib/types";

export default function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<RequirementKind>("MANDATORY");
  const [valueType, setValueType] = useState<ValueType>("BOOLEAN");
  const [operator, setOperator] = useState<Operator>("EQ");
  const [targetValue, setTargetValue] = useState("true");
  const [unit, setUnit] = useState("");
  const [weight, setWeight] = useState(0.5);
  const [direction, setDirection] = useState<Direction>("HIGHER_IS_BETTER");
  const [notes, setNotes] = useState("");

  const loadRequirements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRequirements(id);
      setRequirements(data);
    } catch (err) {
      console.error("Failed to load requirements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, [id]);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;

    const newReq: Requirement = {
      id: `req-${Date.now()}`,
      case_id: id,
      key: key.trim().toLowerCase().replace(/\s+/g, "_"),
      label: label.trim(),
      kind,
      value_type: valueType,
      operator: kind === "MANDATORY" ? operator : undefined,
      target_value: kind === "MANDATORY" ? (valueType === "NUMBER" ? Number(targetValue) : targetValue === "true") : undefined,
      unit: unit.trim() || undefined,
      weight: kind === "PREFERENCE" ? Number(weight) : undefined,
      direction: kind === "PREFERENCE" ? direction : undefined,
      notes: notes.trim() || undefined,
    };

    const updated = [...requirements, newReq];
    try {
      await api.updateRequirements(id, updated);
      setRequirements(updated);
      setShowAddModal(false);
      // Reset form
      setKey("");
      setLabel("");
      setNotes("");
    } catch (err) {
      alert("Failed to update requirements schema");
    }
  };

  const mandatoryReqs = requirements.filter((r) => r.kind === "MANDATORY");
  const preferenceReqs = requirements.filter((r) => r.kind === "PREFERENCE");
  const totalWeight = preferenceReqs.reduce((sum, r) => sum + (r.weight || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Banner & Action */}
      <div className="glass-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Evaluation Requirements Schema
            <span className="text-xs font-mono font-normal text-gray-500">
              ({requirements.length} total fields)
            </span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
            Mandatory requirements define PASS/FAIL eligibility criteria in Phase 3. Preference requirements define scoring weights for Phase 4 ranking scenarios.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Requirement
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading requirements schema...</div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: MANDATORY REQUIREMENTS */}
          <div className="glass-card rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Mandatory Requirements ({mandatoryReqs.length})
                  </h3>
                  <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium">
                    Strict pass/fail criteria evaluated deterministically by Phase 3 Eligibility Engine.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                Phase 3 Gate Criteria
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="text-[11px] uppercase tracking-wider bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">Requirement Label</th>
                    <th scope="col" className="px-6 py-4 font-bold">Field Key</th>
                    <th scope="col" className="px-6 py-4 font-bold">Data Type</th>
                    <th scope="col" className="px-6 py-4 font-bold">Target Rule / Constraint</th>
                    <th scope="col" className="px-6 py-4 font-bold">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {mandatoryReqs.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {req.label}
                      </td>
                      <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                        {req.key}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono font-semibold">
                          {req.value_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg">
                          {req.operator || "EQ"} {String(req.target_value)} {req.unit || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {req.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: PREFERENCE REQUIREMENTS */}
          <div className="glass-card rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-purple-100 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Preference Requirements ({preferenceReqs.length})
                  </h3>
                  <p className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                    Weighted scoring parameters reserved for Phase 4 multi-criteria ranking.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                Sum Weight: {(totalWeight * 100).toFixed(0)}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="text-[11px] uppercase tracking-wider bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">Preference Label</th>
                    <th scope="col" className="px-6 py-4 font-bold">Field Key</th>
                    <th scope="col" className="px-6 py-4 font-bold">Weighting Ratio</th>
                    <th scope="col" className="px-6 py-4 font-bold">Optimization Direction</th>
                    <th scope="col" className="px-6 py-4 font-bold">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {preferenceReqs.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {req.label}
                      </td>
                      <td className="px-6 py-4 font-mono text-purple-600 dark:text-purple-400 font-medium">
                        {req.key}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                            {req.weight !== undefined ? (req.weight * 100).toFixed(0) + "%" : "N/A"}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full bg-purple-600"
                              style={{ width: `${(req.weight || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          req.direction === "HIGHER_IS_BETTER"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {req.direction === "HIGHER_IS_BETTER" ? "Maximize (Higher is Better)" : "Minimize (Lower is Better)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        {req.unit || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Requirement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full shadow-2xl p-6 z-10 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Add Requirement Field</h3>
            <p className="text-xs text-gray-500 mb-6">Configure a mandatory constraint or ranking preference rule.</p>

            <form onSubmit={handleAddRequirement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ISO 14001 Cert"
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value);
                      if (!key) setKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Field Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iso_14001"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Kind
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as RequirementKind)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  >
                    <option value="MANDATORY">MANDATORY (Pass/Fail Gate)</option>
                    <option value="PREFERENCE">PREFERENCE (Scoring Weight)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Value Type
                  </label>
                  <select
                    value={valueType}
                    onChange={(e) => setValueType(e.target.value as ValueType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  >
                    <option value="BOOLEAN">BOOLEAN (True/False)</option>
                    <option value="NUMBER">NUMBER (Numeric)</option>
                    <option value="STRING">STRING (Text)</option>
                    <option value="DATE">DATE (Temporal)</option>
                  </select>
                </div>
              </div>

              {kind === "MANDATORY" ? (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Operator</label>
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value as Operator)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                    >
                      <option value="EQ">EQ (=)</option>
                      <option value="NE">NE (!=)</option>
                      <option value="GTE">GTE (&gt;=)</option>
                      <option value="GT">GT (&gt;)</option>
                      <option value="LTE">LTE (&lt;=)</option>
                      <option value="LT">LT (&lt;)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Target Value</label>
                    <input
                      type="text"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. units, days"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Weight Ratio (0-1)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Direction</label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as Direction)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                    >
                      <option value="HIGHER_IS_BETTER">HIGHER IS BETTER</option>
                      <option value="LOWER_IS_BETTER">LOWER IS BETTER</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Audit Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verify certificate serial number on page 1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
