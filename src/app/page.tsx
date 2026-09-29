'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { Navbar } from '@/components/Navbar';
import { HeroMetricCards } from '@/components/HeroMetricCards';
import { StrategySelector } from '@/components/StrategySelector';
import { PayoffTimelineChart } from '@/components/PayoffTimelineChart';
import { WindfallSimulator } from '@/components/WindfallSimulator';
import { MonthlyChecklist } from '@/components/MonthlyChecklist';
import { DebtInventory } from '@/components/DebtInventory';
import { AmortizationTable } from '@/components/AmortizationTable';
import { CashFlowModal } from '@/components/CashFlowModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import { HelpModal } from '@/components/HelpModal';
import {
  LayoutDashboard,
  CreditCard,
  Gift,
  FileSpreadsheet,
  CheckSquare,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const {
    profile,
    debts,
    strategy,
    activePlan,
    comparison,
    formatCurrency,
    freeCashFlowData,
    isLoaded,
  } = useDebt();

  const [activeTab, setActiveTab] = useState<'overview' | 'debts' | 'windfall' | 'amortization' | 'all'>(
    'all'
  );
  const [cashFlowModalOpen, setCashFlowModalOpen] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Initializing DebtZero Engine...
          </p>
        </div>
      </div>
    );
  }

  const baselineInterest = comparison.baselineMinimums.totalInterestPaid;
  const currentInterest = activePlan.totalInterestPaid;
  const interestSaved = Math.max(0, baselineInterest - currentInterest);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenCashFlow={() => setCashFlowModalOpen(true)}
        onOpenImportExport={() => setImportExportModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-7">
        {/* Hero Title & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Active Financial Plan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Welcome back, {profile.name || 'Friend'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Your optimized <strong className="text-slate-700 dark:text-slate-200 capitalize">{strategy}</strong> plan is projected to eliminate all {debts.length} liabilities by{' '}
              <strong className="text-emerald-500">{activePlan.debtFreeDate}</strong>
              {interestSaved > 0 && (
                <>
                  , saving <strong className="text-emerald-500">{formatCurrency(interestSaved)}</strong> in unnecessary interest.
                </>
              )}
            </p>
          </div>

          {/* Quick Cash Flow Summary Banner */}
          <div
            onClick={() => setCashFlowModalOpen(true)}
            className="cursor-pointer glass-panel glass-panel-hover rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-center gap-4 self-start md:self-auto"
          >
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Monthly Net Income</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {formatCurrency(freeCashFlowData.monthlyIncome)}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Living Expenses</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {formatCurrency(freeCashFlowData.livingExpenses)}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-emerald-500">Free Cash Flow</div>
              <div className="font-extrabold text-sm text-emerald-500">
                {formatCurrency(freeCashFlowData.freeCashFlow)}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <HeroMetricCards onOpenCashFlow={() => setCashFlowModalOpen(true)} />

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Complete Dashboard (All)</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strategies & Forecast</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'debts'
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
            <span>Debts Inventory ({debts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('windfall')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'windfall'
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Windfall / Bonus Allocator</span>
          </button>

          <button
            onClick={() => setActiveTab('amortization')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'amortization'
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            <span>Amortization Schedule</span>
          </button>
        </div>

        {/* Dynamic Tab Contents */}

        {/* 1. Strategies & Forecasting */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <section className="space-y-6">
            <StrategySelector />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <PayoffTimelineChart />
              </div>
              <div className="lg:col-span-4">
                <MonthlyChecklist />
              </div>
            </div>
          </section>
        )}

        {/* 2. Windfall Simulator */}
        {(activeTab === 'all' || activeTab === 'windfall') && (
          <section>
            <WindfallSimulator />
          </section>
        )}

        {/* 3. Debts Inventory & Cash Flow */}
        {(activeTab === 'all' || activeTab === 'debts') && (
          <section>
            <DebtInventory />
          </section>
        )}

        {/* 4. Full Amortization Waterfall Table */}
        {(activeTab === 'all' || activeTab === 'amortization') && (
          <section>
            <AmortizationTable />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>DebtZero Engine • Privacy-Preserving Local Finance Optimization</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setHelpModalOpen(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              How Calculations Work
            </button>
            <span>•</span>
            <button
              onClick={() => setImportExportModalOpen(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              Backup & Restore
            </button>
            <span>•</span>
            <button
              onClick={() => setCashFlowModalOpen(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              Budget & Expenses
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CashFlowModal
        isOpen={cashFlowModalOpen}
        onClose={() => setCashFlowModalOpen(false)}
      />

      <ImportExportModal
        isOpen={importExportModalOpen}
        onClose={() => setImportExportModalOpen(false)}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}
