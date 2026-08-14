"use client";

import { useState } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import type { ReturnPeriod, ReturnMode } from "@/types/mpf";
import { buildPeriodLabel, generateDefaultPeriods } from "@/lib/returns";

interface PeriodControlsProps {
  availableYears: number[];
  selectedPeriods: ReturnPeriod[];
  returnMode: ReturnMode;
  onPeriodsChange: (periods: ReturnPeriod[]) => void;
  onReturnModeChange: (mode: ReturnMode) => void;
}

export function PeriodControls({
  availableYears,
  selectedPeriods,
  returnMode,
  onPeriodsChange,
  onReturnModeChange,
}: PeriodControlsProps) {
  const sortedYears = [...availableYears].sort((a, b) => a - b);
  const minYear = sortedYears[0];
  const maxYear = sortedYears[sortedYears.length - 1];

  const [startYear, setStartYear] = useState<number>(minYear ?? 0);
  const [endYear, setEndYear] = useState<number>(maxYear ?? 0);
  const [addError, setAddError] = useState<string | null>(null);

  const addPeriod = () => {
    if (startYear > endYear) {
      setAddError("起始年份不可大於結束年份");
      return;
    }
    if (!availableYears.includes(startYear)) {
      setAddError(`年份 ${startYear} 不存在於目前資料`);
      return;
    }
    if (!availableYears.includes(endYear)) {
      setAddError(`年份 ${endYear} 不存在於目前資料`);
      return;
    }

    // Check all years in range are available
    const missingYears: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      if (!availableYears.includes(y)) missingYears.push(y);
    }
    if (missingYears.length > 0) {
      setAddError(`資料中缺少年份：${missingYears.join("、")}，無法計算該期間累積回報`);
      return;
    }

    // Check duplicate
    const isDuplicate = selectedPeriods.some(
      (p) => p.startYear === startYear && p.endYear === endYear
    );
    if (isDuplicate) {
      setAddError("此期間已經存在");
      return;
    }

    setAddError(null);
    const label = buildPeriodLabel(startYear, endYear);
    onPeriodsChange([...selectedPeriods, { startYear, endYear, label }]);
  };

  const removePeriod = (idx: number) => {
    onPeriodsChange(selectedPeriods.filter((_, i) => i !== idx));
  };

  const resetDefaults = () => {
    const defaults = generateDefaultPeriods(availableYears);
    onPeriodsChange(defaults.slice(0, 4));
    setAddError(null);
  };

  if (availableYears.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
        尚未載入任何年份資料
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-slate-800">年份期間設定</h3>
        <div className="flex items-center gap-2">
          {/* Return mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => onReturnModeChange("cumulative")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                returnMode === "cumulative"
                  ? "bg-white text-blue-900 font-semibold shadow-sm"
                  : "text-slate-500"
              }`}
            >
              累積回報
            </button>
            <button
              onClick={() => onReturnModeChange("annualized")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                returnMode === "annualized"
                  ? "bg-white text-blue-900 font-semibold shadow-sm"
                  : "text-slate-500"
              }`}
            >
              年化回報
            </button>
          </div>
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重設預設
          </button>
        </div>
      </div>

      {/* Selected periods chips */}
      {selectedPeriods.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedPeriods.map((p, idx) => (
            <div
              key={`${p.startYear}-${p.endYear}`}
              className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-1.5 rounded-full text-sm"
            >
              <span>{p.label}</span>
              <button
                onClick={() => removePeriod(idx)}
                className="hover:text-blue-200 transition-colors"
                aria-label={`移除 ${p.label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedPeriods.length === 0 && (
        <p className="text-sm text-slate-400 mb-4">尚未選擇任何期間，請新增期間或重設預設</p>
      )}

      {/* Add period */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">起始年份</label>
          <select
            value={startYear}
            onChange={(e) => {
              setStartYear(Number(e.target.value));
              setAddError(null);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            {sortedYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="pb-2 text-slate-400">至</div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">結束年份</label>
          <select
            value={endYear}
            onChange={(e) => {
              setEndYear(Number(e.target.value));
              setAddError(null);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            {sortedYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addPeriod}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          新增期間
        </button>
      </div>

      {addError && (
        <p className="text-red-600 text-xs mt-2">{addError}</p>
      )}

      {/* Available years info */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {sortedYears.map((y) => (
          <span
            key={y}
            className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
          >
            {y}
          </span>
        ))}
        <span className="text-xs text-slate-400 ml-1">（資料中可用年份）</span>
      </div>
    </div>
  );
}
