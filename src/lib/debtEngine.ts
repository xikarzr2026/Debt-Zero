import type {
  DebtItem,
  DebtCategory,
  OptimizationStrategy,
  WindfallSimulation,
  MonthlyAmortizationPayment,
  MonthlyAmortizationSnapshot,
  DebtMilestone,
  PayoffStrategyResult,
  EngineComparison,
  PayFrequency,
  CurrencyCode,
} from '../types/debt.ts';

const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  USD: 2,
  CAD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  MXN: 2,
  JPY: 0,
};

/** Half-up (ties away from zero) to `decimals` places. Avoids Number.toFixed binary-tie bugs. */
export function roundHalfUp(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const shifted = value * factor;
  const rounded = Math.sign(shifted) * Math.round(Math.abs(shifted) + Number.EPSILON);
  return rounded / factor;
}

export function currencyDecimals(code: CurrencyCode | string | undefined): number {
  if (code && code in CURRENCY_DECIMALS) return CURRENCY_DECIMALS[code as CurrencyCode];
  return 2;
}

/**
 * Standard monthly compounding interest formula
 * Interest = Balance * (APR / 100 / 12)
 */
export function calculateMonthlyInterest(balance: number, apr: number, decimals: number = 2): number {
  if (!Number.isFinite(balance) || !Number.isFinite(apr) || balance <= 0 || apr <= 0) return 0;
  return roundHalfUp(balance * (apr / 100 / 12), decimals);
}

/**
 * Normalizes any pay frequency to a net monthly take-home amount
 */
export function normalizeToMonthlyIncome(amount: number, frequency: PayFrequency): number {
  if (!amount || amount <= 0) return 0;
  switch (frequency) {
    case 'weekly':
      return roundHalfUp((amount * 52) / 12);
    case 'bi-weekly':
      return roundHalfUp((amount * 26) / 12);
    case 'semi-monthly':
      return roundHalfUp(amount * 2);
    case 'monthly':
    default:
      return roundHalfUp(amount);
  }
}

/**
 * Calculates Free Cash Flow (Discretionary Debt Payoff Surplus)
 * FCF = Net Monthly Income - Living Expenses - Sum(Minimum Debt Payments)
 */
export function calculateFreeCashFlow(
  monthlyIncome: number,
  livingExpenses: number,
  debts: DebtItem[]
): {
  monthlyIncome: number;
  livingExpenses: number;
  totalMinimumDebtPayments: number;
  freeCashFlow: number;
  isDeficit: boolean;
  debtToIncomeRatio: number; // Percentage of income eaten by minimum debt payments
} {
  const totalMin = debts
    .filter((d) => (Number(d.balance) || 0) > 0)
    .reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  const fcf = roundHalfUp(monthlyIncome - livingExpenses - totalMin);
  const dti = monthlyIncome > 0 ? roundHalfUp((totalMin / monthlyIncome) * 100, 1) : 0;

  return {
    monthlyIncome,
    livingExpenses,
    totalMinimumDebtPayments: roundHalfUp(totalMin),
    freeCashFlow: fcf,
    isDeficit: fcf < 0,
    debtToIncomeRatio: dti,
  };
}

/**
 * Checks for negative amortization:
 * If minimum payment is less than or equal to monthly interest accrued,
 * the balance will never decrease.
 */
export function detectNegativeAmortization(debts: DebtItem[]): Array<{
  debtId: string;
  debtName: string;
  interestAccruing: number;
  minPayment: number;
  deficit: number;
  recommendedMinimum: number;
}> {
  const alerts: ReturnType<typeof detectNegativeAmortization> = [];

  for (const debt of debts) {
    if (debt.balance <= 0) continue;
    const monthlyInterest = calculateMonthlyInterest(debt.balance, debt.apr);
    if (debt.minPayment <= monthlyInterest) {
      const deficit = roundHalfUp(monthlyInterest - debt.minPayment);
      // Recommend interest + at least 1.5% of principal or $25, whichever is greater
      const recommended = roundHalfUp(monthlyInterest + Math.max(25, debt.balance * 0.015));
      alerts.push({
        debtId: debt.id,
        debtName: debt.name,
        interestAccruing: monthlyInterest,
        minPayment: debt.minPayment,
        deficit,
        recommendedMinimum: recommended,
      });
    }
  }

  return alerts;
}

/**
 * Sorts active debts according to the selected strategy
 */
