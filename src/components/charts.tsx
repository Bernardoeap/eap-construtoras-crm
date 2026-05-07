"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#1d6dff", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#64748b", "#84cc16"];

export function PipelineFunnelChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="status" type="category" width={140} />
        <Tooltip />
        <Bar dataKey="count" fill="#1d6dff" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReunioesLineChart({ data }: { data: { mes: string; agendadas: number; realizadas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="agendadas" stroke="#1d6dff" strokeWidth={2} />
        <Line type="monotone" dataKey="realizadas" stroke="#22c55e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function QualifVsLostChart({ data }: { data: { mes: string; qualificados: number; perdidos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="qualificados" fill="#22c55e" />
        <Bar dataKey="perdidos" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistribuicaoPieChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ValorBarChart({ data }: { data: { name: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1_000_000).toFixed(0)}M`} />
        <YAxis dataKey="name" type="category" width={200} />
        <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
        <Bar dataKey="valor" fill="#1d6dff" />
      </BarChart>
    </ResponsiveContainer>
  );
}
