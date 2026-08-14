"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import type { FundWithReturn, ReturnPeriod, ReturnMode } from "@/types/mpf";
import { exportFundResultsCSV } from "@/lib/csv-export";
import { periodKey } from "@/lib/returns";

interface FundTableProps {
  funds: FundWithReturn[];
  periods: ReturnPeriod[];
  returnMode: ReturnMode;
}

type SortKey =
  | "rank"
  | "trustee"
  | "scheme"
  | "fundName"
  | "fundType"
  | "riskLevel"
  | "fundSizeMillion"
  | "fer"
  | "periodReturn"
  | string;

type SortDir = "asc" | "desc";

function ReturnCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <span className="text-slate-400 cursor-help" title="期間資料不完整">
        —
      </span>
    );
  }
  const pct = value.toFixed(2);
  if (value > 0) {
    return <span className="text-emerald-600 font-medium">+{pct}%</span>;
  }
  if (value < 0) {
    return <span className="text-red-600 font-medium">{pct}%</span>;
  }
  return <span className="text-slate-500">{pct}%</span>;
}

function SortIcon({
  column,
  current,
  dir,
}: {
  column: SortKey;
  current: SortKey;
  dir: SortDir;
}) {
  if (column !== current) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1" />;
  if (dir === "asc") return <ArrowUp className="w-3 h-3 text-blue-900 inline ml-1" />;
  return <ArrowDown className="w-3 h-3 text-blue-900 inline ml-1" />;
}

export function FundTable({ funds, periods, returnMode }: FundTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("periodReturn");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const activePeriods = periods.length > 0 ? periods : [];
  const primaryKey = activePeriods[0] ? periodKey(activePeriods[0]) : null;

  const getPeriodValue = (fund: FundWithReturn, key: string): number | null => {
    const value = fund.returnsByPeriod?.[key];
    return value === undefined ? null : value;
  };

  const sorted = useMemo(() => {
    return [...funds].sort((a, b) => {
      let aVal: number | string | null = null;
      let bVal: number | string | null = null;

      if (activePeriods.some((p) => periodKey(p) === sortKey)) {
        aVal = getPeriodValue(a, sortKey);
        bVal = getPeriodValue(b, sortKey);
      } else {
        switch (sortKey) {
          case "rank":
            return 0;
          case "trustee":
            aVal = a.trustee ?? "";
            bVal = b.trustee ?? "";
            break;
          case "scheme":
            aVal = a.scheme ?? "";
            bVal = b.scheme ?? "";
            break;
          case "fundName":
            aVal = a.fundName ?? "";
            bVal = b.fundName ?? "";
            break;
          case "fundType":
            aVal = a.fundType ?? "";
            bVal = b.fundType ?? "";
            break;
          case "riskLevel":
            aVal = a.riskLevel;
            bVal = b.riskLevel;
            break;
          case "fundSizeMillion":
            aVal = a.fundSizeMillion;
            bVal = b.fundSizeMillion;
            break;
          case "fer":
            aVal = a.fer;
            bVal = b.fer;
            break;
          case "periodReturn":
          default:
            aVal = primaryKey ? getPeriodValue(a, primaryKey) : a.periodReturn;
            bVal = primaryKey ? getPeriodValue(b, primaryKey) : b.periodReturn;
            break;
        }
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal, "zh-HK");
        return sortDir === "asc" ? cmp : -cmp;
      }

      const an = aVal as number;
      const bn = bVal as number;
      return sortDir === "asc" ? an - bn : bn - an;
    });
  }, [funds, sortKey, sortDir, activePeriods, primaryKey]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "periodReturn" || key === "fundSizeMillion" ? "desc" : "asc");
    }
    setPage(0);
  };

  const handlePageSize = (ps: number) => {
    setPageSize(ps);
    setPage(0);
  };

  const handleExportCSV = () => {
    exportFundResultsCSV(sorted, activePeriods);
  };

  const Th = ({
    label,
    sk,
    right,
  }: {
    label: string;
    sk: SortKey;
    right?: boolean;
  }) => (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors ${right ? "text-right" : "text-left"}`}
      onClick={() => handleSort(sk)}
    >
      <span className={`inline-flex items-center gap-0.5 ${right ? "flex-row-reverse" : ""}`}>
        {label}
        <SortIcon column={sk} current={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">每頁顯示</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            {[25, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} 筆
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">共 {funds.length} 隻基金</span>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          下載基金回報 CSV（全部年份）
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide text-left w-12">
                #
              </th>
              <Th label="受託人" sk="trustee" />
              <Th label="計劃" sk="scheme" />
              <Th label="成分基金" sk="fundName" />
              <Th label="基金類別" sk="fundType" />
              <Th label="風險" sk="riskLevel" right />
              <Th label="規模(M)" sk="fundSizeMillion" right />
              <Th label="FER(%)" sk="fer" right />
              {activePeriods.map((period) => (
                <th
                  key={periodKey(period)}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort(periodKey(period))}
                >
                  <span className="inline-flex items-center flex-row-reverse gap-0.5">
                    <SortIcon column={periodKey(period)} current={sortKey} dir={sortDir} />
                    <span className="text-right">
                      {returnMode === "annualized" ? "年化" : "累積"}回報
                      <br />
                      <span className="text-slate-400 font-normal normal-case">
                        {period.label}
                      </span>
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8 + activePeriods.length} className="px-4 py-8 text-center text-slate-400">
                  暫無符合條件的基金
                </td>
              </tr>
            ) : (
              paginated.map((fund, idx) => {
                const globalIdx = page * pageSize + idx;
                return (
                  <tr
                    key={fund.id}
                    className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400 text-sm">{globalIdx + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-800 text-sm">{fund.trustee || "—"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-700 text-sm">{fund.scheme || "—"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-800 text-sm">{fund.fundName}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-600 text-sm">{fund.fundType || "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-slate-600 text-sm">
                        {fund.riskLevel !== null ? `L${fund.riskLevel}` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-slate-600 text-sm">
                        {fund.fundSizeMillion !== null
                          ? new Intl.NumberFormat("zh-HK", { maximumFractionDigits: 0 }).format(fund.fundSizeMillion)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-slate-600 text-sm">
                        {fund.fer !== null ? `${fund.fer.toFixed(2)}%` : "—"}
                      </span>
                    </td>
                    {activePeriods.map((period) => (
                      <td key={periodKey(period)} className="px-3 py-2 text-right">
                        <ReturnCell value={getPeriodValue(fund, periodKey(period))} />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
        <div className="text-sm text-slate-500">
          第 {page + 1} 頁，共 {totalPages} 頁
        </div>
        <div className="flex items-center gap-1">
          <PageBtn onClick={() => setPage(0)} disabled={page === 0}>«</PageBtn>
          <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 0}>‹</PageBtn>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i;
            else if (page < 3) p = i;
            else if (page > totalPages - 4) p = totalPages - 5 + i;
            else p = page - 2 + i;
            return (
              <PageBtn key={p} onClick={() => setPage(p)} active={p === page}>
                {p + 1}
              </PageBtn>
            );
          })}
          <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>›</PageBtn>
          <PageBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</PageBtn>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-8 h-8 px-2 rounded text-sm transition-colors ${
        active
          ? "bg-blue-900 text-white"
          : disabled
          ? "text-slate-300 cursor-not-allowed"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
