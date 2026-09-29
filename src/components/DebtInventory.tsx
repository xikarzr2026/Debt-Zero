'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { DebtItem, DebtCategory } from '@/types/debt';
import { DEBT_CATEGORY_LABELS } from '@/lib/presets';
import { AddEditDebtModal } from './AddEditDebtModal';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Landmark,
  Car,
  GraduationCap,
  Home,
  HeartPulse,
  Coins,
  ShieldAlert,
  Percent,
  Calendar,
} from 'lucide-react';

export const DebtInventory: React.FC = () => {
  const {
    debts,
    deleteDebt,
    duplicateDebt,
    addDebt,
    updateDebt,
    formatCurrency,
    negativeAmortAlerts,
    strategy,
  } = useDebt();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingDebt(debt);
    setModalOpen(true);
  };

  const handleSaveDebt = (debtData: Omit<DebtItem, 'id'>, id?: string) => {
    if (id) {
      updateDebt(id, debtData);
    } else {
      addDebt(debtData);
    }
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === debts.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...debts];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-assign customPriority indices
    updated.forEach((d, i) => {
      updateDebt(d.id, { customPriority: i + 1 });
    });
  };

  const totalBalance = debts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const totalMin = debts.reduce((s, d) => s + (Number(d.minPayment) || 0), 0);

  const getCategoryIcon = (category: DebtCategory) => {
    switch (category) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'auto_loan':
        return <Car className="w-4 h-4 text-sky-400" />;
      case 'student_loan':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'mortgage':
        return <Home className="w-4 h-4 text-emerald-400" />;
      case 'personal_loan':
        return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'medical':
        return <HeartPulse className="w-4 h-4 text-pink-400" />;
      default:
        return <Coins className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Liabilities & Debt Inventory
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {debts.length} active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your revolving cards, installments, and loans.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Liability</span>
        </button>
      </div>

      {/* Negative Amortization Alert Banner */}
      {negativeAmortAlerts.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>Critical Warning: Negative Amortization Detected!</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The minimum payment on the following accounts is smaller than the monthly interest accruing.
            Your balance will grow every month if you only pay the minimum:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {negativeAmortAlerts.map((alert) => (
              <div
                key={alert.debtId}
                className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/80 border border-rose-500/20 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{alert.debtName}</div>
                  <div className="text-[11px] text-slate-500">
                    Interest: {formatCurrency(alert.interestAccruing)}/mo vs Min Payment: {formatCurrency(alert.minPayment)}/mo
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-rose-500 uppercase font-bold">Suggested Min</div>
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(alert.recommendedMinimum)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debts Table / Cards */}
      {debts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <Coins className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No active liabilities found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You are currently debt-free, or you can add your active accounts or load a preset above to begin.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            Add Your First Liability
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Account Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-right">Balance</th>
                <th className="pb-3 text-right">APR</th>
                <th className="pb-3 text-right">Min Payment</th>
                <th className="pb-3 text-center">Due Day</th>
                {strategy === 'custom' && <th className="pb-3 text-center">Priority</th>}
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {debts.map((debt, index) => {
                const isHighApr = debt.apr >= 20;
                const isMidApr = debt.apr >= 12 && debt.apr < 20;

                return (
                  <tr
                    key={debt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Account Name */}
                    <td className="py-3.5 pl-2 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: debt.color || '#38bdf8' }} />
                        <span>{debt.name}</span>
                      </div>
                      {debt.notes && (
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                          {debt.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(debt.category)}
                        <span className="capitalize">{debt.category.replace('_', ' ')}</span>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(debt.balance)}
                    </td>

                    {/* APR */}
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          isHighApr
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : isMidApr
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {debt.apr}%
                      </span>
                    </td>

                    {/* Minimum Payment */}
                    <td className="py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(debt.minPayment)}/mo
                    </td>

                    {/* Due Day */}
                    <td className="py-3.5 text-center text-slate-500 dark:text-slate-400">
                      {debt.dueDate ? `${debt.dueDate}th` : '15th'}
                    </td>

                    {/* Custom Priority Reordering */}
                    {strategy === 'custom' && (
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => movePriority(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                            title="Move Up Priority"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs px-1.5">{index + 1}</span>
                          <button
                            onClick={() => movePriority(index, 'down')}
                            disabled={index === debts.length - 1}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                            title="Move Down Priority"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(debt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateDebt(debt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Duplicate Account"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
                <td className="pt-3 pl-2">Total Combined</td>
                <td className="pt-3 text-slate-400">{debts.length} liabilities</td>
                <td className="pt-3 text-right">{formatCurrency(totalBalance)}</td>
                <td className="pt-3 text-right text-amber-500">
                  {totalBalance > 0
                    ? `${(debts.reduce((s, d) => s + d.balance * d.apr, 0) / totalBalance).toFixed(1)}%`
                    : '0%'}
                </td>
                <td className="pt-3 text-right">{formatCurrency(totalMin)}/mo</td>
                <td colSpan={strategy === 'custom' ? 3 : 2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      <AddEditDebtModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
      />
    </div>
  );
};