export function sortDebtsByStrategy<
  T extends { id: string; name: string; balance: number; apr: number; minPayment: number; customPriority?: number; currentBalance?: number }
>(
  debts: T[],
  strategy: OptimizationStrategy
): T[] {
  const list = [...debts];

  switch (strategy) {
    case 'avalanche':
      // Highest APR first; if tied, lowest current balance first
      return list.sort((a, b) => {
        if (b.apr !== a.apr) return b.apr - a.apr;
        const balA = a.currentBalance ?? a.balance;
        const balB = b.currentBalance ?? b.balance;
        return balA - balB;
      });

    case 'snowball':
      // Lowest current balance first; if tied, highest APR first
      return list.sort((a, b) => {
        const balA = a.currentBalance ?? a.balance;
        const balB = b.currentBalance ?? b.balance;
        if (balA !== balB) return balA - balB;
        return b.apr - a.apr;
      });

    case 'custom':
      // Custom priority order (1 is top priority)
      return list.sort((a, b) => {
        const pA = a.customPriority ?? 999;
        const pB = b.customPriority ?? 999;
        return pA - pB;
      });

    case 'minimums_only':
    default:
      // Natural order, minimums only (no extra targeting)
      return list;
  }
}

/**
 * Formats a Date object into "MMM YYYY" (e.g. "Nov 2027")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Simulates debt payoff schedule month-by-month
 */
