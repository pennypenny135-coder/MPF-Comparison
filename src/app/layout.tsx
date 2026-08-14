import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPF 基金回報分析器",
  description: "香港強積金基金回報分析工具。上傳 Excel，自動辨識年份，計算累積及年化回報。",
  manifest: "/manifest.json",
  keywords: ["MPF", "強積金", "基金", "回報", "分析", "香港", "Excel"],
  authors: [{ name: "MPF Analyzer" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
