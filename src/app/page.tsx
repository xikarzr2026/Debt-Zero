'use client';

import React, { useEffect, useState } from 'react';
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
import { HelpModal } from '@/components/HelpModal';
import { SetupWizard } from '@/components/SetupWizard';
import { planSavings, currencyDecimals } from '@/lib/debtEngine';
import { ShieldCheck, Sparkles, Upload } from 'lucide-react';

type TabId = 'plan' | 'debts' | 'windfall' | 'schedule';

const MAX_IMPORT_BYTES = 1_000_000;

export default function HomePage() {
  const {
    profile,
    debts,
    strategy,
    activePlan,
    comparison,
    formatCurrency,
    isLoaded,
    onboardingComplete,
    exportDataJSON,
    importDataJSON,
    clearAllData,
  } = useDebt();

  const [activeTab, setActiveTab] = useState<TabId>('plan');
  const [cashFlowModalOpen, setCashFlowModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  // The wizard opens by itself until a plan exists; closing it leaves the empty state below.
  const [wizard, setWizard] = useState<{ open: boolean; prefill: boolean }>({ open: false, prefill: false });
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading DebtZero…</p>
        </div>
      </div>
    );
  }

  const showWizard = wizard.open || (!onboardingComplete && !setupDismissed);

  const openSetup = () => setWizard({ open: true, prefill: onboardingComplete });

  const closeSetup = () => {
    setWizard({ open: false, prefill: false });
    setSetupDismissed(true);
  };

  const finishSetup = (message: string) => {
    setWizard({ open: false, prefill: false });
    setSetupDismissed(true);
    setActiveTab('plan');
    setToast(message);
  };

  const savePlanToFile = () => {
    const blob = new Blob([exportDataJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debtzero-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Plan saved to your downloads');
  };

  const loadPlanFromFile = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      window.alert('That file is too large to be a DebtZero backup (limit 1 MB).');
      return;
    }
    if (onboardingComplete && !window.confirm(`Replace your current plan with "${file.name}"?`)) return;
    try {
      const res = importDataJSON(await file.text());
      if (res.success) finishSetup(`Loaded plan from ${file.name}`);
      else window.alert(res.error || 'That file could not be read as a DebtZero backup.');
    } catch {
      window.alert('That file could not be read.');
    }
  };

  const clearData = () => {
    if (!window.confirm('Delete your plan and everything DebtZero stored in this browser? Save it to a file first if you want to keep it.')) {
      return;
    }
    clearAllData();
    setWizard({ open: false, prefill: false });
    setSetupDismissed(false);
    setCashFlowModalOpen(false);
    setActiveTab('plan');
    setToast('All data cleared from this browser');
  };

  const activeDebtCount = debts.filter((d) => d.balance > 0).length;
  const { interestSaved } = planSavings(comparison.baselineMinimums, activePlan, currencyDecimals(profile.currency));
  const baselineNeverPays = comparison.baselineMinimums.unpayable;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'plan', label: 'Payoff Plan' },
    { id: 'debts', label: `Debts (${debts.length})` },
    { id: 'windfall', label: 'Windfall' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        planLoaded={onboardingComplete}
        onStartSetup={openSetup}
        onOpenCashFlow={() => setCashFlowModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onSavePlan={savePlanToFile}
        onLoadPlan={loadPlanFromFile}
        onClearData={clearData}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6">
        {!onboardingComplete ? (
          <div className="max-w-xl mx-auto mt-6 sm:mt-12 glass-panel bg-white/95 rounded-2xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="mt-4 text-lg font-black text-slate-900">No plan loaded yet</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Set up your income, expenses and debts in four short steps, or load a plan you saved earlier. Your payoff
              timeline, interest savings and monthly checklist appear once a plan is in place.
            </p>
            <button
              type="button"
              onClick={openSetup}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Start Setup / Load Plan
            </button>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Your plan stays in this browser and is never uploaded.
            </p>
          </div>
        ) : (
          <>
            {/* Plan headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {profile.name ? `${profile.name}'s debt-free plan` : 'Your debt-free plan'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
                {activeDebtCount === 0 ? (
                  <>No balances left to pay. Add a debt on the Debts tab to plan its payoff.</>
                ) : activePlan.unpayable ? (
                  <>
                    At the current pace these {activeDebtCount} debts are not paid off within 50 years
                    {activePlan.remainingBalance > 0 && (
                      <>
                        {' '}
                        — about <strong className="text-rose-700 font-bold">{formatCurrency(activePlan.remainingBalance)}</strong>{' '}
                        would still be owed
                      </>
                    )}
                    . Raise the monthly extra or a minimum payment to get on track.
                  </>
                ) : (
                  <>
                    Debt-free by <strong className="text-emerald-700 font-bold">{activePlan.debtFreeDate}</strong>
                    {interestSaved > 0 && (
                      <>
                        , saving <strong className="text-emerald-700 font-bold">{formatCurrency(interestSaved)}</strong> in
                        interest compared with minimum payments
                      </>
                    )}
                    {baselineNeverPays && strategy !== 'minimums_only' && (
                      <> — minimum payments alone would never clear this debt</>
                    )}
                    .
                  </>
                )}
              </p>
            </div>

            <HeroMetricCards onOpenCashFlow={() => setCashFlowModalOpen(true)} />

            {/* Section tabs */}
            <div role="tablist" aria-label="Dashboard sections" className="flex items-center gap-1 overflow-x-auto border-b border-amber-200/80">
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2.5 -mb-px border-b-2 text-sm whitespace-nowrap transition-colors ${
                      selected
                        ? 'border-emerald-700 text-emerald-800 font-bold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'plan' && (
              <section className="space-y-6">
                <StrategySelector />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <PayoffTimelineChart />
                  </div>
                  <div className="lg:col-span-5">
                    <MonthlyChecklist />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'debts' && (
              <section>
                <DebtInventory />
              </section>
            )}

            {activeTab === 'windfall' && (
              <section>
                <WindfallSimulator />
              </section>
            )}

            {activeTab === 'schedule' && (
              <section>
                <AmortizationTable />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="w-full border-t border-amber-200/80 py-5 mt-12 text-xs text-slate-600 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>DebtZero runs entirely in your browser. Your numbers are never uploaded.</span>
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg"
        >
          {toast}
        </div>
      )}

      {showWizard && <SetupWizard prefill={wizard.prefill} onClose={closeSetup} onDone={finishSetup} />}

      <CashFlowModal isOpen={cashFlowModalOpen && onboardingComplete} onClose={() => setCashFlowModalOpen(false)} />
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
}
