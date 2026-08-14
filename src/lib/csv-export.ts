import type { FundWithReturn, ReturnPeriod, ReturnMode } from "@/types/mpf";

export function downloadCsv(rows: Record<string, unknown>[], filename = "mpf-comparison.csv") {
  if (!rows.length) return;
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const esc = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [keys.map(esc).join(","), ...rows.map((row) => keys.map((key) => esc(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}

function downloadRows(rows: Record<string, unknown>[], filename: string) { downloadCsv(rows, filename); }

export function exportFundResultsCSV(funds: FundWithReturn[], periods?: ReturnPeriod[], mode?: ReturnMode) {
  const rows = funds.map((fund) => ({
    計劃: fund.plan,
    成分基金: fund.fund,
    受託人: fund.trustee,
    基金類別: fund.category,
    ...(periods ?? []).reduce<Record<string, unknown>>((acc, period) => {
      const value = (fund as unknown as Record<string, unknown>)[String(period)];
      acc[String(period)] = value ?? "";
      return acc;
    }, {}),
  }));
  downloadRows(rows, "mpf-fund-results.csv");
}

export function exportTrusteeStatsCSV(funds: FundWithReturn[], periods?: ReturnPeriod[], mode?: ReturnMode) {
  const groups = new Map<string, { count: number; total: number }>();
  for (const fund of funds) {
    const key = fund.trustee || "未分類";
    const current = groups.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    const value = periods?.[0] ? Number((fund as unknown as Record<string, unknown>)[String(periods[0])]) : 0;
    current.total += Number.isFinite(value) ? value : 0;
    groups.set(key, current);
  }
  downloadRows([...groups].map(([受託人, value]) => ({ 受託人, 基金數量: value.count, 平均回報: value.count ? value.total / value.count : 0 })), "mpf-trustee-stats.csv");
}
