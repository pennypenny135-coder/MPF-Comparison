"use client";

import type { Dataset } from "@/types/mpf";

const DB_NAME = "mpf-analyzer";
const DB_VERSION = 1;
const STORE_NAME = "datasets";
const ACTIVE_KEY = "mpf-active-dataset-id";
const DATASET_KEY_PREFIX = "mpf-dataset-";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// ─── Save dataset ─────────────────────────────────────────────────────────────
export async function saveDataset(dataset: Dataset): Promise<string> {
  const id = `dataset-${Date.now()}`;

  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, ...dataset });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as IDBTransaction).error);
      });
      localStorage.setItem(ACTIVE_KEY, id);
      return id;
    } catch (e) {
      console.warn("IndexedDB failed, falling back to localStorage:", e);
    }
  }

  // Fallback to localStorage (size limited)
  try {
    const json = JSON.stringify(dataset);
    localStorage.setItem(DATASET_KEY_PREFIX + id, json);
    localStorage.setItem(ACTIVE_KEY, id);
    return id;
  } catch (e) {
    throw new Error(`儲存資料失敗：${e instanceof Error ? e.message : "未知錯誤"}`);
  }
}

// ─── Load active dataset ──────────────────────────────────────────────────────
export async function loadActiveDataset(): Promise<Dataset | null> {
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (!activeId) return null;

  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      const result = await new Promise<Dataset | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(activeId);
        req.onsuccess = (e) => {
          const record = (e.target as IDBRequest).result;
          if (!record) {
            resolve(null);
            return;
          }
          // Extract dataset (remove id field)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...dataset } = record;
          resolve(dataset as Dataset);
        };
        req.onerror = (e) => reject((e.target as IDBRequest).error);
      });
      if (result) return result;
    } catch (e) {
      console.warn("IndexedDB read failed, falling back to localStorage:", e);
    }
  }

  // Fallback to localStorage
  const json = localStorage.getItem(DATASET_KEY_PREFIX + activeId);
  if (!json) return null;
  try {
    return JSON.parse(json) as Dataset;
  } catch {
    return null;
  }
}

// ─── Clear active dataset ─────────────────────────────────────────────────────
export async function clearActiveDataset(): Promise<void> {
  const activeId = localStorage.getItem(ACTIVE_KEY);
  localStorage.removeItem(ACTIVE_KEY);

  if (!activeId) return;

  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(activeId);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as IDBTransaction).error);
      });
    } catch (e) {
      console.warn("IndexedDB delete failed:", e);
    }
  }

  localStorage.removeItem(DATASET_KEY_PREFIX + activeId);
}

// ─── UI Preferences ───────────────────────────────────────────────────────────
export interface UIPreferences {
  selectedPeriods: Array<{ startYear: number; endYear: number }>;
  selectedTrustees: string[];
  selectedFundTypes: string[];
  selectedRiskLevels: number[];
  pageSize: number;
  topN: number;
  returnMode: "cumulative" | "annualized";
}

const PREFS_KEY = "mpf-ui-prefs";

export function saveUIPreferences(prefs: Partial<UIPreferences>): void {
  try {
    const existing = loadUIPreferences();
    const merged = { ...existing, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function loadUIPreferences(): UIPreferences {
  const defaults: UIPreferences = {
    selectedPeriods: [],
    selectedTrustees: [],
    selectedFundTypes: [],
    selectedRiskLevels: [],
    pageSize: 25,
    topN: 20,
    returnMode: "cumulative",
  };
  try {
    const json = localStorage.getItem(PREFS_KEY);
    if (!json) return defaults;
    return { ...defaults, ...JSON.parse(json) };
  } catch {
    return defaults;
  }
}
