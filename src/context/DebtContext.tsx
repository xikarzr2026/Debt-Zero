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
} from '@/lib/debtEngine';
import { PRESET_SCENARIOS } from '@/lib/presets';

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
  currentPresetId: string | null;
  theme: 'dark' | 'light';
  isLoaded: boolean;

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
  applyWindfallToSurplus: () => void;
  loadPreset: (presetId: string) => void;
  toggleChecklistItem: (debtId: string) => void;
  resetChecklist: () => void;
  toggleTheme: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; error?: string };
  formatCurrency: (val: number, decimals?: number) => string;
}

const STORAGE_KEY = 'debtzero_userdata_v1';
const THEME_KEY = 'debtzero_theme_v1';

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export function DebtProvider({ children }: { children: ReactNode }) {
  const defaultPreset = PRESET_SCENARIOS[0]; // High-APR Card Overwhelm default

  const [profile, setProfileState] = useState<UserFinancialProfile>(defaultPreset.profile);
  const [debts, setDebtsState] = useState<DebtItem[]>(defaultPreset.debts);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('avalanche');
  const [windfall, setWindfall] = useState<WindfallSimulation>({
    amount: 1500,
    type: 'one_time',
    targetDebtId: 'auto_optimal',
  });
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(defaultPreset.id);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [checklistCompletedMap, setChecklistCompletedMap] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, 'light');

      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.profile) setProfileState(parsed.profile);
        if (parsed.debts) setDebtsState(parsed.debts);
        if (parsed.strategy) setStrategy(parsed.strategy);
        if (parsed.windfall) setWindfall(parsed.windfall);
        if (parsed.currentPresetId !== undefined) setCurrentPresetId(parsed.currentPresetId);
        if (parsed.checklistCompletedMap) setChecklistCompletedMap(parsed.checklistCompletedMap);
      }
    } catch (e) {
      console.error('Failed to load stored DebtZero data:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave = {
        profile,
        debts,
        strategy,
        windfall,
        currentPresetId,
        checklistCompletedMap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save DebtZero data to localStorage:', e);
    }
  }, [profile, debts, strategy, windfall, currentPresetId, checklistCompletedMap, isLoaded]);

  // Sync theme to document element class (clean light theme)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    // Keep light theme active
    setTheme('light');
  };

  const currencyConfig = SUPPORTED_CURRENCIES[profile.currency as CurrencyCode] || SUPPORTED_CURRENCIES.USD;

  const formatCurrency = (val: number, decimals: number = 0) => {
    return formatCurrencyValue(val, currencyConfig.symbol, decimals);
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
    });
  }, [debts, effectiveSurplus, windfall]);

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
    return detectNegativeAmortization(debts);
  }, [debts]);

  // Monthly execution checklist
  const checklist = useMemo(() => {
    const rawItems = generateMonthChecklist(activePlan, debts);
    return rawItems.map((item) => ({
      debtId: item.debtId,
      debtName: item.debtName,
      amount: item.totalPayment,
      dueDate: item.dueDate,
      completed: !!checklistCompletedMap[item.debtId],
    }));
  }, [activePlan, debts, checklistCompletedMap]);

  // Handlers
  const setProfile = (newProfile: UserFinancialProfile) => {
    setProfileState(newProfile);
    setCurrentPresetId(null);
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
    setCurrentPresetId(null);
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
    setCurrentPresetId(null);
  };

  const addDebt = (debt: Omit<DebtItem, 'id'>) => {
    const newId = `debt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setDebtsState((prev) => [...prev, { ...debt, id: newId }]);
    setCurrentPresetId(null);
  };

  const updateDebt = (id: string, updates: Partial<DebtItem>) => {
    setDebtsState((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    setCurrentPresetId(null);
  };

  const deleteDebt = (id: string) => {
    setDebtsState((prev) => prev.filter((d) => d.id !== id));
    setCurrentPresetId(null);
  };

  const duplicateDebt = (id: string) => {
    const existing = debts.find((d) => d.id === id);
    if (!existing) return;
    const duplicated: DebtItem = {
      ...existing,
      id: `debt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${existing.name} (Copy)`,
    };
    setDebtsState((prev) => [...prev, duplicated]);
    setCurrentPresetId(null);
  };

  const resetWindfall = () => {
    setWindfall({
      amount: 0,
      type: 'one_time',
      targetDebtId: 'auto_optimal',
    });
  };

  const applyWindfallToSurplus = () => {
    if (windfall.type === 'monthly_extra' && windfall.amount > 0) {
      updateProfile({
        manualExtraMonthlySurplus: effectiveSurplus + windfall.amount,
      });
      resetWindfall();
    }
  };

  const loadPreset = (presetId: string) => {
    const found = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!found) return;
    setProfileState(JSON.parse(JSON.stringify(found.profile)));
    setDebtsState(JSON.parse(JSON.stringify(found.debts)));
    setCurrentPresetId(found.id);
    setChecklistCompletedMap({});
  };

  const toggleChecklistItem = (debtId: string) => {
    setChecklistCompletedMap((prev) => ({
      ...prev,
      [debtId]: !prev[debtId],
    }));
  };

  const resetChecklist = () => {
    setChecklistCompletedMap({});
  };

  const exportDataJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      profile,
      debts,
      strategy,
      windfall,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.profile || !Array.isArray(data.debts)) {
        return { success: false, error: 'Invalid DebtZero JSON format. Missing profile or debts.' };
      }
      setProfileState(data.profile);
      setDebtsState(data.debts);
      if (data.strategy) setStrategy(data.strategy);
      if (data.windfall) setWindfall(data.windfall);
      setCurrentPresetId(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Failed to parse JSON file' };
    }
  };

  return (
    <DebtContext.Provider
      value={{
        profile,
        debts,
        strategy,
        windfall,
        currentPresetId,
        theme,
        isLoaded,
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
        applyWindfallToSurplus,
        loadPreset,
        toggleChecklistItem,
        resetChecklist,
        toggleTheme,
        exportDataJSON,
        importDataJSON,
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
