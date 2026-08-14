import Link from "next/link";
import { ArrowLeft, Info, AlertTriangle, Calculator, Database } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主頁
          </Link>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            <h1 className="text-lg font-bold">關於 MPF 基金回報分析器</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* About */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-900" />
            資料來源
          </h2>
          <ul className="space-y-2 text-slate-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-900 mt-0.5">•</span>
              <span>
                資料來源為使用者自行上傳的 Excel 檔案。App 不直接訪問 MPFA 網站。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-900 mt-0.5">•</span>
              <span>
                提供的 Sample Excel 格式參考自強積金計劃管理局（MPFA）基金資料表。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-900 mt-0.5">•</span>
              <span>
                資料上傳後儲存於使用者的瀏覽器（IndexedDB），不會上傳至任何伺服器。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-900 mt-0.5">•</span>
              <span>
                受託人／基金數量按照 Excel 每一列統計，同一基金的 A／B／T／I 單位各自視為獨立記錄。
              </span>
            </li>
          </ul>
        </div>

        {/* Calculation method */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-900" />
            回報計算方法
          </h2>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>累積回報</strong>使用年度回報的複式累積計算：
            </p>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-800">
              累積回報 = (1 + r₁/100) × (1 + r₂/100) × ... × (1 + rₙ/100) - 1
            </div>
            <p>
              例如 2021–2025 五年累積回報：
            </p>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-800">
              (1 + r2021/100)<br />
              × (1 + r2022/100)<br />
              × (1 + r2023/100)<br />
              × (1 + r2024/100)<br />
              × (1 + r2025/100) − 1
            </div>
            <p>
              <strong>年化回報</strong>計算方式：
            </p>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-800">
              年化回報 = (1 + 累積回報/100)^(1/年數) − 1
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm mt-2">
              <strong>重要：</strong>若某基金在所選期間內任何一年的回報為 <code>n.a.</code>（不適用）或缺失，
              該期間的累積回報將顯示為「—」（不計算），絕對不會將缺失年份當成 0% 計算。
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            免責聲明
          </h2>
          <ul className="space-y-2 text-red-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>這不是投資建議。</strong>過往回報並不代表將來表現。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                所有分析僅供參考，使用者應自行諮詢持牌財務顧問。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                回報數據取自使用者上傳的 Excel，App 不對數據準確性負責。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                強積金投資涉及風險，基金價格可升可跌，投資者可能無法取回全部投資金額。
              </span>
            </li>
          </ul>
        </div>

        {/* Technical info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">技術說明</h2>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-slate-500">前端框架</div>
              <div>Next.js 16 App Router + React 19</div>
              <div className="text-slate-500">程式語言</div>
              <div>TypeScript</div>
              <div className="text-slate-500">樣式</div>
              <div>Tailwind CSS</div>
              <div className="text-slate-500">Excel 處理</div>
              <div>SheetJS (xlsx)</div>
              <div className="text-slate-500">本地儲存</div>
              <div>IndexedDB（優先）/ localStorage（備用）</div>
              <div className="text-slate-500">年份辨識</div>
              <div>從欄位標題自動辨識四位數年份</div>
              <div className="text-slate-500">資料模式</div>
              <div>Local-first，資料不離開瀏覽器</div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回主頁
          </Link>
        </div>
      </main>
    </div>
  );
}
