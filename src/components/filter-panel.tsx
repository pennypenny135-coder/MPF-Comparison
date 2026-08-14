"use client";

import { Search, SlidersHorizontal, X, Check } from "lucide-react";

interface FilterPanelProps {
  trustees: string[];
  fundTypes: string[];
  riskLevels: number[];
  selectedTrustees: string[];
  selectedFundTypes: string[];
  selectedRiskLevels: number[];
  searchText: string;
  onTrusteesChange: (values: string[]) => void;
  onFundTypesChange: (values: string[]) => void;
  onRiskLevelsChange: (values: number[]) => void;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

export function FilterPanel({
  trustees,
  fundTypes,
  riskLevels,
  selectedTrustees,
  selectedFundTypes,
  selectedRiskLevels,
  searchText,
  onTrusteesChange,
  onFundTypesChange,
  onRiskLevelsChange,
  onSearchChange,
  onClearAll,
  resultCount,
  totalCount,
}: FilterPanelProps) {
  const toggle = <T,>(values: T[], value: T, setter: (next: T[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const active = selectedTrustees.length > 0 || selectedFundTypes.length > 0 || selectedRiskLevels.length > 0 || searchText.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-blue-900" />
          篩選器
          {active && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">已啟用</span>}
        </div>
        <div className="text-xs text-slate-500">目前篩選後：{resultCount} / {totalCount}</div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">搜尋基金名稱／計劃／受託人</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="可輸入多個關鍵字，例如：HSBC 東亞"
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            {searchText && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                aria-label="清除搜尋"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">多個關鍵字以空格、逗號或「、」分隔，符合任何一個關鍵字即可顯示。</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">受託人／MPF 公司</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {trustees.map((trustee) => {
              const checked = selectedTrustees.includes(trustee);
              return (
                <button
                  key={trustee}
                  type="button"
                  onClick={() => toggle(selectedTrustees, trustee, onTrusteesChange)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${checked ? "bg-blue-900 text-white border-blue-900" : "border-slate-300 text-slate-600 hover:border-blue-900"}`}
                >
                  {checked && <Check className="inline w-3.5 h-3.5 mr-1" />}
                  {trustee}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">基金類別</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {fundTypes.map((type) => {
              const checked = selectedFundTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggle(selectedFundTypes, type, onFundTypesChange)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${checked ? "bg-indigo-700 text-white border-indigo-700" : "border-slate-300 text-slate-600 hover:border-indigo-700"}`}
                >
                  {checked && <Check className="inline w-3.5 h-3.5 mr-1" />}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-600">風險級別</label>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{selectedRiskLevels.length} 項已選</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onRiskLevelsChange([])} className="px-3 py-1 text-xs text-slate-600 hover:text-blue-900">全選</button>
            <button type="button" onClick={() => onRiskLevelsChange([])} className="px-3 py-1 text-xs text-slate-600 hover:text-blue-900">清除</button>
            {riskLevels.map((level) => {
              const checked = selectedRiskLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggle(selectedRiskLevels, level, onRiskLevelsChange)}
                  aria-pressed={checked}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${checked ? "bg-blue-900 text-white border-blue-900 shadow-sm ring-2 ring-blue-200" : "border-slate-300 text-slate-600 hover:border-blue-900 hover:bg-blue-50"}`}
                >
                  {checked && <Check className="inline w-3.5 h-3.5 mr-1" />}
                  Level {level}
                </button>
              );
            })}
          </div>
        </div>

        {active && (
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button type="button" onClick={onClearAll} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600">
              <X className="w-3.5 h-3.5" />清除全部篩選
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
