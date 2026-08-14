import * as XLSX from "xlsx";
import type { Dataset, FundRecord, RawCellValue } from "@/types/mpf";

// ─── Column aliases ───────────────────────────────────────────────────────────
const ALIASES: Record<string, string[]> = {
  scheme: ["計劃", "计划", "Scheme", "Plan"],
  fundName: [
    "成分基金",
    "成分基金名稱",
    "Fund Name",
    "Constituent Fund",
    "基金名稱",
    "基金名称",
  ],
  trustee: ["受託人", "受托人", "Trustee"],
  fundType: ["基金類別", "基金类别", "Fund Type", "Category"],
  launchDate: ["推出日期", "推出日", "Launch Date", "Inception Date"],
  fundSizeMillion: [
    "基金規模\n(百萬港元)",
    "基金規模 (百萬港元)",
    "基金規模(百萬港元)",
    "Fund Size (Million HKD)",
    "Fund Size",
    "基金規模",
    "基金规模",
  ],
  riskLevel: ["風險級別", "风险级别", "Risk Level", "風險等級"],
  fer: [
    "最近期基金\n開支比率(%)",
    "最近期基金開支比率(%)",
    "基金開支比率(%)",
    "FER (%)",
    "Fund Expense Ratio",
    "開支比率",
    "最近期基金 開支比率(%)",
  ],
};

// Keywords that indicate a column contains return data
const RETURN_KEYWORDS = [
  "回報",
  "回报",
  "return",
  "performance",
  "yield",
  "收益",
  "年回報",
  "annual",
];

// ─── Normalize header string ──────────────────────────────────────────────────
function normalizeHeader(h: string): string {
  return h
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ─── Match header to alias ────────────────────────────────────────────────────
function matchAlias(header: string, aliases: string[]): boolean {
  const normalized = normalizeHeader(header);
  return aliases.some((alias) => {
    const normalizedAlias = normalizeHeader(alias);
    return normalized === normalizedAlias || normalized.includes(normalizedAlias);
  });
}

// ─── Find column index by alias ───────────────────────────────────────────────
function findColumnIndex(
  headers: string[],
  aliases: string[]
): number {
  for (let i = 0; i < headers.length; i++) {
    if (matchAlias(headers[i], aliases)) return i;
  }
  return -1;
}

// ─── Parse nullable number ────────────────────────────────────────────────────
export function parseNullableNumber(
  value: RawCellValue,
  warnings: string[],
  context?: string
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const str = String(value).trim();
  if (
    str === "" ||
    str.toLowerCase() === "n.a." ||
    str.toLowerCase() === "na" ||
    str.toLowerCase() === "n/a" ||
    str === "-" ||
    str === "--" ||
    str === "—"
  ) {
    return null;
  }
  // Remove % sign and thousand separators
  const cleaned = str.replace(/%/g, "").replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) {
    if (context) {
      warnings.push(`無法解析數字值「${str}」（${context}）`);
    }
    return null;
  }
  return num;
}

// ─── Detect year columns ──────────────────────────────────────────────────────
interface YearColumn {
  year: number;
  colIndex: number;
  header: string;
}

function detectYearColumns(headers: string[]): YearColumn[] {
  const yearCols: YearColumn[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const normalized = normalizeHeader(header);

    // Check if it's a return-related column
    const isReturnCol = RETURN_KEYWORDS.some((kw) =>
      normalized.includes(kw.toLowerCase())
    );
    if (!isReturnCol) continue;

    // Extract year
    const yearMatches = header.match(/\b(19|20)\d{2}\b/g);
    if (!yearMatches) continue;

    for (const ym of yearMatches) {
      const year = parseInt(ym, 10);
      if (!seen.has(year)) {
        seen.add(year);
        yearCols.push({ year, colIndex: i, header });
      }
    }
  }

  return yearCols.sort((a, b) => a.year - b.year);
}

