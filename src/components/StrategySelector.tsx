'use client';

import React from 'react';
import { useDebt } from '@/context/DebtContext';
import { OptimizationStrategy } from '@/types/debt';
import { Zap, Flame, Sliders, AlertTriangle, ArrowRight, Check } from 'lucide-react';

export const StrategySelector: React.FC = () => {
  const { strategy, setStrategy, comparison, formatCurrency } = useDebt();

  const strategies: Array<{
    id: OptimizationStrategy;
    name: string;
    badge: string;
    badgeColor: string;
    icon: React.ReactNode;
    description: string;
    totalInterest: number;
    debtFreeDate: string;
    totalMonths: number;
    isOptimal?: boolean;
    isWarning?: boolean;
  }> = [
    {
      id: 'avalanche',
      name: 'Debt Avalanche',
      badge: 'Mathematical Optimum',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: <Zap className="w-4 h-4 text-emerald-500" />,
      description: 'Targets highest APR first. Minimizes total interest and finishes fastest mathematically.',
      totalInterest: comparison.avalanche.totalInterestPaid,
      debtFreeDate: comparison.avalanche.debtFreeDate,
      totalMonths: comparison.avalanche.totalMonths,
      isOptimal: true,
    },
    {
      id: 'snowball',
      name: 'Debt Snowball',
      badge: 'Psychological Momentum',
      badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      icon: <Flame className="w-4 h-4 text-cyan-500" />,
      description: 'Targets lowest balance first. Gives fast milestone wins to build unstoppable motivation.',
      totalInterest: comparison.snowball.totalInterestPaid,
      debtFreeDate: comparison.snowball.debtFreeDate,
      totalMonths: comparison.snowball.totalMonths,
    },
    {
      id: 'custom',
      name: 'Custom Priority',
      badge: 'Manual Order',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      icon: <Sliders className="w-4 h-4 text-purple-500" />,
      description: 'Pay down according to your personalized account priority rankings.',
      totalInterest: comparison.custom?.totalInterestPaid || 0,
      debtFreeDate: comparison.custom?.debtFreeDate || '—',
      totalMonths: comparison.custom?.totalMonths || 0,
    },
    {
      id: 'minimums_only',
      name: 'Minimums Only',
      badge: 'Costly Baseline',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
      description: 'No extra payments applied. The slowest and most expensive trajectory.',
      totalInterest: comparison.baselineMinimums.totalInterestPaid,
      debtFreeDate: comparison.baselineMinimums.debtFreeDate,
      totalMonths: comparison.baselineMinimums.totalMonths,
      isWarning: true,
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Optimization Strategy</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              (Choose payoff algorithm)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare how different allocation rules drastically alter your interest paid and debt-free date.
          </p>
        </div>

        {/* Delta Callout */}
        {comparison.avalancheVsSnowballInterestSaved > 0 && (
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <Zap className="w-3 h-3 fill-current" />
            <span>
              Avalanche saves <strong>{formatCurrency(comparison.avalancheVsSnowballInterestSaved)}</strong> more than Snowball!
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {strategies.map((strat) => {
          const isSelected = strategy === strat.id;

          return (
            <button
              key={strat.id}
              onClick={() => setStrategy(strat.id)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                  : 'glass-panel hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {strat.icon}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{strat.name}</span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${strat.badgeColor}`}
                  >
                    {strat.badge}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed mb-4 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {strat.description}
                </p>
              </div>

              {/* Bottom Metrics Bar */}
              <div
                className={`pt-3 border-t text-xs flex items-center justify-between ${
                  isSelected ? 'border-slate-700' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Debt Free
                  </div>
                  <div className="font-bold text-sm">{strat.debtFreeDate}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Interest Paid
                  </div>
                  <div
                    className={`font-bold text-sm ${
                      strat.isOptimal
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : strat.isWarning
                        ? 'text-rose-500 dark:text-rose-400'
                        : ''
                    }`}
                  >
                    {formatCurrency(strat.totalInterest)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
