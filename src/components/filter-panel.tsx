"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";

interface FilterPanelProps {
  trustees: string[];
  fundTypes: string[];
  riskLevels: number[];
  selectedTrustees: string[];
  selectedFundTypes: string[];
  selectedRiskLevels: number[];
  searchText: string;
  onTrusteesChange: (trustees: string[]) => void;
  onFundTypesChange: (types: string[]) => void;
  onRiskLevelsChange: (levels: number[]) => void;
  onSearchChange: (text: string) => void;
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
  const [expandedSection, setExpandedSection] = useState<string | null>("trustee");

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const toggleTrustee = (t: string) => {
    if (selectedTrustees.includes(t)) {
      onTrusteesChange(selectedTrustees.filter((x) => x !== t));
    } else {
      onTrusteesChange([...selectedTrustees, t]);
    }
  };

  const toggleFundType = (ft: string) => {
    if (selectedFundTypes.includes(ft)) {
      onFundTypesChange(selectedFundTypes.filter((x) => x !== ft));
    } else {
      onFundTypesChange([...selectedFundTypes, ft]);
    }
  };

  const toggleRiskLevel = (rl: number) => {
    if (selectedRiskLevels.includes(rl)) {
      onRiskLevelsChange(selectedRiskLevels.filter((x) => x !== rl));
    } else {
      onRiskLevelsChange([...selectedRiskLevels, rl]);
    }
  };

  const hasFilters =
    selectedTrustees.length > 0 ||
    selectedFundTypes.length > 0 ||
    selectedRiskLevels.length > 0 ||
    searchText.trim() !== "";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-900" />
          <span className="font-semibold text-slate-800">篩選器</span>
          {hasFilters && (
            <span className="bg-blue-900 text-white text-xs px-2 py-0.5 rounded-full">
              已啟用
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            目前篩選後：
            <span className="font-semibold text-blue-900">{resultCount}</span>
            {" "}隻基金（共 {totalCount} 隻）
          </span>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              清除全部
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            搜尋基金名稱／計劃／受託人
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="輸入關鍵字..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
        </div>

        {/* Trustee Filter */}
        <div className="border border-slate-200 rounded-lg">
          <button
            onClick={() => toggleSection("trustee")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span>
              受託人／MPF 公司
              {selectedTrustees.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                  {selectedTrustees.length}
                </span>
              )}
            </span>
            {expandedSection === "trustee" ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSection === "trustee" && (
            <div className="px-3 pb-3 border-t border-slate-100">
              <div className="flex gap-2 my-2">
                <button
                  onClick={() => onTrusteesChange([...trustees])}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  全選
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => onTrusteesChange([])}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  清除
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {trustees.map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTrustees.includes(t)}
                      onChange={() => toggleTrustee(t)}
                      className="rounded border-slate-300 text-blue-900"
                    />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fund Type Filter */}
        <div className="border border-slate-200 rounded-lg">
          <button
            onClick={() => toggleSection("fundType")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span>
              基金類別
              {selectedFundTypes.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                  {selectedFundTypes.length}
                </span>
              )}
            </span>
            {expandedSection === "fundType" ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSection === "fundType" && (
            <div className="px-3 pb-3 border-t border-slate-100">
              <div className="flex gap-2 my-2">
                <button
                  onClick={() => onFundTypesChange([...fundTypes])}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  全選
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => onFundTypesChange([])}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  清除
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {fundTypes.map((ft) => (
                  <label
                    key={ft}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFundTypes.includes(ft)}
                      onChange={() => toggleFundType(ft)}
                      className="rounded border-slate-300 text-blue-900"
                    />
                    <span className="text-sm text-slate-700">{ft}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Level Filter */}
        {riskLevels.length > 0 && (
          <div className="border border-slate-200 rounded-lg">
            <button
              onClick={() => toggleSection("risk")}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>
                風險級別
                {selectedRiskLevels.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                    {selectedRiskLevels.length}
                  </span>
                )}
              </span>
              {expandedSection === "risk" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === "risk" && (
              <div className="px-3 pb-3 border-t border-slate-100">
                <div className="flex gap-2 my-2">
                  <button
                    onClick={() => onRiskLevelsChange([...riskLevels])}
                    className="text-xs text-blue-700 hover:text-blue-900"
                  >
                    全選
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => onRiskLevelsChange([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    清除
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {riskLevels.map((rl) => (
                    <button
                      key={rl}
                      onClick={() => toggleRiskLevel(rl)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedRiskLevels.includes(rl)
                          ? "bg-blue-900 text-white border-blue-900"
                          : "border-slate-300 text-slate-600 hover:border-blue-900"
                      }`}
                    >
                      Level {rl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
