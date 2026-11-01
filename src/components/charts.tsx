"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const NAVY = "#12295a";
const BLUE = "#1d63e3";
const GRID = "#e3e7ee";
const AXIS = { fontSize: 11, fill: "#7c889d" };
const palette = [NAVY, BLUE, "#7fa6f3", "#11845b", "#b26a00", "#c42b3c"];

export function TrendLine({ data, x, y, unit = "", domain }: { data: object[]; x: string; y: string; unit?: string; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={domain} unit={unit} />
        <Tooltip formatter={(v) => `${v}${unit}`} contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }} />
        <Line type="monotone" dataKey={y} stroke={BLUE} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, y, horizontal, format }: { data: object[]; x: string; y: string; horizontal?: boolean; format?: "pkr" | "pct" }) {
  const fmt = (v: unknown) => (format === "pkr" ? `PKR ${(Number(v) / 1_000_000).toFixed(2)}M` : format === "pct" ? `${v}%` : String(v));
  return (
    <ResponsiveContainer width="100%" height={horizontal ? Math.max(200, data.length * 40) : 240}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey={x} tick={AXIS} tickLine={false} axisLine={false} width={140} />
          <Tooltip formatter={fmt} cursor={{ fill: "#f1f4fa" }} contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }} />
          <Bar dataKey={y} fill={NAVY} radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={fmt} />
          <Tooltip formatter={fmt} cursor={{ fill: "#f1f4fa" }} contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }} />
          <Bar dataKey={y} fill={BLUE} radius={[4, 4, 0, 0]} barSize={28} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export function Donut({ data, name, value }: { data: object[]; name: string; value: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey={value} nameKey={name} innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export const chartPalette = palette;
