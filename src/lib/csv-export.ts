import type { FundWithReturn, TrusteeStats, ReturnPeriod } from "@/types/mpf";

const UTF8_BOM = "\uFEFF";

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return value.toFixed(2);
}

// ─── Export fund results CSV ──────────────────────────────────────────────────
export function exportFundResultsCSV(
  funds: FundWithReturn[],
  periods: ReturnPeriod[],
  fileName?: string
): void {
  const periodHeaders = periods.map((p) => p.label);

  const headers = [
    "排名",
    "受託人",
    "計劃",
    "成分基金",
    "基金類別",
    "風險級別",
    "基金規模(百萬港元)",
    "基金開支比率(%)",
    ...periodHeaders,
  ];

  const rows = funds.map((f, idx) => [
    idx + 1,
    f.trustee,
    f.scheme,
    f.fundName,
    f.fundType,
    f.riskLevel ?? "",
    f.fundSizeMillion?.toFixed(2) ?? "",
    f.fer?.toFixed(2) ?? "",
    f.periodReturn?.toFixed(2) ?? "",
  ]);

  const csv =
    UTF8_BOM +
    [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

  downloadCSV(csv, fileName || `mpf-基金回報-${formatDate()}.csv`);
}

// ─── Export trustee stats CSV ─────────────────────────────────────────────────
export function exportTrusteeStatsCSV(
  stats: TrusteeStats[],
  topN: number,
  period: ReturnPeriod,
  fileName?: string
): void {
  const headers = [
    "排名",
    "MPF公司/受託人",
    "全部基金數量",
    "有效回報基金數量",
    `Top ${topN} 內基金數量`,
    `Top ${topN} 佔比(%)`,
    "Top N 平均回報(%)",
    "Top N 中位數回報(%)",
    `Top N 基金名稱(最多5隻)`,
  ];

  const rows = stats
    .filter((s) => s.topNCount > 0)
    .map((s, idx) => [
      idx + 1,
      s.trustee,
      s.totalFunds,
      s.eligibleFunds,
      s.topNCount,
      s.topNPercentage.toFixed(1),
      formatPct(s.averagePeriodReturn),
      formatPct(s.medianPeriodReturn),
      s.topFundNames.join(" | "),
    ]);

  const csv =
    UTF8_BOM +
    [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

  const periodLabel = `${period.startYear}-${period.endYear}`;
  downloadCSV(
    csv,
    fileName || `mpf-Top${topN}-${periodLabel}-${formatDate()}.csv`
  );
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function downloadCSV(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
