"use client";
export type PlanDistributionRow = { plan: string; count: number; averageReturn: number };
export default function PlanDistributionTable({ rows }: { rows: PlanDistributionRow[] }) {
  return <table><thead><tr><th>計劃</th><th>基金數量</th><th>平均回報</th></tr></thead><tbody>{rows.map((row) => <tr key={row.plan}><td>{row.plan}</td><td>{row.count}</td><td>{row.averageReturn.toFixed(2)}%</td></tr>)}</tbody></table>;
}
