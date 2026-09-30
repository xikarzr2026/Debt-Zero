'use client';

import React, { useState, useMemo } from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Flag,
} from 'lucide-react';

export const AmortizationTable: React.FC = () => {
  const { activePlan, formatCurrency, strategy } = useDebt();

  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 1: true });
  const [visibleCount, setVisibleCount] = useState(24);
  const [searchTerm, setSearchTerm] = useState('');

  const schedule = useMemo(() => activePlan.schedule || [], [activePlan.schedule]);

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
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full bg-white/95 border-amber-200/90 shadow-xs">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Amortization Waterfall Schedule
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {schedule.length} months total
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
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
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 shadow-2xs"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
            title="Download Amortization Table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Waterfall Schedule Table */}
      {visibleSchedule.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 bg-amber-50/30 rounded-xl border border-amber-200">
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
                    ? 'border-2 border-emerald-500/60 bg-emerald-50/40 shadow-xs'
                    : 'border-amber-200/80 bg-white shadow-2xs'
                }`}
              >
                {/* Month Summary Header Row */}
                <div
                  onClick={() => toggleMonth(snap.monthIndex)}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-amber-50/50 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-amber-800 hover:text-amber-950 font-bold">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          Month {snap.monthIndex}: {snap.dateFormatted}
                        </span>
                        {hasMilestone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Flag className="w-2.5 h-2.5 text-emerald-700" />
                            {snap.paidOffDebtsThisMonth.join(', ')} PAID OFF!
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {snap.remainingDebtsCount} accounts remaining
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Payment</div>
                      <div className="font-bold text-slate-900">
                        {formatCurrency(snap.totalPayment)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Interest</div>
                      <div className="font-bold text-rose-700">
                        {formatCurrency(snap.totalInterestCharged)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Principal</div>
                      <div className="font-bold text-emerald-800">
                        {formatCurrency(snap.totalPrincipalPaid)}
                      </div>
                    </div>

                    <div className="min-w-20">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">End Balance</div>
                      <div className="font-black text-slate-900">
                        {formatCurrency(snap.totalEndingBalance)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Account Level Detail */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-amber-200/80 overflow-x-auto bg-amber-50/20">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-amber-950 font-bold border-b border-amber-200">
                          <th className="py-2 pl-2">Account</th>
                          <th className="py-2 text-right">Start Balance</th>
                          <th className="py-2 text-right">Interest</th>
                          <th className="py-2 text-right">Min Paid</th>
                          <th className="py-2 text-right">Extra Applied</th>
                          <th className="py-2 text-right">Total Payment</th>
                          <th className="py-2 text-right pr-2">End Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {snap.payments.map((p) => (
                          <tr
                            key={p.debtId}
                            className={`hover:bg-amber-50/60 ${
                              p.isPaidOffThisMonth ? 'bg-emerald-100/50 font-bold' : ''
                            }`}
                          >
                            <td className="py-2 pl-2 font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{p.debtName}</span>
                              {p.isPaidOffThisMonth && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-700 text-white font-black">
                                  PAID OFF
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right text-slate-600 font-medium">
                              {formatCurrency(p.startBalance)}
                            </td>
                            <td className="py-2 text-right text-rose-700 font-bold">
                              +{formatCurrency(p.interestCharged)}
                            </td>
                            <td className="py-2 text-right text-slate-700 font-semibold">
                              {formatCurrency(p.minPayment)}
                            </td>
                            <td className="py-2 text-right text-emerald-800 font-extrabold">
                              {p.extraPayment > 0 ? `+${formatCurrency(p.extraPayment)}` : '—'}
                            </td>
                            <td className="py-2 text-right font-black text-slate-900">
                              {formatCurrency(p.totalPayment)}
                            </td>
                            <td className="py-2 text-right pr-2 font-black text-slate-900">
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
            className="px-4 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
          >
            Show Next 24 Months ({filteredSchedule.length - visibleSchedule.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
