"use client";

interface SensitivityControlsProps {
  weights: Record<string, number>;
  onWeightChange: (key: string, value: number) => void;
  onPresetSelect: (preset: "quality" | "cost" | "balanced") => void;
}

export function SensitivityControls({
  weights,
  onWeightChange,
  onPresetSelect,
}: SensitivityControlsProps) {
  return (
    <div className="glass-card p-6 rounded-2xl border space-y-6 shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Weight Presets & Tuning</h3>
          <p className="text-[11px] text-gray-500">Quick preset configurations</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPresetSelect("quality")}
          className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold text-xs border border-purple-200"
        >
          Quality First
        </button>
        <button
          onClick={() => onPresetSelect("cost")}
          className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold text-xs border border-indigo-200"
        >
          Cost First
        </button>
        <button
          onClick={() => onPresetSelect("balanced")}
          className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-xs border"
        >
          Balanced (50/50)
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(weights).map(([k, v]) => (
          <div key={k} className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border">
            <div className="flex justify-between text-xs font-bold">
              <span className="uppercase font-mono">{k}</span>
              <span className="font-mono text-purple-600 font-extrabold">{(v * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={v}
              onChange={(e) => onWeightChange(k, Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
