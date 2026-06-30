"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

interface WeekPoint {
  week: string;
  cmv: number;
  meta: number;
}

export function CmvChart({ data }: { data: WeekPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#2A2A2A" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-space-mono), monospace" }}
          axisLine={{ stroke: "#2A2A2A" }}
          tickLine={{ stroke: "#2A2A2A" }}
        />
        <YAxis
          tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-space-mono), monospace" }}
          axisLine={{ stroke: "#2A2A2A" }}
          tickLine={{ stroke: "#2A2A2A" }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          cursor={{ fill: "rgba(245,193,0,0.06)" }}
          contentStyle={{
            backgroundColor: "#080808",
            border: "1px solid #F5C100",
            borderRadius: 0,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#FFFFFF",
            padding: "10px 12px",
          }}
          formatter={(v: number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            }).format(v)
          }
        />
        <ReferenceLine
          y={15000}
          stroke="#D42B2B"
          strokeDasharray="4 4"
          label={{ value: "META $15K", position: "right", fill: "#D42B2B", fontSize: 9, fontFamily: "var(--font-space-mono), monospace" }}
        />
        <Bar dataKey="cmv" fill="#F5C100" name="CMV" />
      </BarChart>
    </ResponsiveContainer>
  );
}
