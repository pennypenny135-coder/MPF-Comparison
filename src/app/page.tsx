"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Upload,
  Download,
  RefreshCw,
  Database,
  AlertTriangle,
  BarChart3,
  Info,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Dataset, ReturnPeriod, ReturnMode, FundWithReturn } from "@/types/mpf";
import {
  generateDefaultPeriods,
  enrichFundsWithReturns,
  getUniqueTrustees,
  getUniqueFundTypes,
  getUniqueRiskLevels,
  getDatasetYearRange,
} from "@/lib/returns";
import {
  saveDataset,
  loadActiveDataset,
  clearActiveDataset,
  saveUIPreferences,
  loadUIPreferences,
} from "@/lib/storage";
import { parseExcelFile } from "@/lib/excel-parser";
import { FilterPanel } from "@/components/filter-panel";
import { FundTable } from "@/components/fund-table";
import { PeriodControls } from "@/components/period-controls";
import { TrusteeStatsPanel } from "@/components/trustee-stats";
import { UploadPanel } from "@/components/upload-panel";

export default function HomePage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Period & mode
  const [selectedPeriods, setSelectedPeriods] = useState<ReturnPeriod[]>([]);
  const [returnMode, setReturnMode] = useState<ReturnMode>("cumulative");

  // Filters
  const [selectedTrustees, setSelectedTrustees] = useState<string[]>([]);
  const [selectedFundTypes, setSelectedFundTypes] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");

  // ─── Load sample dataset ──────────────────────────────────────────────────
  const loadSample = useCallback(async () => {
    try {
      const res = await fetch("/sample/Fund_Information_Table_result-2.xlsx");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const result = await parseExcelFile(buf, "Fund_Information_Table_result-2.xlsx");
      if (result.dataset) {
        result.dataset.isSample = true;
        return result.dataset;
      }
    } catch (e) {
      console.error("Failed to load sample:", e);
    }
    return null;
  }, []);

  // ─── Initialize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const prefs = loadUIPreferences();
        if (prefs.returnMode) setReturnMode(prefs.returnMode);

        let ds = await loadActiveDataset();

        if (!ds) {
          ds = await loadSample();
        }

        if (ds) {
          setDataset(ds);
          const defaults = generateDefaultPeriods(ds.years);
          const periods = prefs.selectedPeriods.length > 0
            ? prefs.selectedPeriods
                .map((p) => ({
                  ...p,
                  label: `${p.startYear === p.endYear ? p.startYear + " 年" : p.startYear + "–" + p.endYear + "（" + (p.endYear - p.startYear + 1) + " 年）"}`,
                }))
                .filter(
                  (p) => ds!.years.includes(p.startYear) && ds!.years.includes(p.endYear)
                )
            : defaults.slice(0, 4);
          setSelectedPeriods(periods.length > 0 ? periods : defaults.slice(0, 4));

          if (prefs.selectedTrustees.length > 0) setSelectedTrustees(prefs.selectedTrustees);
          if (prefs.selectedFundTypes.length > 0) setSelectedFundTypes(prefs.selectedFundTypes);
          if (prefs.selectedRiskLevels.length > 0) setSelectedRiskLevels(prefs.selectedRiskLevels);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadSample]);

  // ─── Handle confirm upload ────────────────────────────────────────────────
  const handleConfirmUpload = async (newDataset: Dataset) => {
    try {
      await saveDataset(newDataset);
      setDataset(newDataset);
      const defaults = generateDefaultPeriods(newDataset.years);
      setSelectedPeriods(defaults.slice(0, 4));
      setSelectedTrustees([]);
      setSelectedFundTypes([]);
      setSelectedRiskLevels([]);
      setSearchText("");
      setShowUpload(false);
      toast.success(`已載入「${newDataset.fileName}」，共 ${newDataset.rowCount} 隻基金`);
    } catch (e) {
      toast.error(`儲存失敗：${e instanceof Error ? e.message : "未知錯誤"}`);
    }
  };

  // ─── Clear data ───────────────────────────────────────────────────────────
  const handleClear = async () => {
    await clearActiveDataset();
    const sampleDs = await loadSample();
    if (sampleDs) {
      setDataset(sampleDs);
      const defaults = generateDefaultPeriods(sampleDs.years);
      setSelectedPeriods(defaults.slice(0, 4));
    } else {
      setDataset(null);
      setSelectedPeriods([]);
    }
    setSelectedTrustees([]);
    setSelectedFundTypes([]);
    setSelectedRiskLevels([]);
    setSearchText("");
    toast.info("已恢復 Sample 資料");
  };

  // ─── Persist prefs ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      saveUIPreferences({
        selectedPeriods: selectedPeriods.map((p) => ({
          startYear: p.startYear,
          endYear: p.endYear,
        })),
        selectedTrustees,
        selectedFundTypes,
        selectedRiskLevels,
        returnMode,
      });
    }
  }, [selectedPeriods, selectedTrustees, selectedFundTypes, selectedRiskLevels, returnMode, isLoading]);

  // ─── Computed values ──────────────────────────────────────────────────────
  const allTrustees = useMemo(
    () => (dataset ? getUniqueTrustees(dataset) : []),
    [dataset]
  );
  const allFundTypes = useMemo(
    () => (dataset ? getUniqueFundTypes(dataset) : []),
    [dataset]
  );
  const allRiskLevels = useMemo(
    () => (dataset ? getUniqueRiskLevels(dataset) : []),
    [dataset]
  );

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

  const sortedFunds: FundWithReturn[] = useMemo(() => {
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

  const handleClearFilters = () => {
    setSelectedTrustees([]);
    setSelectedFundTypes([]);
    setSelectedRiskLevels([]);
    setSearchText("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mb-3" />
          <p className="text-slate-600">載入 MPF 資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster richColors position="top-right" />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">MPF 基金回報分析器</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                資料由 Excel 上傳，年份會自動辨識
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              <a
                href="/about"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <Info className="w-4 h-4" />
                關於
              </a>
              <a
                href="/stats"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                統計頁
              </a>
              <a
                href="/sample/Fund_Information_Table_result-2.xlsx"
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                下載 Sample Excel
              </a>
              {dataset && !dataset.isSample && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  恢復 Sample
                </button>
              )}
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-900 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors shadow"
              >
                <Upload className="w-4 h-4" />
                上傳 Excel
              </button>
            </nav>
          </div>

          {/* Dataset info */}
          {dataset && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  dataset.isSample
                    ? "bg-amber-400/20 text-amber-200"
                    : "bg-emerald-400/20 text-emerald-200"
                }`}
              >
                {dataset.isSample ? "📋 Sample data" : "📤 User uploaded data"}
              </span>
              <span className="text-blue-200 text-xs">
                {dataset.fileName}
              </span>
              <span className="text-blue-300 text-xs">
                {new Date(dataset.uploadedAt).toLocaleString("zh-HK")}
              </span>
              <span className="text-blue-200 text-xs">
                {dataset.rowCount} 筆資料・{dataset.years.length} 個年份（{getDatasetYearRange(dataset)}）
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ─── Sample download hint ─────────────────────────────────────── */}
      {dataset?.isSample && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-amber-700 text-sm">
              目前顯示 <strong>Sample 資料</strong>。請先下載 Sample 查看欄位格式，再上傳你自己的 Excel。
            </p>
            <a
              href="/sample/Fund_Information_Table_result-2.xlsx"
              download
              className="ml-auto text-sm text-amber-700 underline hover:text-amber-900"
            >
              下載 Sample Excel →
            </a>
          </div>
        </div>
      )}

      {/* ─── Main ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {!dataset ? (
          <div className="text-center py-20">
            <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">尚未載入資料</h2>
            <p className="text-slate-500 mb-6">請先上傳 Excel 檔案，或下載 Sample 查看格式</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
              >
                <Upload className="w-5 h-5" />
                上傳 Excel
              </button>
              <a
                href="/sample/Fund_Information_Table_result-2.xlsx"
                download
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                下載 Sample Excel
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard
                label="基金總數"
                value={dataset.rowCount.toString()}
                sub="隻基金"
              />
              <KPICard
                label="年份數量"
                value={dataset.years.length.toString()}
                sub={getDatasetYearRange(dataset)}
              />
              <KPICard
                label="最新年份"
                value={Math.max(...dataset.years).toString()}
                sub="年"
              />
              <KPICard
                label="受託人數量"
                value={allTrustees.length.toString()}
                sub="間機構"
              />
            </div>

            {/* Period Controls */}
            <PeriodControls
              availableYears={dataset.years}
              selectedPeriods={selectedPeriods}
              returnMode={returnMode}
              onPeriodsChange={setSelectedPeriods}
              onReturnModeChange={setReturnMode}
            />

            {selectedPeriods.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm">請選擇至少一個年份期間以查看回報</p>
              </div>
            )}

            {/* Filter & Table */}
            {selectedPeriods.length > 0 && (
              <>
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
                  onClearAll={handleClearFilters}
                  resultCount={filteredRecords.length}
                  totalCount={dataset.rowCount}
                />

                {/* Stats toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowStats((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showStats
                        ? "bg-blue-900 text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    MPF 公司 Top N 統計
                    {showStats ? (
                      <X className="w-3.5 h-3.5" />
                    ) : null}
                  </button>
                </div>

                {/* Stats panel */}
                {showStats && primaryPeriod && (
                  <TrusteeStatsPanel
                    funds={sortedFunds}
                    period={primaryPeriod}
                    returnMode={returnMode}
                    isFiltered={isFiltered}
                  />
                )}

                {/* Fund Table */}
                <FundTable
                  funds={sortedFunds}
                  periods={selectedPeriods}
                  returnMode={returnMode}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Upload modal */}
      {showUpload && (
        <UploadPanel
          onConfirm={handleConfirmUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-blue-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