export function simulatePayoffSchedule({
  debts,
  monthlySurplus,
  strategy,
  windfall,
  startDate = new Date(),
  maxMonths = 600, // 50 years max safe limit
  decimals = 2,
}: {
  debts: DebtItem[];
  monthlySurplus: number;
  strategy: OptimizationStrategy;
  windfall?: WindfallSimulation;
  startDate?: Date;
  maxMonths?: number;
  decimals?: number;
}): PayoffStrategyResult {
  // Filter active debts
  const activeDebts = debts
    .filter((d) => d.balance > 0)
    .map((d) => ({
      ...d,
      currentBalance: Number(d.balance),
      originalBalance: Number(d.balance),
      cumulativeInterest: 0,
      cumulativePrincipal: 0,
    }));

  const titles: Record<OptimizationStrategy, { title: string; description: string }> = {
    avalanche: {
      title: 'Debt Avalanche (Mathematically Optimal)',
      description: 'Focuses surplus cash on highest-APR debts first to minimize total interest paid.',
    },
    snowball: {
      title: 'Debt Snowball (Psychological Momentum)',
      description: 'Knocks out the smallest balances first to build quick behavioral momentum and free up cash flow.',
    },
    custom: {
      title: 'Custom Priority Order',
      description: 'Pays debts according to your personalized manual priority ranking.',
    },
    minimums_only: {
      title: 'Baseline Minimum Payments Only',
      description: 'Only paying the minimum required amount each month without applying any surplus.',
    },
  };

  const schedule: MonthlyAmortizationSnapshot[] = [];
  const milestones: DebtMilestone[] = [];
  const negativeAmortDebts = detectNegativeAmortization(debts);

  if (activeDebts.length === 0) {
    const today = new Date(startDate);
    return {
      strategy,
      title: titles[strategy].title,
      description: titles[strategy].description,
      totalMonths: 0,
      debtFreeDate: formatMonthYear(today),
      debtFreeDateObj: today,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      totalAmountPaid: 0,
      monthlySurplusUsed: monthlySurplus,
      schedule: [],
      milestones: [],
      negativeAmortizationDebts: [],
      unpayable: false,
      remainingBalance: 0,
    };
  }

  let totalInterestAllTime = 0;
  let totalPrincipalAllTime = 0;
  let totalAmountPaidAllTime = 0;
  let month = 0;

  // Track rolled-over freed minimum payments from eliminated debts
  let rolledOverMinPayments = 0;

  while (activeDebts.some((d) => d.currentBalance > 0.01) && month < maxMonths) {
    month++;
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + month - 1, 1);
    const dateFormatted = formatMonthYear(currentDate);

    let monthTotalInterest = 0;
    let monthTotalPrincipal = 0;
    let monthTotalPayment = 0;
    const startBalanceThisMonth = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);

    const paymentsThisMonth: MonthlyAmortizationPayment[] = [];
    const paidOffNamesThisMonth: string[] = [];

    // Step 1: Accrue interest on all active debts & calculate base required minimums
    const debtStatesThisMonth = activeDebts.map((debt) => {
      if (debt.currentBalance <= 0.01) {
        return {
          debt,
          interest: 0,
          minPaymentRequired: 0,
          isActive: false,
        };
      }

      const interest = calculateMonthlyInterest(debt.currentBalance, debt.apr, decimals);
      const balanceWithInterest = debt.currentBalance + interest;
      const minPaymentRequired = Math.min(balanceWithInterest, debt.minPayment);

      return {
        debt,
        interest,
        minPaymentRequired,
        isActive: true,
      };
    });

    // Step 2: Determine total extra pool available this month
    // Base surplus + rolled over freed minimum payments
    let availableExtra = strategy === 'minimums_only' ? 0 : Math.max(0, monthlySurplus) + rolledOverMinPayments;

    // Handle Windfall
    if (windfall && windfall.amount > 0) {
      if (windfall.type === 'one_time' && month === 1) {
        availableExtra += windfall.amount;
      } else if (windfall.type === 'monthly_extra') {
        availableExtra += windfall.amount;
      }
    }

    // Sort active debts by selected strategy priority to direct extra payments
    const sortedActive = sortDebtsByStrategy(
      debtStatesThisMonth.filter((s) => s.isActive).map((s) => s.debt),
      strategy
    );

    // If windfall specifies a target debt in month 1, we can prioritize that specific debt first
    let prioritizedDebtId = sortedActive.length > 0 ? sortedActive[0].id : null;
    if (windfall?.targetDebtId && windfall.targetDebtId !== 'auto_optimal' && month === 1) {
      const targeted = sortedActive.find((d) => d.id === windfall.targetDebtId);
      if (targeted) {
        prioritizedDebtId = targeted.id;
      }
    }

    // Step 3: Execute payments
    // First, pay the required minimum on each active debt
    for (const state of debtStatesThisMonth) {
      if (!state.isActive) continue;

      const debt = state.debt;
      const interest = state.interest;
      debt.cumulativeInterest += interest;
      monthTotalInterest += interest;

      // Base payment is the minimum
      const paymentForDebt = state.minPaymentRequired;
      const startBal = debt.currentBalance;

      // Principal portion from minimum
      const principalFromMin = Math.max(0, paymentForDebt - interest);
      debt.currentBalance = roundHalfUp(Math.max(0, debt.currentBalance + interest - paymentForDebt), decimals);

      // Store initial state for extra allocation pass
      paymentsThisMonth.push({
        debtId: debt.id,
        debtName: debt.name,
        category: debt.category,
        startBalance: roundHalfUp(startBal, decimals),
        interestCharged: interest,
        principalPaid: principalFromMin,
        minPayment: paymentForDebt,
        extraPayment: 0,
        totalPayment: paymentForDebt,
        endBalance: debt.currentBalance,
        isPaidOffThisMonth: false,
      });
    }

    // Step 4: Allocate discretionary surplus/windfall to priority debts (cascade rollover)
    if (availableExtra > 0.01 && strategy !== 'minimums_only') {
      // Re-order by priority, putting explicit windfall target first if month 1
      const priorityOrder = [...sortedActive].sort((a, b) => {
        if (month === 1 && prioritizedDebtId) {
          if (a.id === prioritizedDebtId) return -1;
          if (b.id === prioritizedDebtId) return 1;
        }
        return 0;
      });

      for (const targetDebt of priorityOrder) {
        if (availableExtra <= 0.01) break;

        const liveDebt = activeDebts.find((d) => d.id === targetDebt.id);
        const paymentRecord = paymentsThisMonth.find((p) => p.debtId === targetDebt.id);

        if (!liveDebt || !paymentRecord || liveDebt.currentBalance <= 0.01) continue;

        const amountToPayoff = liveDebt.currentBalance;
        const extraToApply = roundHalfUp(Math.min(availableExtra, amountToPayoff), decimals);

        liveDebt.currentBalance = roundHalfUp(Math.max(0, liveDebt.currentBalance - extraToApply), decimals);
        availableExtra = roundHalfUp(Math.max(0, availableExtra - extraToApply), decimals);

        paymentRecord.extraPayment = roundHalfUp(paymentRecord.extraPayment + extraToApply, decimals);
        paymentRecord.principalPaid = roundHalfUp(paymentRecord.principalPaid + extraToApply, decimals);
        paymentRecord.totalPayment = roundHalfUp(paymentRecord.totalPayment + extraToApply, decimals);
        paymentRecord.endBalance = liveDebt.currentBalance;
      }
    }

    // Step 5: Check payoffs and update milestones & rollovers
    for (const p of paymentsThisMonth) {
      const debt = activeDebts.find((d) => d.id === p.debtId)!;
      monthTotalPrincipal += p.principalPaid;
      monthTotalPayment += p.totalPayment;
      debt.cumulativePrincipal += p.principalPaid;

      if (debt.currentBalance <= 0.01 && !milestones.some((m) => m.debtId === debt.id)) {
        debt.currentBalance = 0;
        p.endBalance = 0;
        p.isPaidOffThisMonth = true;
        paidOffNamesThisMonth.push(debt.name);

        milestones.push({
          debtId: debt.id,
          debtName: debt.name,
          category: debt.category,
          originalBalance: debt.originalBalance,
          paidOffMonth: month,
          paidOffDate: dateFormatted,
          totalInterestPaid: roundHalfUp(debt.cumulativeInterest, decimals),
          totalPrincipalPaid: roundHalfUp(debt.cumulativePrincipal, decimals),
        });

        // Add this debt's minimum payment into the rollover snowball pool!
        if (strategy !== 'minimums_only') {
          rolledOverMinPayments += debt.minPayment;
        }
      }
    }

    totalInterestAllTime += monthTotalInterest;
    totalPrincipalAllTime += monthTotalPrincipal;
    totalAmountPaidAllTime += monthTotalPayment;

    const endBalanceThisMonth = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
    const remainingCount = activeDebts.filter((d) => d.currentBalance > 0.01).length;

    schedule.push({
      monthIndex: month,
      dateFormatted,
      year: currentDate.getFullYear(),
      monthNumber: currentDate.getMonth(),
      totalStartingBalance: roundHalfUp(startBalanceThisMonth, decimals),
      totalInterestCharged: roundHalfUp(monthTotalInterest, decimals),
      totalPrincipalPaid: roundHalfUp(monthTotalPrincipal, decimals),
      totalPayment: roundHalfUp(monthTotalPayment, decimals),
      totalEndingBalance: roundHalfUp(endBalanceThisMonth, decimals),
      payments: paymentsThisMonth,
      remainingDebtsCount: remainingCount,
      paidOffDebtsThisMonth: paidOffNamesThisMonth,
    });
  }

  const finalDate = new Date(startDate.getFullYear(), startDate.getMonth() + Math.max(month - 1, 0), 1);
  const remainingBalance = roundHalfUp(
    activeDebts.reduce((sum, d) => sum + d.currentBalance, 0),
    decimals
  );
  const tolerance = decimals === 0 ? 1 : 0.01;
  const paidOff = remainingBalance <= tolerance;

  return {
    strategy,
    title: titles[strategy].title,
    description: titles[strategy].description,
    totalMonths: month,
    debtFreeDate: paidOff ? formatMonthYear(finalDate) : 'Does not pay off',
    debtFreeDateObj: finalDate,
    totalInterestPaid: roundHalfUp(totalInterestAllTime, decimals),
    totalPrincipalPaid: roundHalfUp(totalPrincipalAllTime, decimals),
    totalAmountPaid: roundHalfUp(totalAmountPaidAllTime, decimals),
    monthlySurplusUsed: monthlySurplus,
    schedule,
    milestones,
    negativeAmortizationDebts: negativeAmortDebts,
    unpayable: remainingBalance > tolerance,
    remainingBalance,
  };
}

