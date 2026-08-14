import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MPF Comparison", description: "Compare Hong Kong MPF funds" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-HK" data-theme="dark"><body>{children}</body></html>;
}
