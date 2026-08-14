export type RawCellValue = string | number | null | undefined;

export interface FundRecord {
  id: string;
  scheme: string;
  fundName: string;
  trustee: string;
  fundType: string;
  launchDate: string | null;
  fundSizeMillion: number | null;
  riskLevel: number | null;
  fer: number | null;
  annualReturns: Record<number, number | null>;
  sourceRowNumber: number;
}

export interface Dataset {
  fileName: string;
  uploadedAt: string;
  sheetName: string;
  rowCount: number;
  years: number[];
  records: FundRecord[];
  warnings: string[];
  isSample?: boolean;
}

export interface ReturnPeriod {
  startYear: number;
  endYear: number;
  label: string;
}

export interface FundWithReturn extends FundRecord {
  periodReturn: number | null;
  annualizedReturn: number | null;
  availableYears: number[];
  returnsByPeriod: Record<string, number | null>;
}

export interface TrusteeStats {
  trustee: string;
  totalFunds: number;
  eligibleFunds: number;
  topNCount: number;
  topNPercentage: number;
  averagePeriodReturn: number | null;
  medianPeriodReturn: number | null;
  topFundNames: string[];
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

export type ReturnMode = "cumulative" | "annualized";
