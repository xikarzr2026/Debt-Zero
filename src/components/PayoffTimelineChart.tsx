'use client';

import React, { useState, useMemo } from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Flag } from 'lucide-react';

export const PayoffTimelineChart: React.FC = () => {
  const {
    activePlan,
    comparison,
    formatCurrency,
    debts,
  } = useDebt();

  const [chartView, setChartView] = useState<'balance' | 'cumulative_interest' | 'stacked_debts'>(
    'balance'
  );

  const gridColor = '#e8e2d2';
  const axisColor = '#78716c';

  // Construct unified timeline dataset
  const chartData = useMemo(() => {
    const activeSchedule = activePlan.schedule || [];
    const baselineSchedule = comparison.baselineMinimums.schedule || [];
    const windfallSchedule = comparison.windfallAvalanche?.schedule || [];

    // Max length to show
    const maxMonths = Math.min(
      Math.max(activeSchedule.length, Math.min(baselineSchedule.length, 120)),
      180
    );

    interface TimelineChartPoint {
      monthIndex: number;
      date: string;
      activeBalance: number;
      baselineBalance: number;
      windfallBalance?: number | null;
      activeInterestCumulative: number;
      baselineInterestCumulative: number;
      milestone: string | null;
      [key: string]: string | number | null | undefined;
    }

    const data: TimelineChartPoint[] = [];

    // Initial point (Month 0 / Today)
    const initialTotalBalance = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
    const initialPoint: TimelineChartPoint = {
      monthIndex: 0,
      date: 'Start',
      activeBalance: initialTotalBalance,
      baselineBalance: initialTotalBalance,
      activeInterestCumulative: 0,
      baselineInterestCumulative: 0,
      milestone: null,
    };
    debts.forEach((d) => {
      initialPoint[d.name] = d.balance;
    });
    data.push(initialPoint);

    // Sample data so it doesn't have 600 points on screen (subsample if long)
    const step = maxMonths > 60 ? 2 : 1;

    let activeCumInterest = 0;
    let baselineCumInterest = 0;

    for (let i = 0; i < maxMonths; i += step) {
      const activeSnap = activeSchedule[i];
      const baseSnap = baselineSchedule[i];
      const windfallSnap = windfallSchedule[i];

      if (!activeSnap && !baseSnap) break;

      const dateStr = activeSnap?.dateFormatted || baseSnap?.dateFormatted || `M${i + 1}`;

      // Cumulative interest
      if (activeSnap) activeCumInterest += activeSnap.totalInterestCharged;
      if (baseSnap) baselineCumInterest += baseSnap.totalInterestCharged;

      const point: TimelineChartPoint = {
        monthIndex: i + 1,
        date: dateStr,
        activeBalance: activeSnap ? activeSnap.totalEndingBalance : 0,
        baselineBalance: baseSnap ? baseSnap.totalEndingBalance : 0,
        windfallBalance: windfallSnap ? windfallSnap.totalEndingBalance : null,
        activeInterestCumulative: Number(activeCumInterest.toFixed(0)),
        baselineInterestCumulative: Number(baselineCumInterest.toFixed(0)),
        milestone: activeSnap?.paidOffDebtsThisMonth?.length
          ? activeSnap.paidOffDebtsThisMonth.join(', ')
          : null,
      };

      // Individual debt balances for stacked view
      if (activeSnap) {
        activeSnap.payments.forEach((p) => {
          point[p.debtName] = p.endBalance;
        });
      }

      data.push(point);
    }

    return data;
  }, [activePlan, comparison, debts]);

  // Prairie-tuned color palette for individual debts in stacked view
  const debtColors = ['#15803d', '#d97706', '#0284c7', '#e11d48', '#b45309', '#0d9488', '#7c3aed'];

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full bg-white/95 border-amber-200/90 shadow-xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Debt Paydown Trajectory
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Interactive Forecast
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Visualize your balance declining to zero under your active strategy vs minimums baseline.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-amber-100/70 p-1 rounded-xl border border-amber-200 self-start sm:self-auto">
          <button
            onClick={() => setChartView('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartView === 'balance'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balance Curve
          </button>
          <button
            onClick={() => setChartView('cumulative_interest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartView === 'cumulative_interest'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interest Comparison
          </button>
          <button
            onClick={() => setChartView('stacked_debts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartView === 'stacked_debts'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Account
          </button>
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'balance' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, 0)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-amber-200 shadow-xl text-xs text-slate-800">
                        <div className="font-bold text-slate-900 border-b border-amber-100 pb-1.5 mb-2 flex items-center justify-between gap-4">
                          <span>{label}</span>
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Month {dataPoint.monthIndex}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              Active Plan ({activePlan.strategy}):
                            </span>
                            <span className="font-black text-slate-900">
                              {formatCurrency(dataPoint.activeBalance)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Minimums Only:
                            </span>
                            <span className="font-semibold text-slate-600">
                              {formatCurrency(dataPoint.baselineBalance)}
                            </span>
                          </div>
                          {dataPoint.milestone && (
                            <div className="mt-2 pt-1.5 border-t border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
                              <Flag className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid Off: {dataPoint.milestone}!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="activeBalance"
                name={`Accelerated Plan (${activePlan.strategy})`}
                stroke="#15803d"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activeGrad)"
              />
              <Area
                type="monotone"
                dataKey="baselineBalance"
                name="Minimum Payments Baseline"
                stroke="#e11d48"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#baselineGrad)"
              />
            </AreaChart>
          ) : chartView === 'cumulative_interest' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, 0)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    const diff = dataPoint.baselineInterestCumulative - dataPoint.activeInterestCumulative;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-amber-200 shadow-xl text-xs text-slate-800">
                        <div className="font-bold text-slate-900 border-b border-amber-100 pb-1.5 mb-2">
                          {label} — Total Interest Paid to Date
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between gap-4 text-emerald-800 font-semibold">
                            <span>Accelerated Plan:</span>
                            <span className="font-black text-emerald-800">{formatCurrency(dataPoint.activeInterestCumulative)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-rose-700 font-medium">
                            <span>Baseline Minimums:</span>
                            <span className="font-semibold text-rose-700">{formatCurrency(dataPoint.baselineInterestCumulative)}</span>
                          </div>
                          {diff > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-emerald-200 text-emerald-800 font-black flex justify-between">
                              <span>Cumulative Saved:</span>
                              <span>+{formatCurrency(diff)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="activeInterestCumulative"
                name="Optimized Plan Cumulative Interest"
                stroke="#15803d"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="baselineInterestCumulative"
                name="Minimums Cumulative Interest"
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, 0)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-amber-200 shadow-xl text-xs text-slate-800">
                        <div className="font-bold text-slate-900 border-b border-amber-100 pb-1.5 mb-2">
                          {label} — Balances by Account
                        </div>
                        <div className="space-y-1">
                          {payload.map((item, idx: number) => (
                            <div key={idx} className="flex justify-between gap-4">
                              <span style={{ color: item.color }} className="font-semibold">
                                {String(item.name)}:
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(Number(item.value) || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 11 }} />
              {debts.map((debt, index) => (
                <Area
                  key={debt.id}
                  type="monotone"
                  dataKey={debt.name}
                  name={debt.name}
                  stackId="1"
                  stroke={debtColors[index % debtColors.length]}
                  fill={debtColors[index % debtColors.length]}
                  fillOpacity={0.7}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Payoff Milestones Timeline Bar */}
      {activePlan.milestones.length > 0 && (
        <div className="mt-5 pt-4 border-t border-amber-200/80">
          <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Elimination Milestone Order:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activePlan.milestones.map((m, idx) => (
              <div
                key={m.debtId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-50 border border-amber-200/90 shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-800">{m.debtName}</span>
                <span className="text-amber-800 font-semibold">({m.paidOffDate})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
