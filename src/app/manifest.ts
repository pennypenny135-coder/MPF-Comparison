import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MPF 基金回報分析器",
    short_name: "MPF Analyzer",
    description: "香港強積金基金回報分析工具。上傳 Excel，自動辨識年份，計算累積及年化回報。",
    lang: "zh-HK",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#1e3a5f",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["finance", "productivity"],
  };
}
