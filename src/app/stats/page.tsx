"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import { Toaster } from "sonner";
import type { Dataset, ReturnPeriod, ReturnMode, FundWithReturn } from "@/types/mpf";
import {
  generateDefaultPeriods,
  enrichFundsWithReturns,
  getUniqueTrustees,
  getUniqueFundTypes,
  getUniqueRiskLevels,
} from "@/lib/returns";
import { loadActiveDataset } from "@/lib/storage";
import { parseExcelFile } from "@/lib/excel-parser";
import { FilterPanel } from "@/components/filter-panel";
import { PeriodControls } from "@/components/period-controls";
import { TrusteeStatsPanel } from "@/components/trustee-stats";

export default function StatsPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPeriods, setSelectedPeriods] = useState<ReturnPeriod[]>([]);
  const [returnMode, setReturnMode] = useState<ReturnMode>("cumulative");

  const [selectedTrustees, setSelectedTrustees] = useState<string[]>([]);
  const [selectedFundTypes, setSelectedFundTypes] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        let ds = await loadActiveDataset();
        if (!ds) {
          // Load sample
          const res = await fetch("/sample/Fund_Information_Table_result-2.xlsx");
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const result = await parseExcelFile(buf, "Fund_Information_Table_result-2.xlsx");
            if (result.dataset) {
              result.dataset.isSample = true;
              ds = result.dataset;
            }
          }
        }
        if (ds) {
          setDataset(ds);
          const defaults = generateDefaultPeriods(ds.years);
          setSelectedPeriods(defaults.slice(0, 4));
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const allTrustees = useMemo(() => (dataset ? getUniqueTrustees(dataset) : []), [dataset]);
  const allFundTypes = useMemo(() => (dataset ? getUniqueFundTypes(dataset) : []), [dataset]);
  const allRiskLevels = useMemo(() => (dataset ? getUniqueRiskLevels(dataset) : []), [dataset]);

  const primaryPeriod: ReturnPeriod | undefined = selectedPeriods[0];

  const filteredRecords = useMemo(() => {
    if (!dataset) return [];
    return dataset.records.filter((r) => {
      if (selectedTrustees.length > 0 && !selectedTrustees.includes(r.trustee)) return false;
      if (selectedFundTypes.length > 0 && !selectedFundTypes.includes(r.fundType)) return false;
      if (selectedRiskLevels.length > 0 && r.riskLevel !== null && !selectedRiskLevels.includes(r.riskLevel)) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        return (
          r.fundName.toLowerCase().includes(q) ||
          r.scheme.toLowerCase().includes(q) ||
          r.trustee.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dataset, selectedTrustees, selectedFundTypes, selectedRiskLevels, searchText]);

  const fundsWithReturn: FundWithReturn[] = useMemo(() => {
    if (!primaryPeriod) return [];
    return enrichFundsWithReturns(filteredRecords, primaryPeriod, returnMode);
  }, [filteredRecords, primaryPeriod, returnMode]);

  const sortedFunds = useMemo(() => {
    return [...fundsWithReturn].sort((a, b) => {
      if (a.periodReturn === null && b.periodReturn === null) return 0;
      if (a.periodReturn === null) return 1;
      if (b.periodReturn === null) return -1;
      return b.periodReturn - a.periodReturn;
    });
  }, [fundsWithReturn]);

  const isFiltered =
    selectedTrustees.length > 0 ||
    selectedFundTypes.length > 0 ||
    selectedRiskLevels.length > 0 ||
    searchText.trim() !== "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mb-3" />
          <p className="text-slate-600">載入資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主頁
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h1 className="text-lg font-bold">MPF 公司 Top N 統計</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {!dataset ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">尚未載入資料</h2>
            <p className="text-slate-500 mb-6">請先到主頁上傳 Excel 檔案</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回主頁
            </Link>
          </div>
        ) : (
          <>
            {/* Dataset badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  dataset.isSample
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {dataset.isSample ? "📋 Sample data" : "📤 User uploaded data"}
              </span>
              <span className="text-slate-500 text-sm">{dataset.fileName}</span>
              <span className="text-slate-400 text-sm">・{dataset.rowCount} 隻基金</span>
            </div>

            {/* Period Controls */}
            <PeriodControls
              availableYears={dataset.years}
              selectedPeriods={selectedPeriods}
              returnMode={returnMode}
              onPeriodsChange={setSelectedPeriods}
              onReturnModeChange={setReturnMode}
            />

            {/* Filters */}
            <FilterPanel
              trustees={allTrustees}
              fundTypes={allFundTypes}
              riskLevels={allRiskLevels}
              selectedTrustees={selectedTrustees}
              selectedFundTypes={selectedFundTypes}
              selectedRiskLevels={selectedRiskLevels}
              searchText={searchText}
              onTrusteesChange={setSelectedTrustees}
              onFundTypesChange={setSelectedFundTypes}
              onRiskLevelsChange={setSelectedRiskLevels}
              onSearchChange={setSearchText}
              onClearAll={() => {
                setSelectedTrustees([]);
                setSelectedFundTypes([]);
                setSelectedRiskLevels([]);
                setSearchText("");
              }}
              resultCount={filteredRecords.length}
              totalCount={dataset.rowCount}
            />

            {/* Stats */}
            {primaryPeriod ? (
              <TrusteeStatsPanel
                funds={sortedFunds}
                period={primaryPeriod}
                returnMode={returnMode}
                isFiltered={isFiltered}
              />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-6 text-center text-amber-700">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>請先選擇至少一個年份期間</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
