import type { FundWithReturn, ReturnPeriod, TrusteeStats } from "@/types/mpf";

export function downloadCsv(rows: Record<string, unknown>[], filename = "mpf-comparison.csv") {
  if (!rows.length) return;
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const esc = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [keys.map(esc).join(","), ...rows.map((row) => keys.map((key) => esc(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportFundResultsCSV(funds: FundWithReturn[], periods?: ReturnPeriod[]) {
  const rows = funds.map((fund) => ({
    計劃: fund.scheme,
    成分基金: fund.fundName,
    受託人: fund.trustee,
    基金類別: fund.fundType,
    推出日期: fund.launchDate ?? "",
    基金規模_百萬港元: fund.fundSizeMillion ?? "",
    風險級別: fund.riskLevel ?? "",
    基金開支比率: fund.fer ?? "",
    回報: fund.periodReturn ?? "",
    年化回報: fund.annualizedReturn ?? "",
    年份區間: periods && periods.length ? periods.map((p) => p.label).join(", ") : "",
  }));
  downloadCsv(rows, "mpf-fund-results.csv");
}

export function exportTrusteeStatsCSV(stats: TrusteeStats[], topN?: number, period?: ReturnPeriod) {
  const rows = stats.map((stat) => ({
    受託人: stat.trustee,
    全部基金: stat.totalFunds,
    有效基金: stat.eligibleFunds,
    [`Top${topN ?? ""}數量`]: stat.topNCount,
    [`Top${topN ?? ""}佔比`]: `${stat.topNPercentage.toFixed(1)}%`,
    平均回報: stat.averagePeriodReturn ?? "",
    中位數回報: stat.medianPeriodReturn ?? "",
    Top基金名稱: stat.topFundNames.join("; "),
    回報期間: period?.label ?? "",
  }));
  downloadCsv(rows, "mpf-trustee-stats.csv");
}
