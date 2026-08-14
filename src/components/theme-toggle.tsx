"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("mpf-theme"); if (saved) { setDark(saved === "dark"); document.documentElement.dataset.theme = saved; } }, []);
  const toggle = () => { const next = !dark; setDark(next); const theme = next ? "dark" : "light"; document.documentElement.dataset.theme = theme; localStorage.setItem("mpf-theme", theme); };
  return <button type="button" onClick={toggle} aria-label="切換暗黑模式">{dark ? "☀️ 亮色模式" : "🌙 暗黑模式"}</button>;
}
