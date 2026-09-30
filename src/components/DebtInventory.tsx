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
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'auto_loan':
        return <Car className="w-4 h-4 text-sky-600" />;
      case 'student_loan':
        return <GraduationCap className="w-4 h-4 text-amber-600" />;
      case 'mortgage':
        return <Home className="w-4 h-4 text-emerald-600" />;
      case 'personal_loan':
        return <Landmark className="w-4 h-4 text-amber-700" />;
      case 'medical':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      default:
        return <Coins className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full bg-white/95 border-amber-200/90 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Liabilities & Debt Inventory
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {debts.length} active
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage your revolving cards, installments, and loans.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Liability</span>
        </button>
      </div>

      {/* Negative Amortization Alert Banner */}
      {negativeAmortAlerts.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-900 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-black text-sm text-rose-700">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>Critical Warning: Negative Amortization Detected!</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            The minimum payment on the following accounts is smaller than the monthly interest accruing.
            Your balance will grow every month if you only pay the minimum:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {negativeAmortAlerts.map((alert) => (
              <div
                key={alert.debtId}
                className="p-3 rounded-lg bg-white border border-rose-300 text-xs flex justify-between items-center shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{alert.debtName}</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Interest: {formatCurrency(alert.interestAccruing)}/mo vs Min Payment: {formatCurrency(alert.minPayment)}/mo
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-rose-700 uppercase font-black">Suggested Min</div>
                  <div className="font-black text-slate-900">
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
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/30">
          <Coins className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-slate-800">No active liabilities found</h4>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            You are currently debt-free, or you can add your active accounts or load a preset above to begin.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20"
          >
            Add Your First Liability
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-amber-200/80 shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-amber-200 bg-amber-50/70 text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                <th className="py-3 pl-3">Account Name</th>
                <th className="py-3">Type</th>
                <th className="py-3 text-right">Balance</th>
                <th className="py-3 text-right">APR</th>
                <th className="py-3 text-right">Min Payment</th>
                <th className="py-3 text-center">Due Day</th>
                {strategy === 'custom' && <th className="py-3 text-center">Priority</th>}
                <th className="py-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-xs bg-white">
              {debts.map((debt, index) => {
                const isHighApr = debt.apr >= 20;
                const isMidApr = debt.apr >= 12 && debt.apr < 20;

                return (
                  <tr
                    key={debt.id}
                    className="hover:bg-amber-50/60 transition-colors group"
                  >
                    {/* Account Name */}
                    <td className="py-3.5 pl-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: debt.color || '#d97706' }} />
                        <span>{debt.name}</span>
                      </div>
                      {debt.notes && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                          {debt.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(debt.category)}
                        <span className="capitalize">{debt.category.replace('_', ' ')}</span>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 text-right font-black text-slate-900">
                      {formatCurrency(debt.balance)}
                    </td>

                    {/* APR */}
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                          isHighApr
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isMidApr
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {debt.apr}%
                      </span>
                    </td>

                    {/* Minimum Payment */}
                    <td className="py-3.5 text-right font-bold text-slate-800">
                      {formatCurrency(debt.minPayment)}/mo
                    </td>

                    {/* Due Day */}
                    <td className="py-3.5 text-center text-slate-600 font-medium">
                      {debt.dueDate ? `${debt.dueDate}th` : '15th'}
                    </td>

                    {/* Custom Priority Reordering */}
                    {strategy === 'custom' && (
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => movePriority(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-amber-100 text-slate-600 disabled:opacity-30"
                            title="Move Up Priority"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs px-1.5 text-slate-800">{index + 1}</span>
                          <button
                            onClick={() => movePriority(index, 'down')}
                            disabled={index === debts.length - 1}
                            className="p-1 rounded hover:bg-amber-100 text-slate-600 disabled:opacity-30"
                            title="Move Down Priority"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3.5 text-right pr-3">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(debt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-amber-100 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateDebt(debt.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-amber-100 transition-colors"
                          title="Duplicate Account"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
              <tr className="border-t-2 border-amber-300 font-black text-xs text-slate-900 bg-amber-50/50">
                <td className="py-3 pl-3">Total Combined</td>
                <td className="py-3 text-slate-600 font-semibold">{debts.length} liabilities</td>
                <td className="py-3 text-right">{formatCurrency(totalBalance)}</td>
                <td className="py-3 text-right text-amber-800">
                  {totalBalance > 0
                    ? `${(debts.reduce((s, d) => s + d.balance * d.apr, 0) / totalBalance).toFixed(1)}%`
                    : '0%'}
                </td>
                <td className="py-3 text-right">{formatCurrency(totalMin)}/mo</td>
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