/**
 * Runs comparative engine against Avalanche, Snowball, Minimums-Only, and Windfall simulations
 */
function savedInterest(baseline: PayoffStrategyResult, accelerated: PayoffStrategyResult, decimals: number): number {
  if (baseline.unpayable || accelerated.unpayable) return 0;
  return roundHalfUp(Math.max(0, baseline.totalInterestPaid - accelerated.totalInterestPaid), decimals);
}

function savedMonths(baseline: PayoffStrategyResult, accelerated: PayoffStrategyResult): number {
  if (baseline.unpayable || accelerated.unpayable) return 0;
  return Math.max(0, baseline.totalMonths - accelerated.totalMonths);
}

function windfallTargetFromSchedule(
  result: PayoffStrategyResult,
  windfall: WindfallSimulation,
  debts: DebtItem[]
): { id: string; name: string } {
  const month1 = result.schedule[0];
  const withExtra = month1?.payments.filter((p) => p.extraPayment > 0.01) ?? [];
  if (windfall.targetDebtId && windfall.targetDebtId !== 'auto_optimal') {
    const named = debts.find((d) => d.id === windfall.targetDebtId);
    const applied = withExtra.find((p) => p.debtId === windfall.targetDebtId) ?? withExtra[0];
    if (applied) return { id: applied.debtId, name: applied.debtName };
    if (named) return { id: named.id, name: named.name };
  }
  if (withExtra[0]) return { id: withExtra[0].debtId, name: withExtra[0].debtName };
  return { id: '', name: 'priority debt' };
}

