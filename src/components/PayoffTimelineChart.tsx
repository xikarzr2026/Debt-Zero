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
import { TrendingDown, Flag, CheckCircle, Sparkles, Layers } from 'lucide-react';

export const PayoffTimelineChart: React.FC = () => {
  const {
    activePlan,
    comparison,
    formatCurrency,
    strategy,
    windfall,
    debts,
    theme,
  } = useDebt();

  const [chartView, setChartView] = useState<'balance' | 'cumulative_interest' | 'stacked_debts'>(
    'balance'
  );

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

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

    const data: any[] = [];

    // Initial point (Month 0 / Today)
    const initialTotalBalance = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
    const initialPoint: any = {
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

      const point: any = {
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

  // Color palette for individual debts in stacked view
  const debtColors = ['#10b981', '#38bdf8', '#818cf8', '#f43f5e', '#fb923c', '#facc15', '#a855f7'];

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Debt Paydown Trajectory
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Interactive Forecast
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize your balance declining to zero under your active strategy vs minimums baseline.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setChartView('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chartView === 'balance'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Balance Curve
          </button>
          <button
            onClick={() => setChartView('cumulative_interest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chartView === 'cumulative_interest'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Interest Comparison
          </button>
          <button
            onClick={() => setChartView('stacked_debts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chartView === 'stacked_debts'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
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
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs">
                        <div className="font-bold text-slate-900 dark:text-white border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                          <span>{label}</span>
                          <span className="text-[10px] text-slate-400">
                            Month {dataPoint.monthIndex}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Active Plan ({activePlan.strategy}):
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(dataPoint.activeBalance)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-rose-400">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              Minimums Only:
                            </span>
                            <span className="font-medium text-slate-400">
                              {formatCurrency(dataPoint.baselineBalance)}
                            </span>
                          </div>
                          {dataPoint.milestone && (
                            <div className="mt-2 pt-1 border-t border-slate-700/80 text-emerald-400 font-semibold flex items-center gap-1">
                              <Flag className="w-3 h-3" />
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
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activeGrad)"
              />
              <Area
                type="monotone"
                dataKey="baselineBalance"
                name="Minimum Payments Baseline"
                stroke="#f43f5e"
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
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs">
                        <div className="font-bold text-slate-900 dark:text-white border-b border-slate-700 pb-1 mb-1.5">
                          {label} — Total Interest Paid to Date
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4 text-emerald-500">
                            <span>Accelerated Plan:</span>
                            <span className="font-bold">{formatCurrency(dataPoint.activeInterestCumulative)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-rose-400">
                            <span>Baseline Minimums:</span>
                            <span className="font-bold">{formatCurrency(dataPoint.baselineInterestCumulative)}</span>
                          </div>
                          {diff > 0 && (
                            <div className="mt-1.5 pt-1 border-t border-slate-700 text-emerald-400 font-bold flex justify-between">
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
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="baselineInterestCumulative"
                name="Minimums Cumulative Interest"
                stroke="#f43f5e"
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
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs">
                        <div className="font-bold text-slate-900 dark:text-white border-b border-slate-700 pb-1 mb-1.5">
                          {label} — Balances by Account
                        </div>
                        <div className="space-y-1">
                          {payload.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-4">
                              <span style={{ color: item.color }} className="font-medium">
                                {item.name}:
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(item.value)}
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
                  fillOpacity={0.65}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Payoff Milestones Timeline Bar */}
      {activePlan.milestones.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-emerald-500" />
            <span>Elimination Milestone Order:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activePlan.milestones.map((m, idx) => (
              <div
                key={m.debtId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{m.debtName}</span>
                <span className="text-slate-400 font-medium">({m.paidOffDate})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