// ─── Parse date ───────────────────────────────────────────────────────────────
function parseDateValue(value: RawCellValue): string | null {
  if (value === null || value === undefined) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((value as any) instanceof Date) {
    return (value as unknown as Date).toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    // Excel serial date
    try {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, "0");
        const d = String(date.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
    return null;
  }
  if (typeof value === "string") {
    const str = value.trim();
    if (!str || str === "-" || str.toLowerCase() === "n.a.") return null;
    return str;
  }
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────
export interface ParseResult {
  dataset: Dataset | null;
  error: string | null;
  previewRows: Record<string, RawCellValue>[];
  detectedSheets: string[];
}

export async function parseExcelFile(
  buffer: ArrayBuffer,
  fileName: string,
  sheetNameOverride?: string
): Promise<ParseResult> {
  const warnings: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
  } catch (e) {
    return {
      dataset: null,
      error: `無法讀取 Excel 檔案：${e instanceof Error ? e.message : "未知錯誤"}`,
      previewRows: [],
      detectedSheets: [],
    };
  }

  const detectedSheets = workbook.SheetNames;
  const sheetName =
    sheetNameOverride && workbook.SheetNames.includes(sheetNameOverride)
      ? sheetNameOverride
      : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return {
      dataset: null,
      error: `找不到 Worksheet「${sheetName}」`,
      previewRows: [],
      detectedSheets,
    };
  }

  // Convert to JSON with raw values
  const rawRows = XLSX.utils.sheet_to_json<RawCellValue[]>(worksheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  if (rawRows.length < 2) {
    return {
      dataset: null,
      error: "Excel 檔案內容不足，需要至少一行標題及一行資料",
      previewRows: [],
      detectedSheets,
    };
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i] as RawCellValue[];
    const nonEmpty = row.filter(
      (c) => c !== null && c !== undefined && String(c).trim() !== ""
    );
    if (nonEmpty.length >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rawRows[headerRowIndex] as RawCellValue[];
  const headers = headerRow.map((h) =>
    h !== null && h !== undefined ? String(h) : ""
  );

  // Detect year columns
  const yearColumns = detectYearColumns(headers);
  if (yearColumns.length === 0) {
    return {
      dataset: null,
      error:
        "找不到年度回報欄位。請使用 sample Excel 格式，例如「曆年回報 (%) - 2025」。",
      previewRows: [],
      detectedSheets,
    };
  }

  // Find fixed columns
  const colIdx = {
    scheme: findColumnIndex(headers, ALIASES.scheme),
    fundName: findColumnIndex(headers, ALIASES.fundName),
    trustee: findColumnIndex(headers, ALIASES.trustee),
    fundType: findColumnIndex(headers, ALIASES.fundType),
    launchDate: findColumnIndex(headers, ALIASES.launchDate),
    fundSizeMillion: findColumnIndex(headers, ALIASES.fundSizeMillion),
    riskLevel: findColumnIndex(headers, ALIASES.riskLevel),
    fer: findColumnIndex(headers, ALIASES.fer),
  };

  if (colIdx.fundName === -1 && colIdx.scheme === -1) {
    warnings.push("找不到「成分基金」或「計劃」欄位，部分資料可能無法辨識");
  }
  if (colIdx.trustee === -1) {
    warnings.push("找不到「受託人」欄位，受託人資料將缺失");
  }

  // Process data rows
  const records: FundRecord[] = [];
  let skippedRows = 0;

  const dataRows = rawRows.slice(headerRowIndex + 1);

  // Build preview (first 5 rows as objects)
  const previewRows: Record<string, RawCellValue>[] = [];
  for (let i = 0; i < Math.min(5, dataRows.length); i++) {
    const row = dataRows[i] as RawCellValue[];
    const obj: Record<string, RawCellValue> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] ?? null;
    });
    previewRows.push(obj);
  }

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx] as RawCellValue[];

    // Skip completely empty rows
    const hasContent = row.some(
      (c) => c !== null && c !== undefined && String(c).trim() !== ""
    );
    if (!hasContent) continue;

    const getCellStr = (idx: number): string => {
      if (idx === -1) return "";
      const val = row[idx];
      if (val === null || val === undefined) return "";
      return String(val).trim();
    };

    const fundName = getCellStr(colIdx.fundName);
    const trustee = getCellStr(colIdx.trustee);

    // Skip rows without required fields
    if (!fundName && !trustee) {
      skippedRows++;
      continue;
    }

    if (!fundName) {
      warnings.push(`第 ${headerRowIndex + rowIdx + 2} 行：缺少「成分基金」欄位，已跳過`);
      skippedRows++;
      continue;
    }

    // Parse annual returns
    const annualReturns: Record<number, number | null> = {};
    for (const yc of yearColumns) {
      const cellVal = row[yc.colIndex];
      annualReturns[yc.year] = parseNullableNumber(
        cellVal,
        warnings,
        `第 ${headerRowIndex + rowIdx + 2} 行, ${yc.year} 年回報`
      );
    }

    const record: FundRecord = {
      id: `${rowIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      scheme: getCellStr(colIdx.scheme),
      fundName,
      trustee: trustee || "未知受託人",
      fundType: getCellStr(colIdx.fundType),
      launchDate: colIdx.launchDate >= 0 ? parseDateValue(row[colIdx.launchDate]) : null,
      fundSizeMillion:
        colIdx.fundSizeMillion >= 0
          ? parseNullableNumber(
              row[colIdx.fundSizeMillion],
              warnings,
              `第 ${headerRowIndex + rowIdx + 2} 行, 基金規模`
            )
          : null,
      riskLevel:
        colIdx.riskLevel >= 0
          ? parseNullableNumber(
              row[colIdx.riskLevel],
              warnings,
              `第 ${headerRowIndex + rowIdx + 2} 行, 風險級別`
            )
          : null,
      fer:
        colIdx.fer >= 0
          ? parseNullableNumber(
              row[colIdx.fer],
              warnings,
              `第 ${headerRowIndex + rowIdx + 2} 行, 基金開支比率`
            )
          : null,
      annualReturns,
      sourceRowNumber: headerRowIndex + rowIdx + 2,
    };

    records.push(record);
  }

  if (records.length === 0) {
    return {
      dataset: null,
      error: `無法從 Excel 解析任何有效基金記錄。已跳過 ${skippedRows} 行。`,
      previewRows,
      detectedSheets,
    };
  }

  const years = yearColumns.map((yc) => yc.year).sort((a, b) => a - b);

  const dataset: Dataset = {
    fileName,
    uploadedAt: new Date().toISOString(),
    sheetName,
    rowCount: records.length,
    years,
    records,
    warnings: warnings.slice(0, 50), // limit warnings
    isSample: false,
  };

  return {
    dataset,
    error: null,
    previewRows,
    detectedSheets,
  };
}

// ─── Generate sample Excel ────────────────────────────────────────────────────
export function generateSampleExcel(): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const data = [
    [
      "計劃",
      "成分基金",
      "受託人",
      "基金類別",
      "推出日期",
      "基金規模 (百萬港元)",
      "風險級別",
      "最近期基金開支比率(%)",
      "曆年回報 (%) - 2025",
      "曆年回報 (%) - 2024",
      "曆年回報 (%) - 2023",
      "曆年回報 (%) - 2022",
      "曆年回報 (%) - 2021",
    ],
    [
      "HSBC MPF",
      "港股基金",
      "匯豐強積金",
      "股票基金",
      "2000-01-01",
      5000,
      5,
      1.2,
      8.5,
      15.2,
      -5.3,
      -15.8,
      22.1,
    ],
    [
      "Manulife MPF",
      "全球股票基金",
      "宏利強積金",
      "股票基金",
      "2001-03-15",
      3200,
      4,
      1.5,
      12.3,
      18.7,
      8.2,
      -12.1,
      28.5,
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
