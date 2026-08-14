"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X } from "lucide-react";
import type { Dataset, RawCellValue } from "@/types/mpf";
import { parseExcelFile } from "@/lib/excel-parser";

interface UploadPanelProps {
  onConfirm: (dataset: Dataset) => void;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [".xlsx", ".xls", ".csv"];

export function UploadPanel({ onConfirm, onClose }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pendingDataset, setPendingDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, RawCellValue>[]>([]);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [pendingBuffer, setPendingBuffer] = useState<ArrayBuffer | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File, sheetOverride?: string) => {
      setIsParsing(true);
      setParseError(null);
      setPendingDataset(null);

      try {
        const buffer = pendingBuffer && sheetOverride ? pendingBuffer : await file.arrayBuffer();
        if (!pendingBuffer || !sheetOverride) {
          setPendingBuffer(buffer);
          setPendingFileName(file.name);
        }

        const result = await parseExcelFile(buffer, file.name, sheetOverride);

        if (result.detectedSheets.length > 0 && !selectedSheet) {
          setDetectedSheets(result.detectedSheets);
          setSelectedSheet(result.detectedSheets[0]);
        }

        if (result.error) {
          setParseError(result.error);
        } else if (result.dataset) {
          setPendingDataset(result.dataset);
          setPreviewRows(result.previewRows);
        }
      } catch (e) {
        setParseError(`讀取檔案時發生錯誤：${e instanceof Error ? e.message : "未知錯誤"}`);
      } finally {
        setIsParsing(false);
      }
    },
    [pendingBuffer, selectedSheet]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setParseError(`檔案過大（最大 10MB），目前檔案：${(file.size / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      const ext = file.name.toLowerCase().split(".").pop();
      if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
        setParseError(`不支援的檔案格式。請使用 ${ACCEPTED_TYPES.join("、")} 格式。`);
        return;
      }

      await processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) await handleFile(file);
    },
    [handleFile]
  );

  const handleSheetChange = async (sheet: string) => {
    setSelectedSheet(sheet);
    if (pendingBuffer) {
      setIsParsing(true);
      setParseError(null);
      try {
        const result = await parseExcelFile(pendingBuffer, pendingFileName, sheet);
        if (result.error) {
          setParseError(result.error);
        } else if (result.dataset) {
          setPendingDataset(result.dataset);
          setPreviewRows(result.previewRows);
        }
      } catch (e) {
        setParseError(`讀取 Worksheet 時發生錯誤：${e instanceof Error ? e.message : "未知錯誤"}`);
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">上傳 Excel 資料</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          {!pendingDataset && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-900 bg-blue-50"
                  : "border-slate-300 hover:border-blue-900 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              {isParsing ? (
                <div className="text-slate-600">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900 mr-2 align-middle" />
                  正在解析 Excel，請稍候...
                </div>
              ) : (
                <>
                  <p className="text-slate-700 font-medium">拖放 Excel 到此處，或點擊選擇檔案</p>
                  <p className="text-slate-400 text-sm mt-1">
                    支援 .xlsx / .xls / .csv，最大 10MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-700 text-sm font-medium">解析錯誤</p>
                <p className="text-red-600 text-sm mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {/* Sheet selector */}
          {detectedSheets.length > 1 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">選擇 Worksheet：</label>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {detectedSheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          {pendingDataset && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-medium text-sm">解析成功</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-600">
                    <span className="text-slate-500">檔案名稱：</span>
                    <span className="font-medium">{pendingDataset.fileName}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-500">Worksheet：</span>
                    <span className="font-medium">{pendingDataset.sheetName}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-500">基金數量：</span>
                    <span className="font-semibold text-emerald-700">{pendingDataset.rowCount} 隻</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-500">偵測到年份：</span>
                    <span className="font-semibold text-blue-900">
                      {pendingDataset.years.join("、")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {pendingDataset.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700 font-medium text-sm">
                      警告（{pendingDataset.warnings.length} 條）
                    </span>
                  </div>
                  <ul className="text-xs text-amber-600 space-y-0.5 max-h-32 overflow-y-auto">
                    {pendingDataset.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    預覽（前 {previewRows.length} 行）：
                  </p>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="text-xs w-full min-w-max">
                      <thead className="bg-slate-50">
                        <tr>
                          {Object.keys(previewRows[0]).slice(0, 8).map((k) => (
                            <th key={k} className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200 whitespace-nowrap">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            {Object.keys(previewRows[0]).slice(0, 8).map((k) => (
                              <td key={k} className="px-2 py-1.5 border-b border-slate-100 text-slate-700 whitespace-nowrap max-w-[120px] truncate">
                                {row[k] !== null && row[k] !== undefined ? String(row[k]) : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const ds = { ...pendingDataset, isSample: false };
                    onConfirm(ds);
                  }}
                  className="flex-1 bg-blue-900 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
                >
                  確認使用此檔案
                </button>
                <button
                  onClick={() => {
                    setPendingDataset(null);
                    setPreviewRows([]);
                    setParseError(null);
                    setPendingBuffer(null);
                    setDetectedSheets([]);
                    setSelectedSheet("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  重新選擇
                </button>
              </div>

              {/* File icon hint */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>上傳新 Excel 後，資料會取代目前瀏覽器中的資料</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
