import type { FundWithReturn, ReturnPeriod } from "@/types/mpf";

type TrusteeStatsRow = object;

export function downloadCsv(rows: Record<string, unknown>[], filename = "mpf-comparison.csv") {
  if (!rows.length) return;
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const esc = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [keys.map(esc).join(","), ...rows.map((row) => keys.map((key) => esc(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}

export function exportFundResultsCSV(funds: FundWithReturn[], periods?: ReturnPeriod[]) {
  const rows = funds.map((fund) => ({ 計劃: fund.plan, 成分基金: fund.fund, 受託人: fund.trustee, 基金類別: fund.category, 回報: fund.periodReturn, 年化回報: fund.annualizedReturn, 年份: periods?.join(", ") ?? "" }));
  downloadCsv(rows, "mpf-fund-results.csv");
}

export function exportTrusteeStatsCSV(stats: TrusteeStatsRow[], topN?: number, period?: string) {
  const rows = stats.map((stat) => ({ ...(stat as Record<string, unknown>), TopN: topN ?? "", 期間: period ?? "" }));
  downloadCsv(rows, "mpf-trustee-stats.csv");
}
