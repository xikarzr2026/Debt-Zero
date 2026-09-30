'use client';

import React, { useState, useEffect } from 'react';
import { DebtItem, DebtCategory } from '@/types/debt';
import { DEBT_CATEGORY_LABELS } from '@/lib/presets';
import { X } from 'lucide-react';

interface AddEditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<DebtItem, 'id'>, id?: string) => void;
  editingDebt?: DebtItem | null;
}

export const AddEditDebtModal: React.FC<AddEditDebtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDebt,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DebtCategory>('credit_card');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dueDate, setDueDate] = useState('15');
  const [notes, setNotes] = useState('');
  const [customPriority, setCustomPriority] = useState('1');

  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
      setCategory(editingDebt.category);
      setBalance(String(editingDebt.balance));
      setApr(String(editingDebt.apr));
      setMinPayment(String(editingDebt.minPayment));
      setDueDate(String(editingDebt.dueDate || 15));
      setNotes(editingDebt.notes || '');
      setCustomPriority(String(editingDebt.customPriority || 1));
    } else {
      setName('');
      setCategory('credit_card');
      setBalance('');
      setApr('24.99');
      setMinPayment('');
      setDueDate('15');
      setNotes('');
      setCustomPriority('1');
    }
  }, [editingDebt, isOpen]);

  // When changing category for a new debt, prepopulate typical APR
  const handleCategoryChange = (newCat: DebtCategory) => {
    setCategory(newCat);
    if (!editingDebt) {
      const typical = DEBT_CATEGORY_LABELS[newCat]?.typicalApr;
      if (typical) setApr(String(typical));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !balance) return;

    const numBalance = parseFloat(balance) || 0;
    const numApr = parseFloat(apr) || 0;
    const numMin = parseFloat(minPayment) || Math.max(25, numBalance * 0.02);

    const payload: Omit<DebtItem, 'id'> = {
      name: name.trim(),
      category,
      balance: numBalance,
      apr: numApr,
      minPayment: numMin,
      dueDate: parseInt(dueDate) || 15,
      customPriority: parseInt(customPriority) || 1,
      notes: notes.trim(),
      color: DEBT_CATEGORY_LABELS[category]?.defaultColor || '#d97706',
    };

    onSave(payload, editingDebt?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white border-2 border-amber-200 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-amber-200">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {editingDebt ? 'Edit Liability' : 'Add New Liability'}
            </h3>
            <p className="text-xs text-slate-600">
              Enter loan or credit details for debt payoff optimization.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Debt Type Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(DEBT_CATEGORY_LABELS) as DebtCategory[]).map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold text-left border transition-all truncate shadow-2xs ${
                      isSelected
                        ? 'bg-emerald-100 border-2 border-emerald-600 text-emerald-950'
                        : 'bg-amber-50/60 border-amber-200 text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {DEBT_CATEGORY_LABELS[cat].label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Debt Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Account / Creditor Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Visa Infinite, Student Loan, Mortgage"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 shadow-2xs"
            />
          </div>

          {/* Current Balance & APR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Current Balance Owed ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-bold shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Interest Rate (APR %) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="99"
                required
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                placeholder="e.g. 19.99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-bold shadow-2xs"
              />
            </div>
          </div>

          {/* Minimum Monthly Payment & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Minimum Monthly Payment ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-bold shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Due Date (Day of Month)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="15"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-semibold shadow-2xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Optional Notes / Promotion Details
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 0% promo expires Dec 2026, or account number"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              {editingDebt ? 'Save Changes' : 'Add Liability'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
