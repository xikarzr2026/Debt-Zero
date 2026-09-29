'use client';

import React from 'react';
import { useDebt } from '@/context/DebtContext';
import { PayFrequency } from '@/types/debt';
import {
  X,
  Wallet,
  Home,
  Zap,
  ShoppingBag,
  Car,
  Shield,
  Tv,
  Coins,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    updateProfile,
    updateExpensesBreakdown,
    freeCashFlowData,
    formatCurrency,
    debts,
  } = useDebt();

  if (!isOpen) return null;

  const handleFrequencyChange = (freq: PayFrequency) => {
    updateProfile({ payFrequency: freq });
  };

  const handleIncomeChange = (val: number) => {
    updateProfile({ incomePerPeriod: Math.max(0, val) });
  };

  const handleManualSurplusChange = (val: number) => {
    updateProfile({ manualExtraMonthlySurplus: Math.max(0, val) });
  };

  const breakdown = profile.expensesBreakdown || {
    housing: 0,
    utilities: 0,
    groceries: 0,
    transportation: 0,
    insurance: 0,
    subscriptions: 0,
    other: 0,
  };

  const totalMinDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Income & Cash Flow Architecture
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determine your true discretionary debt-acceleration surplus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-5">
          {/* Section 1: Net Take-Home Pay */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Take-Home Income
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pay Frequency
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['monthly', 'bi-weekly', 'semi-monthly', 'weekly'] as PayFrequency[]).map(
                    (freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => handleFrequencyChange(freq)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-medium border capitalize text-left transition-all ${
                          profile.payFrequency === freq
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {freq.replace('-', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Net Paycheck (Take-home amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={profile.incomePerPeriod || ''}
                    onChange={(e) => handleIncomeChange(Number(e.target.value))}
                    placeholder="e.g. 2600"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Calculated Monthly Average:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(freeCashFlowData.monthlyIncome)}/mo
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Essential Living Expenses Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Recurring Household Expenses (Separate from debts)
              </h4>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Total: {formatCurrency(freeCashFlowData.livingExpenses)}/mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Housing (Rent / Base Mortgage)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.housing || ''}
                  onChange={(e) => updateExpensesBreakdown('housing', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Utilities (Electric, Water, Wifi)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.utilities || ''}
                  onChange={(e) => updateExpensesBreakdown('utilities', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Groceries & Food Supplies</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.groceries || ''}
                  onChange={(e) => updateExpensesBreakdown('groceries', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Car className="w-3.5 h-3.5 text-sky-400" />
                  <span>Transit & Gas (Excluding car loan)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.transportation || ''}
                  onChange={(e) => updateExpensesBreakdown('transportation', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Insurance (Health, Auto, Home)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.insurance || ''}
                  onChange={(e) => updateExpensesBreakdown('insurance', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Tv className="w-3.5 h-3.5 text-pink-400" />
                  <span>Subscriptions & Phone Plan</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.subscriptions || ''}
                  onChange={(e) => updateExpensesBreakdown('subscriptions', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Free Cash Flow Mathematical Bridge */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>3. Discretionary Debt Snowball / Avalanche Capacity</span>
            </h4>

            {/* Formula Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Monthly Income</div>
                <div className="font-bold text-sm text-emerald-400">
                  +{formatCurrency(freeCashFlowData.monthlyIncome)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Living Costs</div>
                <div className="font-bold text-sm text-rose-400">
                  -{formatCurrency(freeCashFlowData.livingExpenses)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Debt Minimums</div>
                <div className="font-bold text-sm text-amber-400">
                  -{formatCurrency(totalMinDebtPayments)}
                </div>
              </div>
            </div>

            {/* Free Cash Flow Result */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div>
                <div className="font-bold text-sm">Calculated Free Cash Flow:</div>
                <div className="text-xs text-slate-400">
                  {freeCashFlowData.isDeficit
                    ? 'Deficit: Monthly expenses exceed income.'
                    : 'Surplus cash available to accelerate payoff.'}
                </div>
              </div>
              <div
                className={`text-xl font-extrabold ${
                  freeCashFlowData.isDeficit ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(freeCashFlowData.freeCashFlow)}/mo
              </div>
            </div>

            {/* Custom Extra Channeled into Debt */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-slate-200">
                  Extra Monthly Payoff Target (Surplus applied)
                </span>
                <p className="text-[11px] text-slate-400">
                  You can override or manually target how much extra to channel.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={profile.manualExtraMonthlySurplus ?? freeCashFlowData.freeCashFlow}
                  onChange={(e) => handleManualSurplusChange(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              Done & Apply to Payoff Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
