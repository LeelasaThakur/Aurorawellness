'use client';

import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WellnessChartProps {
  data: Record<string, any>[];
  dataKeys: string[];
  title: string;
  type?: 'line' | 'bar' | 'area';
  xKey?: string;
  className?: string;
}

const COLORS = ['#F59E0B', '#10B981', '#8B5CF6', '#F43F5E', '#3B82F6'];

/* Custom glassmorphism tooltip */
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 border border-white/10 backdrop-blur-xl"
      style={{ background: 'rgba(15,23,42,0.85)' }}
    >
      <p className="text-xs text-white/50 mb-1.5 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function WellnessChart({
  data,
  dataKeys,
  title,
  type = 'line',
  xKey = 'name',
  className = '',
}: WellnessChartProps) {
  const ChartComponent =
    type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart;

  return (
    <section
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 ${className}`}
      aria-label={title}
    >
      <h3 className="text-white text-base font-semibold mb-4">{title}</h3>

      <div className="w-full h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xKey}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<GlassTooltip />} />

            {dataKeys.map((key, i) => {
              const color = COLORS[i % COLORS.length];
              if (type === 'bar') {
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={color}
                    radius={[6, 6, 0, 0]}
                    animationDuration={1000}
                  />
                );
              }
              if (type === 'area') {
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    animationDuration={1000}
                    dot={false}
                    activeDot={{ r: 5, fill: color }}
                  />
                );
              }
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: color }}
                  animationDuration={1000}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
