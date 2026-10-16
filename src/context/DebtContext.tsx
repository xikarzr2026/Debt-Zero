'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  DebtItem,
  UserFinancialProfile,
  OptimizationStrategy,
  WindfallSimulation,
  EngineComparison,
  PayoffStrategyResult,
  SUPPORTED_CURRENCIES,
  CurrencyCode,
  CurrencyConfig,
} from '@/types/debt';
import {
  runEngineComparison,
  calculateFreeCashFlow,
  detectNegativeAmortization,
  formatCurrencyValue,
  generateMonthChecklist,
  normalizeToMonthlyIncome,
  parseDebtBackup,
  currencyDecimals,
} from '@/lib/debtEngine';
import { APP_VERSION } from '@/lib/version';

interface ChecklistItemState {
  debtId: string;
  debtName: string;
  amount: number;
  dueDate: number;
  completed: boolean;
}

interface DebtContextType {
  profile: UserFinancialProfile;
  debts: DebtItem[];
  strategy: OptimizationStrategy;
  windfall: WindfallSimulation;
  theme: 'light';
  isLoaded: boolean;
  /** True once the user has built a plan with the setup wizard or loaded a backup file. */
  onboardingComplete: boolean;

  // Derived calculations
  comparison: EngineComparison;
  activePlan: PayoffStrategyResult;
  freeCashFlowData: ReturnType<typeof calculateFreeCashFlow>;
  negativeAmortAlerts: ReturnType<typeof detectNegativeAmortization>;
  effectiveSurplus: number;
  checklist: ChecklistItemState[];
  currencyConfig: CurrencyConfig;

  // Actions
  setProfile: (profile: UserFinancialProfile) => void;
  updateProfile: (partial: Partial<UserFinancialProfile>) => void;
  updateExpensesBreakdown: (category: keyof UserFinancialProfile['expensesBreakdown'], value: number) => void;
  addDebt: (debt: Omit<DebtItem, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<DebtItem>) => void;
  deleteDebt: (id: string) => void;
  duplicateDebt: (id: string) => void;
  setStrategy: (strategy: OptimizationStrategy) => void;
  setWindfall: (windfall: WindfallSimulation) => void;
  resetWindfall: () => void;
  completeSetup: (plan: { profile: UserFinancialProfile; debts: DebtItem[]; strategy: OptimizationStrategy }) => void;
  toggleChecklistItem: (debtId: string) => void;
  resetChecklist: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; error?: string };
  clearAllData: () => void;
  formatCurrency: (val: number, decimals?: number) => string;
}

const STORAGE_KEY = 'debtzero_userdata_v1';

const DebtContext = createContext<DebtContextType | undefined>(undefined);

/** Empty plan used before setup and after Clear All Data. Never shown: the app renders an empty state instead. */
export const BLANK_PROFILE: UserFinancialProfile = {
  name: '',
  currency: 'USD',
  payFrequency: 'monthly',
  incomePerPeriod: 0,
  monthlyNetIncome: 0,
  livingExpenses: 0,
  expensesBreakdown: {
    housing: 0,
    utilities: 0,
    groceries: 0,
    transportation: 0,
    insurance: 0,
    subscriptions: 0,
    other: 0,
  },
};

const DEFAULT_WINDFALL: WindfallSimulation = { amount: 0, type: 'one_time', targetDebtId: 'auto_optimal' };

function nextPriority(debts: DebtItem[]): number {
  return debts.reduce((max, d) => Math.max(max, d.customPriority || 0), 0) + 1;
}

