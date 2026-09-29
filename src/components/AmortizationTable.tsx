'use client';

import React, { useState, useMemo } from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Filter,
  Flag,
  FileSpreadsheet,
} from 'lucide-react';

export const AmortizationTable: React.FC = () => {
  const { activePlan, formatCurrency, strategy } = useDebt();

  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 1: true });
  const [visibleCount, setVisibleCount] = useState(24);
  const [searchTerm, setSearchTerm] = useState('');

  const schedule = activePlan.schedule || [];

  const toggleMonth = (monthIndex: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthIndex]: !prev[monthIndex],
    }));
  };

  const filteredSchedule = useMemo(() => {
    if (!searchTerm.trim()) return schedule;
    const term = searchTerm.toLowerCase();
    return schedule.filter(
      (s) =>
        s.dateFormatted.toLowerCase().includes(term) ||
        String(s.monthIndex).includes(term) ||
        s.paidOffDebtsThisMonth.some((d) => d.toLowerCase().includes(term)) ||
        s.payments.some((p) => p.debtName.toLowerCase().includes(term))
    );
  }, [schedule, searchTerm]);

  const visibleSchedule = filteredSchedule.slice(0, visibleCount);

  // Export CSV
  const handleExportCSV = () => {
    if (schedule.length === 0) return;

    const headers = [
      'Month #',
      'Date',
      'Account Name',
      'Starting Balance',
      'Interest Charged',
      'Principal Paid',
      'Minimum Payment',
      'Extra Payment',
      'Total Payment',
      'Ending Balance',
      'Paid Off Flag',
    ];

    const rows: string[][] = [];

    schedule.forEach((s) => {
      s.payments.forEach((p) => {
        rows.push([
          String(s.monthIndex),
          s.dateFormatted,
          `"${p.debtName}"`,
          p.startBalance.toFixed(2),
          p.interestCharged.toFixed(2),
          p.principalPaid.toFixed(2),
          p.minPayment.toFixed(2),
          p.extraPayment.toFixed(2),
          p.totalPayment.toFixed(2),
          p.endBalance.toFixed(2),
          p.isPaidOffThisMonth ? 'YES - DEBT ELIMINATED' : '',
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `debtzero-amortization-${strategy}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Amortization Waterfall Schedule
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {schedule.length} months total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full ledger showing compound interest, principal reduction, and balances month by month.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search month or card..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Download Amortization Table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Waterfall Schedule Table */}
      {visibleSchedule.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No months matched your search term.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSchedule.map((snap) => {
            const isExpanded = !!expandedMonths[snap.monthIndex];
            const hasMilestone = snap.paidOffDebtsThisMonth.length > 0;

            return (
              <div
                key={snap.monthIndex}
                className={`rounded-xl border transition-all ${
                  hasMilestone
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/30'
                }`}
              >
                {/* Month Summary Header Row */}
                <div
                  onClick={() => toggleMonth(snap.monthIndex)}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-slate-200">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Month {snap.monthIndex}: {snap.dateFormatted}
                        </span>
                        {hasMilestone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Flag className="w-2.5 h-2.5" />
                            {snap.paidOffDebtsThisMonth.join(', ')} PAID OFF!
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {snap.remainingDebtsCount} accounts remaining
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Payment</div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(snap.totalPayment)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Interest</div>
                      <div className="font-semibold text-rose-500">
                        {formatCurrency(snap.totalInterestCharged)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Principal</div>
                      <div className="font-semibold text-emerald-500">
                        {formatCurrency(snap.totalPrincipalPaid)}
                      </div>
                    </div>

                    <div className="min-w-20">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">End Balance</div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(snap.totalEndingBalance)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Account Level Detail */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 pl-2">Account</th>
                          <th className="py-2 text-right">Start Balance</th>
                          <th className="py-2 text-right">Interest</th>
                          <th className="py-2 text-right">Min Paid</th>
                          <th className="py-2 text-right">Extra Applied</th>
                          <th className="py-2 text-right">Total Payment</th>
                          <th className="py-2 text-right pr-2">End Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {snap.payments.map((p) => (
                          <tr
                            key={p.debtId}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                              p.isPaidOffThisMonth ? 'bg-emerald-500/10 font-bold' : ''
                            }`}
                          >
                            <td className="py-2 pl-2 font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                              <span>{p.debtName}</span>
                              {p.isPaidOffThisMonth && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-white font-extrabold">
                                  PAID OFF
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right text-slate-500">
                              {formatCurrency(p.startBalance)}
                            </td>
                            <td className="py-2 text-right text-rose-500">
                              +{formatCurrency(p.interestCharged)}
                            </td>
                            <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                              {formatCurrency(p.minPayment)}
                            </td>
                            <td className="py-2 text-right text-emerald-500 font-semibold">
                              {p.extraPayment > 0 ? `+${formatCurrency(p.extraPayment)}` : '—'}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(p.totalPayment)}
                            </td>
                            <td className="py-2 text-right pr-2 font-bold text-slate-900 dark:text-white">
                              {formatCurrency(p.endBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Show more months pagination button */}
      {visibleSchedule.length < filteredSchedule.length && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Show Next 24 Months ({filteredSchedule.length - visibleSchedule.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
