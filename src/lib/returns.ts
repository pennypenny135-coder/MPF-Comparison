import type {
  Dataset,
  FundRecord,
  FundWithReturn,
  ReturnPeriod,
  ReturnMode,
  TrusteeStats,
} from "@/types/mpf";

// ─── Cumulative return ────────────────────────────────────────────────────────
export function calculateCumulativeReturn(
  annualReturns: Record<number, number | null>,
  startYear: number,
  endYear: number
): number | null {
  if (startYear > endYear) return null;

  let value = 1;
  let count = 0;

  for (let year = startYear; year <= endYear; year++) {
    const returnValue = annualReturns[year];
    if (
      returnValue === null ||
      returnValue === undefined ||
      !Number.isFinite(returnValue)
    ) {
      return null;
    }
    value *= 1 + returnValue / 100;
    count++;
  }

  return count === 0 ? null : (value - 1) * 100;
}

// ─── Annualized return ────────────────────────────────────────────────────────
export function calculateAnnualizedReturn(
  cumulativeReturn: number | null,
  years: number
): number | null {
  if (cumulativeReturn === null || years <= 0) return null;
  if (cumulativeReturn <= -100) return null;
  const base = 1 + cumulativeReturn / 100;
  if (base <= 0) return null;
  return (Math.pow(base, 1 / years) - 1) * 100;
}

// ─── Generate default periods ─────────────────────────────────────────────────
export function generateDefaultPeriods(years: number[]): ReturnPeriod[] {
  if (years.length === 0) return [];

  const sortedYears = [...years].sort((a, b) => a - b);
  const latestYear = sortedYears[sortedYears.length - 1];
  const earliestYear = sortedYears[0];

  const periods: ReturnPeriod[] = [];
  const seen = new Set<string>();

  const addPeriod = (start: number, end: number) => {
    if (start > end) return;
    if (!years.includes(start) || !years.includes(end)) return;
    const key = `${start}-${end}`;
    if (seen.has(key)) return;
    seen.add(key);
    const yearCount = end - start + 1;
    periods.push({
      startYear: start,
      endYear: end,
      label:
        start === end
          ? `${start} 年`
          : `${start}–${end}（${yearCount} 年）`,
    });
  };

  // Full range
  if (earliestYear !== latestYear) {
    addPeriod(earliestYear, latestYear);
  }

  // Last 5, 4, 3, 2 years relative to latestYear
  const offsets = [4, 3, 2, 1];
  for (const offset of offsets) {
    const startYear = latestYear - offset;
    if (years.includes(startYear)) {
      addPeriod(startYear, latestYear);
    }
  }

  // Latest year only
  addPeriod(latestYear, latestYear);

  return periods;
}

// ─── Build period label ───────────────────────────────────────────────────────
export function buildPeriodLabel(startYear: number, endYear: number): string {
  if (startYear === endYear) return `${startYear} 年`;
  const yearCount = endYear - startYear + 1;
  return `${startYear}–${endYear}（${yearCount} 年）`;
}

// ─── Enrich funds with returns ────────────────────────────────────────────────
export function enrichFundsWithReturns(
  records: FundRecord[],
  period: ReturnPeriod,
  mode: ReturnMode
): FundWithReturn[] {
  const years = period.endYear - period.startYear + 1;

  return records.map((record) => {
    const availableYears = Object.keys(record.annualReturns)
      .map(Number)
      .filter((y) => record.annualReturns[y] !== null);

    const cumReturn = calculateCumulativeReturn(
      record.annualReturns,
      period.startYear,
      period.endYear
    );

    let annualizedReturn: number | null = null;
    if (cumReturn !== null) {
      annualizedReturn = calculateAnnualizedReturn(cumReturn, years);
    }

    const periodReturn = mode === "annualized" ? annualizedReturn : cumReturn;

    return {
      ...record,
      periodReturn,
      annualizedReturn,
      availableYears,
    };
  });
}

// ─── Compute trustee stats ────────────────────────────────────────────────────
export function computeTrusteeStats(
  funds: FundWithReturn[],
  topN: number
): TrusteeStats[] {
  // Only include funds with valid periodReturn
  const eligible = funds.filter(
    (f) => f.periodReturn !== null && Number.isFinite(f.periodReturn)
  );

  // Sort descending
  const sorted = [...eligible].sort(
    (a, b) => (b.periodReturn ?? -Infinity) - (a.periodReturn ?? -Infinity)
  );

  // Top N
  const topFunds = sorted.slice(0, topN);

  // Group by trustee
  const trusteeMap = new Map<
    string,
    { total: number; eligible: number; topFunds: FundWithReturn[] }
  >();

  // Count total funds per trustee
  for (const f of funds) {
    const existing = trusteeMap.get(f.trustee) ?? {
      total: 0,
      eligible: 0,
      topFunds: [],
    };
    existing.total++;
    trusteeMap.set(f.trustee, existing);
  }

  // Count eligible funds per trustee
  for (const f of eligible) {
    const existing = trusteeMap.get(f.trustee);
    if (existing) existing.eligible++;
  }

  // Count top N funds per trustee
  for (const f of topFunds) {
    const existing = trusteeMap.get(f.trustee);
    if (existing) existing.topFunds.push(f);
  }

  // Build stats
  const stats: TrusteeStats[] = [];

  for (const [trustee, data] of trusteeMap.entries()) {
    if (data.topFunds.length === 0 && data.total === 0) continue;

    const topReturns = data.topFunds
      .map((f) => f.periodReturn)
      .filter((r): r is number => r !== null && Number.isFinite(r));

    const avgReturn =
      topReturns.length > 0
        ? topReturns.reduce((a, b) => a + b, 0) / topReturns.length
        : null;

    const medianReturn =
      topReturns.length > 0 ? computeMedian(topReturns) : null;

    stats.push({
      trustee,
      totalFunds: data.total,
      eligibleFunds: data.eligible,
      topNCount: data.topFunds.length,
      topNPercentage:
        topN > 0 ? (data.topFunds.length / Math.min(topN, eligible.length)) * 100 : 0,
      averagePeriodReturn: avgReturn,
      medianPeriodReturn: medianReturn,
      topFundNames: data.topFunds.slice(0, 5).map((f) => f.fundName),
    });
  }

  // Sort by topNCount desc, then avgReturn desc
  return stats.sort((a, b) => {
    if (b.topNCount !== a.topNCount) return b.topNCount - a.topNCount;
    const aAvg = a.averagePeriodReturn ?? -Infinity;
    const bAvg = b.averagePeriodReturn ?? -Infinity;
    return bAvg - aAvg;
  });
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// ─── Dataset utilities ────────────────────────────────────────────────────────
export function getDatasetYearRange(dataset: Dataset): string {
  if (dataset.years.length === 0) return "無年份資料";
  const sorted = [...dataset.years].sort((a, b) => a - b);
  if (sorted.length === 1) return `${sorted[0]}`;
  return `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

export function getUniqueTrustees(dataset: Dataset): string[] {
  const set = new Set<string>();
  for (const r of dataset.records) {
    if (r.trustee) set.add(r.trustee);
  }
  return [...set].sort();
}

export function getUniqueFundTypes(dataset: Dataset): string[] {
  const set = new Set<string>();
  for (const r of dataset.records) {
    if (r.fundType) set.add(r.fundType);
  }
  return [...set].sort();
}

export function getUniqueRiskLevels(dataset: Dataset): number[] {
  const set = new Set<number>();
  for (const r of dataset.records) {
    if (r.riskLevel !== null) set.add(r.riskLevel);
  }
  return [...set].sort((a, b) => a - b);
}