export function runEngineComparison({
  debts,
  monthlySurplus,
  windfall,
  startDate = new Date(),
  decimals = 2,
  activeStrategy = 'avalanche',
}: {
  debts: DebtItem[];
  monthlySurplus: number;
  windfall?: WindfallSimulation;
  startDate?: Date;
  decimals?: number;
  activeStrategy?: OptimizationStrategy;
}): EngineComparison {
  // 1. Baseline: Minimum Payments Only
  const baselineMinimums = simulatePayoffSchedule({
    debts,
    monthlySurplus: 0,
    strategy: 'minimums_only',
    startDate,
    decimals,
  });

  // 2. Mathematically Optimal: Debt Avalanche
  const avalanche = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'avalanche',
    startDate,
    decimals,
  });

  // 3. Behavioral/Psychological Momentum: Debt Snowball
  const snowball = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'snowball',
    startDate,
    decimals,
  });

  // 4. Custom Priority (if user defined priorities)
  const custom = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'custom',
    startDate,
    decimals,
  });

  // 5. Windfall Simulation (if requested)
  let windfallAvalanche: PayoffStrategyResult | undefined;
  let windfallSnowball: PayoffStrategyResult | undefined;
  let windfallImpact: EngineComparison['windfallImpact'];

  if (windfall && windfall.amount > 0) {
    windfallAvalanche = simulatePayoffSchedule({
      debts,
      monthlySurplus,
      strategy: 'avalanche',
      windfall,
      startDate,
      decimals,
    });

    windfallSnowball = simulatePayoffSchedule({
      debts,
      monthlySurplus,
      strategy: 'snowball',
      windfall,
      startDate,
      decimals,
    });

    const windfallCustom = simulatePayoffSchedule({
      debts,
      monthlySurplus,
      strategy: 'custom',
      windfall,
      startDate,
      decimals,
    });

    const baselineForStrategy =
      activeStrategy === 'snowball'
        ? snowball
        : activeStrategy === 'custom'
          ? custom
          : activeStrategy === 'minimums_only'
            ? baselineMinimums
            : avalanche;
    const windfallForStrategy =
      activeStrategy === 'snowball'
        ? windfallSnowball
        : activeStrategy === 'custom'
          ? windfallCustom
          : activeStrategy === 'minimums_only'
            ? simulatePayoffSchedule({
                debts,
                monthlySurplus: 0,
                strategy: 'minimums_only',
                windfall,
                startDate,
                decimals,
              })
            : windfallAvalanche;

    const sortedForWindfall = sortDebtsByStrategy(debts.filter((d) => d.balance > 0), 'avalanche');
    const recommendedTarget = sortedForWindfall[0];
    const applied = windfallTargetFromSchedule(windfallForStrategy, windfall, debts);

    const interestSaved =
      baselineForStrategy.unpayable || windfallForStrategy.unpayable
        ? 0
        : Math.max(0, baselineForStrategy.totalInterestPaid - windfallForStrategy.totalInterestPaid);
    const monthsSaved =
      baselineForStrategy.unpayable || windfallForStrategy.unpayable
        ? 0
        : Math.max(0, baselineForStrategy.totalMonths - windfallForStrategy.totalMonths);

    windfallImpact = {
      interestSaved: roundHalfUp(interestSaved, decimals),
      monthsSaved,
      appliedTargetDebtName: applied.name,
      appliedTargetDebtId: applied.id,
      recommendedTargetDebtName: recommendedTarget?.name || 'Top APR Debt',
      recommendedTargetDebtId: recommendedTarget?.id || '',
      newDebtFreeDate: windfallForStrategy.debtFreeDate,
      originalDebtFreeDate: baselineForStrategy.debtFreeDate,
      comparedStrategy: activeStrategy,
    };
  }

  const avalancheInterestSaved = savedInterest(baselineMinimums, avalanche, decimals);
  const avalancheMonthsSaved = savedMonths(baselineMinimums, avalanche);

  const snowballInterestSaved = savedInterest(baselineMinimums, snowball, decimals);
  const snowballMonthsSaved = savedMonths(baselineMinimums, snowball);

  const avalancheVsSnowballInterestSaved = savedInterest(snowball, avalanche, decimals);

  return {
    baselineMinimums,
    avalanche,
    snowball,
    custom,
    windfallAvalanche,
    windfallSnowball,
    avalancheInterestSaved,
    avalancheMonthsSaved,
    snowballInterestSaved,
    snowballMonthsSaved,
    avalancheVsSnowballInterestSaved,
    windfallImpact,
  };
}

