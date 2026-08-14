"use client";

import React, { useState } from "react";
import { Download, Trophy } from "lucide-react";
import type { FundWithReturn, ReturnPeriod, ReturnMode } from "@/types/mpf";
import { computeTrusteeStats } from "@/lib/returns";
import { exportTrusteeStatsCSV } from "@/lib/csv-export";

interface TrusteeStatsProps {
  funds: FundWithReturn[];
  period: ReturnPeriod;
  returnMode: ReturnMode;
  isFiltered: boolean;
}

const QUICK_N = [10, 20, 30, 50, 100];

export function TrusteeStatsPanel({
  funds,
  period,
  returnMode,
  isFiltered,
}: TrusteeStatsProps) {
  const [topN, setTopN] = useState(20);
  const [topNInput, setTopNInput] = useState("20");
  const [expandedTrustee, setExpandedTrustee] = useState<string | null>(null);

  const stats = computeTrusteeStats(funds, topN);
  const activeStats = stats.filter((s) => s.topNCount > 0);
  const eligibleCount = funds.filter(
    (f) => f.periodReturn !== null && Number.isFinite(f.periodReturn)
  ).length;
  const actualTopN = Math.min(topN, eligibleCount);

  const handleTopNInput = (val: string) => {
    setTopNInput(val);
    const n = parseInt(val, 10);
    if (Number.isFinite(n) && n > 0) {
      setTopN(n);
    }
  };

  const handleExportCSV = () => {
    exportTrusteeStatsCSV(stats, topN, period);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-800">
                Top {topN} 高回報基金的 MPF 公司分佈
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {period.label}・{returnMode === "annualized" ? "年化" : "累積"}回報・共{" "}
              {eligibleCount} 隻有效基金（實際 Top {actualTopN}）
              {isFiltered && (
                <span className="ml-1 text-amber-600">・依目前篩選結果計算</span>
              )}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下載統計 CSV
          </button>
        </div>

        {/* Top N controls */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-slate-600">Top N：</span>
          {QUICK_N.map((n) => (
            <button
              key={n}
              onClick={() => {
                setTopN(n);
                setTopNInput(String(n));
              }}
              className={`px-2.5 py-1 rounded text-sm border transition-colors ${
                topN === n
                  ? "bg-blue-900 text-white border-blue-900"
                  : "border-slate-300 text-slate-600 hover:border-blue-900"
              }`}
            >
              {n}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-sm text-slate-500">自訂：</span>
            <input
              type="number"
              value={topNInput}
              onChange={(e) => handleTopNInput(e.target.value)}
              min={1}
              max={1000}
              className="border border-slate-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700">
          此統計按基金數量計算，不是按基金資產規模計算。同一基金的 A／B／T／I
          單位會各自視為一隻記錄，因為 Excel 中是獨立列。
        </p>
      </div>

      {/* Stats Table */}
      {activeStats.length === 0 ? (
        <div className="px-4 py-8 text-center text-slate-400">
          沒有符合條件的有效基金
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-10">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  MPF 公司／受託人
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  全部基金
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  有效基金
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Top {topN} 數量
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Top {topN} 佔比
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  平均回報
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  中位數回報
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  基金預覽
                </th>
              </tr>
            </thead>
            <tbody>
              {activeStats.map((stat, idx) => (
                <React.Fragment key={stat.trustee}>
                  <tr
                    className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                    onClick={() =>
                      setExpandedTrustee((t) =>
                        t === stat.trustee ? null : stat.trustee
                      )
                    }
                  >
                    <td className="px-3 py-2 text-slate-400 text-sm">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-slate-800">{stat.trustee}</span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-700 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, stat.topNPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{stat.totalFunds}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{stat.eligibleFunds}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-bold text-blue-900 text-base">{stat.topNCount}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {stat.topNPercentage.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right">
                      {stat.averagePeriodReturn !== null ? (
                        <ReturnBadge value={stat.averagePeriodReturn} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {stat.medianPeriodReturn !== null ? (
                        <ReturnBadge value={stat.medianPeriodReturn} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {stat.topFundNames.slice(0, 2).map((name, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded max-w-[120px] truncate"
                            title={name}
                          >
                            {name}
                          </span>
                        ))}
                        {stat.topFundNames.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{stat.topFundNames.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedTrustee === stat.trustee && (
                    <tr className="bg-blue-50/50">
                      <td colSpan={9} className="px-6 py-3">
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-blue-900">
                            Top {topN} 內基金（{stat.topFundNames.length} 隻）：
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {stat.topFundNames.map((name, i) => (
                              <span
                                key={i}
                                className="bg-white border border-blue-200 text-slate-700 px-2 py-1 rounded text-xs"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {activeStats.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-wrap gap-4">
          <span>共 {activeStats.length} 間受託人進入 Top {topN}</span>
          <span>實際 Top {actualTopN} 隻基金（有效回報）</span>
          <span>點擊行查看全部基金名稱</span>
        </div>
      )}
    </div>
  );
}

function ReturnBadge({ value }: { value: number }) {
  const pct = value.toFixed(2);
  if (value > 0) return <span className="text-emerald-600 font-medium">+{pct}%</span>;
  if (value < 0) return <span className="text-red-600 font-medium">{pct}%</span>;
  return <span className="text-slate-500">{pct}%</span>;
}