export function DebtProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserFinancialProfile>(BLANK_PROFILE);
  const [debts, setDebtsState] = useState<DebtItem[]>([]);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('avalanche');
  const [windfall, setWindfall] = useState<WindfallSimulation>(DEFAULT_WINDFALL);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [theme] = useState<'light'>('light');
  const [checklistCompletedMap, setChecklistCompletedMap] = useState<Record<string, boolean>>({});
  const [checklistPlanKey, setChecklistPlanKey] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        // Stored data gets the same validation as an imported backup
        const restored = parseDebtBackup(savedData, { allowEmptyDebts: true });
        const parsed = restored.success ? JSON.parse(savedData) : null;
        // Data saved before v1.3 has no onboarding flag. It counts as the user's own plan only if they
        // had edited it (v1.2 cleared currentPresetId on any edit); an untouched demo preset does not.
        const isUserPlan =
          parsed?.onboardingComplete === true ||
          (parsed?.onboardingComplete === undefined &&
            parsed?.currentPresetId === null &&
            (restored.debts?.length ?? 0) > 0);
        if (restored.success && restored.profile && restored.debts && isUserPlan) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProfileState(restored.profile);
          setDebtsState(restored.debts);
          if (restored.strategy) setStrategy(restored.strategy);
          if (restored.windfall) setWindfall(restored.windfall);
          setOnboardingComplete(true);
          if (parsed.checklistCompletedMap && typeof parsed.checklistCompletedMap === 'object') {
            const checks: Record<string, boolean> = {};
            for (const [id, done] of Object.entries(parsed.checklistCompletedMap)) {
              if (done === true) checks[id] = true;
            }
            setChecklistCompletedMap(checks);
          }
          if (typeof parsed.checklistPlanKey === 'string') setChecklistPlanKey(parsed.checklistPlanKey);
        } else {
          if (!restored.success) console.error('Ignoring unreadable DebtZero data:', restored.error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load stored DebtZero data:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change. Nothing is stored until the user has a plan of their own.
  useEffect(() => {
    if (!isLoaded || !onboardingComplete) return;
    try {
      const dataToSave = {
        version: APP_VERSION,
        onboardingComplete: true,
        profile,
        debts,
        strategy,
        windfall,
        checklistCompletedMap,
        checklistPlanKey,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save DebtZero data to localStorage:', e);
    }
  }, [profile, debts, strategy, windfall, checklistCompletedMap, checklistPlanKey, isLoaded, onboardingComplete]);

  const currencyConfig = SUPPORTED_CURRENCIES[profile.currency as CurrencyCode] || SUPPORTED_CURRENCIES.USD;

  const formatCurrency = (val: number, decimals: number = currencyDecimals(profile.currency)) => {
    return formatCurrencyValue(val, currencyConfig.symbol, decimals, currencyConfig.locale);
  };

  // Compute normalized monthly income
  const effectiveMonthlyIncome = useMemo(() => {
    return normalizeToMonthlyIncome(profile.incomePerPeriod, profile.payFrequency);
  }, [profile.incomePerPeriod, profile.payFrequency]);

  // Total living expenses from breakdown if available, else flat value
  const totalLivingExpenses = useMemo(() => {
    if (profile.expensesBreakdown) {
      const b = profile.expensesBreakdown;
      return (
        (b.housing || 0) +
        (b.utilities || 0) +
        (b.groceries || 0) +
        (b.transportation || 0) +
        (b.insurance || 0) +
        (b.subscriptions || 0) +
        (b.other || 0)
      );
    }
    return profile.livingExpenses || 0;
  }, [profile.expensesBreakdown, profile.livingExpenses]);

  // Free Cash Flow
  const freeCashFlowData = useMemo(() => {
    return calculateFreeCashFlow(effectiveMonthlyIncome, totalLivingExpenses, debts);
  }, [effectiveMonthlyIncome, totalLivingExpenses, debts]);

  // Effective surplus channeled into debt payoff
  // If user has set a manual override and it's positive, use that; otherwise use freeCashFlow if positive
  const effectiveSurplus = useMemo(() => {
    if (profile.manualExtraMonthlySurplus !== undefined && profile.manualExtraMonthlySurplus >= 0) {
      return profile.manualExtraMonthlySurplus;
    }
    return Math.max(0, freeCashFlowData.freeCashFlow);
  }, [profile.manualExtraMonthlySurplus, freeCashFlowData.freeCashFlow]);

  // Run comprehensive multi-strategy simulation
  const comparison = useMemo(() => {
    return runEngineComparison({
      debts,
      monthlySurplus: effectiveSurplus,
      windfall: windfall.amount > 0 ? windfall : undefined,
      decimals: currencyDecimals(profile.currency),
      activeStrategy: strategy,
    });
  }, [debts, effectiveSurplus, windfall, profile.currency, strategy]);

  // Active plan for current strategy
  const activePlan = useMemo(() => {
    switch (strategy) {
      case 'avalanche':
        return comparison.avalanche;
      case 'snowball':
        return comparison.snowball;
      case 'custom':
        return comparison.custom || comparison.avalanche;
      case 'minimums_only':
        return comparison.baselineMinimums;
      default:
        return comparison.avalanche;
    }
  }, [strategy, comparison]);

  // Negative amortization alerts
  const negativeAmortAlerts = useMemo(() => {
    return detectNegativeAmortization(debts, profile.currency);
  }, [debts, profile.currency]);

  // Monthly execution checklist. Checks reset when the month-1 payment mix changes.
  const planKey = useMemo(() => {
    const month = activePlan.schedule[0];
    if (!month) return 'empty';
    return month.payments.map((p) => `${p.debtId}:${p.totalPayment}`).join('|');
  }, [activePlan]);

  const checklist = useMemo(() => {
    const rawItems = generateMonthChecklist(activePlan, debts);
    const checks = planKey === checklistPlanKey ? checklistCompletedMap : {};
    return rawItems.map((item) => ({
      debtId: item.debtId,
      debtName: item.debtName,
      amount: item.totalPayment,
      dueDate: item.dueDate,
      completed: !!checks[item.debtId],
    }));
  }, [activePlan, debts, checklistCompletedMap, planKey, checklistPlanKey]);

  // Handlers
  const setProfile = (newProfile: UserFinancialProfile) => {
    setProfileState(newProfile);
  };

  const updateProfile = (partial: Partial<UserFinancialProfile>) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.incomePerPeriod !== undefined || partial.payFrequency !== undefined) {
        updated.monthlyNetIncome = normalizeToMonthlyIncome(
          updated.incomePerPeriod,
          updated.payFrequency
        );
      }
      return updated;
    });
  };

  const updateExpensesBreakdown = (
    category: keyof UserFinancialProfile['expensesBreakdown'],
    value: number
  ) => {
    setProfileState((prev) => {
      const breakdown = { ...prev.expensesBreakdown, [category]: Math.max(0, value) };
      const sumTotal = Object.values(breakdown).reduce((s, v) => s + (v || 0), 0);
      return {
        ...prev,
        expensesBreakdown: breakdown,
        livingExpenses: sumTotal,
      };
    });
  };

  const addDebt = (debt: Omit<DebtItem, 'id'>) => {
    const newId = `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setDebtsState((prev) => [...prev, { ...debt, id: newId, customPriority: nextPriority(prev) }]);
  };

  const updateDebt = (id: string, updates: Partial<DebtItem>) => {
    setDebtsState((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDebt = (id: string) => {
    setDebtsState((prev) => prev.filter((d) => d.id !== id));
  };

  const duplicateDebt = (id: string) => {
    const existing = debts.find((d) => d.id === id);
    if (!existing) return;
    const duplicated: DebtItem = {
      ...existing,
      id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${existing.name} (Copy)`,
    };
    setDebtsState((prev) => [...prev, { ...duplicated, customPriority: nextPriority(prev) }]);
  };

  const resetWindfall = () => setWindfall(DEFAULT_WINDFALL);

  // Replaces the whole plan with the one built in the setup wizard
  const completeSetup = (plan: { profile: UserFinancialProfile; debts: DebtItem[]; strategy: OptimizationStrategy }) => {
    setProfileState({
      ...plan.profile,
      monthlyNetIncome: normalizeToMonthlyIncome(plan.profile.incomePerPeriod, plan.profile.payFrequency),
      livingExpenses: Object.values(plan.profile.expensesBreakdown).reduce((s, v) => s + (v || 0), 0),
    });
    setDebtsState(plan.debts);
    setStrategy(plan.strategy);
    setWindfall(DEFAULT_WINDFALL);
    setChecklistCompletedMap({});
    setChecklistPlanKey('');
    setOnboardingComplete(true);
  };

  const toggleChecklistItem = (debtId: string) => {
    setChecklistPlanKey(planKey);
    setChecklistCompletedMap((prev) => {
      const base = checklistPlanKey === planKey ? prev : {};
      return { ...base, [debtId]: !base[debtId] };
    });
  };

  const resetChecklist = () => {
    setChecklistCompletedMap({});
    setChecklistPlanKey(planKey);
  };

  const exportDataJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: APP_VERSION,
      profile,
      debts,
      strategy,
      windfall,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    const parsed = parseDebtBackup(jsonStr);
    if (!parsed.success || !parsed.profile || !parsed.debts) {
      return { success: false, error: parsed.error || 'Failed to parse JSON file' };
    }
    setProfileState(parsed.profile);
    setDebtsState(parsed.debts);
    if (parsed.strategy) setStrategy(parsed.strategy);
    setWindfall(parsed.windfall ?? DEFAULT_WINDFALL);
    setChecklistCompletedMap({});
    setChecklistPlanKey('');
    setOnboardingComplete(true);
    return { success: true };
  };

  // Wipes stored data and returns to first-run setup
  const clearAllData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear DebtZero data:', e);
    }
    setProfileState(BLANK_PROFILE);
    setDebtsState([]);
    setStrategy('avalanche');
    setWindfall(DEFAULT_WINDFALL);
    setChecklistCompletedMap({});
    setChecklistPlanKey('');
    setOnboardingComplete(false);
  };

  return (
    <DebtContext.Provider
      value={{
        profile,
        debts,
        strategy,
        windfall,
        theme,
        isLoaded,
        onboardingComplete,
        comparison,
        activePlan,
        freeCashFlowData,
        negativeAmortAlerts,
        effectiveSurplus,
        checklist,
        currencyConfig,
        setProfile,
        updateProfile,
        updateExpensesBreakdown,
        addDebt,
        updateDebt,
        deleteDebt,
        duplicateDebt,
        setStrategy,
        setWindfall,
        resetWindfall,
        completeSetup,
        toggleChecklistItem,
        resetChecklist,
        exportDataJSON,
        importDataJSON,
        clearAllData,
        formatCurrency,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
}

export function useDebt() {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('useDebt must be used within a DebtProvider');
  }
  return context;
}