/**
 * Currency formatter helper
 */
export function formatCurrencyValue(amount: number, symbol: string = '$', decimals: number = 0): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Generates initial Month 1 execution checklist for user to act on immediately
 */
export function generateMonthChecklist(
  strategyResult: PayoffStrategyResult,
  debts: DebtItem[]
): Array<{
  debtId: string;
  debtName: string;
  category: DebtCategory;
  dueDate: number;
  minPayment: number;
  extraPayment: number;
  totalPayment: number;
  balanceRemaining: number;
  isFocusDebt: boolean;
  completed: boolean;
}> {
  if (!strategyResult.schedule || strategyResult.schedule.length === 0) return [];

  const firstMonth = strategyResult.schedule[0];
  const items = firstMonth.payments.map((payment) => {
    const originalDebt = debts.find((d) => d.id === payment.debtId);
    return {
      debtId: payment.debtId,
      debtName: payment.debtName,
      category: payment.category,
      dueDate: originalDebt?.dueDate || 15,
      minPayment: payment.minPayment,
      extraPayment: payment.extraPayment,
      totalPayment: payment.totalPayment,
      balanceRemaining: payment.endBalance,
      isFocusDebt: payment.extraPayment > 0,
      completed: false,
    };
  });

  // Sort by due date (1-31), tie-break by total payment descending
  return items.sort((a, b) => a.dueDate - b.dueDate || b.totalPayment - a.totalPayment);
}

const MAX_IMPORT_CHARS = 1_000_000;
const IMPORT_STRATEGIES = new Set<OptimizationStrategy>(['avalanche', 'snowball', 'custom', 'minimums_only']);
const IMPORT_CATEGORIES = new Set<DebtCategory>([
  'credit_card',
  'personal_loan',
  'auto_loan',
  'student_loan',
  'mortgage',
  'medical',
  'other',
]);
const IMPORT_FREQUENCIES = new Set<PayFrequency>(['monthly', 'bi-weekly', 'semi-monthly', 'weekly']);
const IMPORT_CURRENCIES = new Set<CurrencyCode>(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN']);

function finiteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeDebt(raw: unknown, index: number): DebtItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? '').trim().slice(0, 120);
  if (!name) return null;
  const balance = finiteNumber(row.balance, NaN);
  const apr = finiteNumber(row.apr, NaN);
  const minPayment = finiteNumber(row.minPayment, NaN);
  if (!Number.isFinite(balance) || balance < 0 || balance > 1_000_000_000) return null;
  if (!Number.isFinite(apr) || apr < 0 || apr > 100) return null;
  if (!Number.isFinite(minPayment) || minPayment < 0 || minPayment > balance + 1_000_000) return null;
  const category = IMPORT_CATEGORIES.has(row.category as DebtCategory) ? (row.category as DebtCategory) : 'other';
  const due = Math.round(finiteNumber(row.dueDate, 15));
  const id = String(row.id ?? '').trim().slice(0, 80) || `debt-import-${index + 1}`;
  return {
    id,
    name,
    category,
    balance,
    apr,
    minPayment,
    dueDate: Math.min(31, Math.max(1, due || 15)),
    customPriority: Math.max(1, Math.round(finiteNumber(row.customPriority, index + 1))),
    notes: row.notes != null ? String(row.notes).slice(0, 500) : undefined,
    color: typeof row.color === 'string' ? row.color.slice(0, 32) : undefined,
  };
}

