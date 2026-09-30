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

  const totalMinDebtPayments = freeCashFlowData.totalMinimumDebtPayments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border-2 border-amber-200 shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Income & Cash Flow Architecture
              </h3>
              <p className="text-xs text-slate-600">
                Determine your true discretionary debt-acceleration surplus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-5">
          {/* Section 1: Net Take-Home Pay */}
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
              1. Take-Home Income
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Pay Frequency
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['monthly', 'bi-weekly', 'semi-monthly', 'weekly'] as PayFrequency[]).map(
                    (freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => handleFrequencyChange(freq)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border capitalize text-left transition-all ${
                          profile.payFrequency === freq
                            ? 'bg-emerald-100 border-2 border-emerald-600 text-emerald-950 shadow-2xs'
                            : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        {freq.replace('-', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Net Paycheck (Take-home amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={profile.incomePerPeriod || ''}
                    onChange={(e) => handleIncomeChange(Number(e.target.value))}
                    placeholder="e.g. 2600"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-900 font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                  />
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-1.5">
                  Calculated Monthly Average:{' '}
                  <strong className="text-emerald-800 font-black">
                    {formatCurrency(freeCashFlowData.monthlyIncome)}/mo
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Essential Living Expenses Breakdown */}
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                2. Recurring Household Expenses (Separate from debts)
              </h4>
              <span className="text-xs font-black text-slate-900">
                Total: {formatCurrency(freeCashFlowData.livingExpenses)}/mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>Housing (Rent / Base Mortgage)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.housing || ''}
                  onChange={(e) => updateExpensesBreakdown('housing', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Utilities (Electric, Water, Wifi)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.utilities || ''}
                  onChange={(e) => updateExpensesBreakdown('utilities', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Groceries & Food Supplies</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.groceries || ''}
                  onChange={(e) => updateExpensesBreakdown('groceries', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Car className="w-3.5 h-3.5 text-sky-600" />
                  <span>Transit & Gas (Excluding car loan)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.transportation || ''}
                  onChange={(e) => updateExpensesBreakdown('transportation', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Insurance (Health, Auto, Home)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.insurance || ''}
                  onChange={(e) => updateExpensesBreakdown('insurance', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Tv className="w-3.5 h-3.5 text-rose-600" />
                  <span>Subscriptions & Phone Plan</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.subscriptions || ''}
                  onChange={(e) => updateExpensesBreakdown('subscriptions', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-slate-900 font-bold focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Free Cash Flow Mathematical Bridge */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-50 border-2 border-emerald-500/40 text-slate-900 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span>3. Discretionary Debt Snowball / Avalanche Capacity</span>
            </h4>

            {/* Formula Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Monthly Income</div>
                <div className="font-black text-sm text-emerald-800">
                  +{formatCurrency(freeCashFlowData.monthlyIncome)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Living Costs</div>
                <div className="font-black text-sm text-rose-700">
                  -{formatCurrency(freeCashFlowData.livingExpenses)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Debt Minimums</div>
                <div className="font-black text-sm text-amber-800">
                  -{formatCurrency(totalMinDebtPayments)}
                </div>
              </div>
            </div>

            {/* Free Cash Flow Result */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border-2 border-emerald-600 shadow-xs">
              <div>
                <div className="font-black text-sm text-slate-900">Calculated Free Cash Flow:</div>
                <div className="text-xs text-slate-600">
                  {freeCashFlowData.isDeficit
                    ? 'Deficit: Monthly expenses exceed income.'
                    : 'Surplus cash available to accelerate payoff.'}
                </div>
              </div>
              <div
                className={`text-xl font-black ${
                  freeCashFlowData.isDeficit ? 'text-rose-700' : 'text-emerald-800'
                }`}
              >
                {formatCurrency(freeCashFlowData.freeCashFlow)}/mo
              </div>
            </div>

            {/* Custom Extra Channeled into Debt */}
            <div className="pt-2 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  Extra Monthly Payoff Target (Surplus applied)
                </span>
                <p className="text-[11px] text-slate-600">
                  You can override or manually target how much extra to channel.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-800 font-black text-base">$</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={profile.manualExtraMonthlySurplus ?? freeCashFlowData.freeCashFlow}
                  onChange={(e) => handleManualSurplusChange(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white border-2 border-emerald-600 text-slate-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              Done & Apply to Payoff Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