function sanitizeProfile(raw: unknown): import('../types/debt.ts').UserFinancialProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const breakdownRaw = (row.expensesBreakdown && typeof row.expensesBreakdown === 'object'
    ? row.expensesBreakdown
    : {}) as Record<string, unknown>;
  const expensesBreakdown = {
    housing: Math.max(0, finiteNumber(breakdownRaw.housing)),
    utilities: Math.max(0, finiteNumber(breakdownRaw.utilities)),
    groceries: Math.max(0, finiteNumber(breakdownRaw.groceries)),
    transportation: Math.max(0, finiteNumber(breakdownRaw.transportation)),
    insurance: Math.max(0, finiteNumber(breakdownRaw.insurance)),
    subscriptions: Math.max(0, finiteNumber(breakdownRaw.subscriptions)),
    other: Math.max(0, finiteNumber(breakdownRaw.other)),
  };
  const livingFromBreakdown = Object.values(expensesBreakdown).reduce((s, v) => s + v, 0);
  const payFrequency = IMPORT_FREQUENCIES.has(row.payFrequency as PayFrequency)
    ? (row.payFrequency as PayFrequency)
    : 'monthly';
  const incomePerPeriod = Math.max(0, finiteNumber(row.incomePerPeriod));
  const manual = row.manualExtraMonthlySurplus;
  const manualExtra =
    manual === undefined || manual === null ? undefined : Math.max(0, finiteNumber(manual, NaN));
  return {
    name: String(row.name ?? 'Friend').trim().slice(0, 80) || 'Friend',
    currency: IMPORT_CURRENCIES.has(row.currency as CurrencyCode) ? (row.currency as CurrencyCode) : 'USD',
    payFrequency,
    incomePerPeriod,
    monthlyNetIncome: normalizeToMonthlyIncome(incomePerPeriod, payFrequency),
    livingExpenses: livingFromBreakdown || Math.max(0, finiteNumber(row.livingExpenses)),
    expensesBreakdown,
    ...(Number.isFinite(manualExtra) ? { manualExtraMonthlySurplus: manualExtra } : {}),
  };
}

export function parseDebtBackup(jsonStr: string): {
  success: boolean;
  error?: string;
  profile?: import('../types/debt.ts').UserFinancialProfile;
  debts?: DebtItem[];
  strategy?: OptimizationStrategy;
  windfall?: WindfallSimulation;
} {
  if (jsonStr.length > MAX_IMPORT_CHARS) {
    return { success: false, error: 'Backup is too large to import.' };
  }
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: 'That text is not valid JSON.' };
  }
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid DebtZero JSON format. Missing profile or debts.' };
  }
  const row = data as Record<string, unknown>;
  if (!row.profile || !Array.isArray(row.debts)) {
    return { success: false, error: 'Invalid DebtZero JSON format. Missing profile or debts.' };
  }
  if (row.debts.length > 100) {
    return { success: false, error: 'Backup has more than 100 debts.' };
  }
  const profile = sanitizeProfile(row.profile);
  if (!profile) return { success: false, error: 'Profile in the backup could not be read.' };
  const debts: DebtItem[] = [];
  const seen = new Set<string>();
  row.debts.forEach((item, index) => {
    const debt = sanitizeDebt(item, index);
    if (!debt) return;
    let id = debt.id;
    while (seen.has(id)) id = `${debt.id}-${debts.length + 1}`;
    seen.add(id);
    debts.push({ ...debt, id });
  });
  if (debts.length === 0) {
    return { success: false, error: 'No usable debts in that backup. Check balances and APRs.' };
  }
  const strategy = IMPORT_STRATEGIES.has(row.strategy as OptimizationStrategy)
    ? (row.strategy as OptimizationStrategy)
    : undefined;
  let windfall: WindfallSimulation | undefined;
  if (row.windfall && typeof row.windfall === 'object') {
    const w = row.windfall as Record<string, unknown>;
    const amount = finiteNumber(w.amount, NaN);
    if (Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000) {
      windfall = {
        amount,
        type: w.type === 'monthly_extra' ? 'monthly_extra' : 'one_time',
        targetDebtId:
          w.targetDebtId === 'auto_optimal' || debts.some((d) => d.id === w.targetDebtId)
            ? (w.targetDebtId as string)
            : 'auto_optimal',
      };
    }
  }
  return { success: true, profile, debts, strategy, windfall };
}
