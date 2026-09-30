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
} from '../types/debt.ts';

/**
 * Standard monthly compounding interest formula
 * Interest = Balance * (APR / 100 / 12)
 */
export function calculateMonthlyInterest(balance: number, apr: number): number {
  if (balance <= 0 || apr <= 0) return 0;
  return Number((balance * (apr / 100 / 12)).toFixed(2));
}

/**
 * Normalizes any pay frequency to a net monthly take-home amount
 */
export function normalizeToMonthlyIncome(amount: number, frequency: PayFrequency): number {
  if (!amount || amount <= 0) return 0;
  switch (frequency) {
    case 'weekly':
      return Number(((amount * 52) / 12).toFixed(2));
    case 'bi-weekly':
      return Number(((amount * 26) / 12).toFixed(2));
    case 'semi-monthly':
      return Number((amount * 2).toFixed(2));
    case 'monthly':
    default:
      return Number(amount.toFixed(2));
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
  const fcf = Number((monthlyIncome - livingExpenses - totalMin).toFixed(2));
  const dti = monthlyIncome > 0 ? Number(((totalMin / monthlyIncome) * 100).toFixed(1)) : 0;

  return {
    monthlyIncome,
    livingExpenses,
    totalMinimumDebtPayments: Number(totalMin.toFixed(2)),
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
      const deficit = Number((monthlyInterest - debt.minPayment).toFixed(2));
      // Recommend interest + at least 1.5% of principal or $25, whichever is greater
      const recommended = Number((monthlyInterest + Math.max(25, debt.balance * 0.015)).toFixed(2));
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
}: {
  debts: DebtItem[];
  monthlySurplus: number;
  strategy: OptimizationStrategy;
  windfall?: WindfallSimulation;
  startDate?: Date;
  maxMonths?: number;
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

      const interest = calculateMonthlyInterest(debt.currentBalance, debt.apr);
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
      debt.currentBalance = Number(Math.max(0, debt.currentBalance + interest - paymentForDebt).toFixed(2));

      // Store initial state for extra allocation pass
      paymentsThisMonth.push({
        debtId: debt.id,
        debtName: debt.name,
        category: debt.category,
        startBalance: Number(startBal.toFixed(2)),
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
        const extraToApply = Number(Math.min(availableExtra, amountToPayoff).toFixed(2));

        liveDebt.currentBalance = Number(Math.max(0, liveDebt.currentBalance - extraToApply).toFixed(2));
        availableExtra = Number(Math.max(0, availableExtra - extraToApply).toFixed(2));

        paymentRecord.extraPayment = Number((paymentRecord.extraPayment + extraToApply).toFixed(2));
        paymentRecord.principalPaid = Number((paymentRecord.principalPaid + extraToApply).toFixed(2));
        paymentRecord.totalPayment = Number((paymentRecord.totalPayment + extraToApply).toFixed(2));
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
          totalInterestPaid: Number(debt.cumulativeInterest.toFixed(2)),
          totalPrincipalPaid: Number(debt.cumulativePrincipal.toFixed(2)),
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
      totalStartingBalance: Number(startBalanceThisMonth.toFixed(2)),
      totalInterestCharged: Number(monthTotalInterest.toFixed(2)),
      totalPrincipalPaid: Number(monthTotalPrincipal.toFixed(2)),
      totalPayment: Number(monthTotalPayment.toFixed(2)),
      totalEndingBalance: Number(endBalanceThisMonth.toFixed(2)),
      payments: paymentsThisMonth,
      remainingDebtsCount: remainingCount,
      paidOffDebtsThisMonth: paidOffNamesThisMonth,
    });
  }

  const finalDate = new Date(startDate.getFullYear(), startDate.getMonth() + month - 1, 1);

  return {
    strategy,
    title: titles[strategy].title,
    description: titles[strategy].description,
    totalMonths: month,
    debtFreeDate: formatMonthYear(finalDate),
    debtFreeDateObj: finalDate,
    totalInterestPaid: Number(totalInterestAllTime.toFixed(2)),
    totalPrincipalPaid: Number(totalPrincipalAllTime.toFixed(2)),
    totalAmountPaid: Number(totalAmountPaidAllTime.toFixed(2)),
    monthlySurplusUsed: monthlySurplus,
    schedule,
    milestones,
    negativeAmortizationDebts: negativeAmortDebts,
  };
}

/**
 * Runs comparative engine against Avalanche, Snowball, Minimums-Only, and Windfall simulations
 */
export function runEngineComparison({
  debts,
  monthlySurplus,
  windfall,
  startDate = new Date(),
}: {
  debts: DebtItem[];
  monthlySurplus: number;
  windfall?: WindfallSimulation;
  startDate?: Date;
}): EngineComparison {
  // 1. Baseline: Minimum Payments Only
  const baselineMinimums = simulatePayoffSchedule({
    debts,
    monthlySurplus: 0,
    strategy: 'minimums_only',
    startDate,
  });

  // 2. Mathematically Optimal: Debt Avalanche
  const avalanche = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'avalanche',
    startDate,
  });

  // 3. Behavioral/Psychological Momentum: Debt Snowball
  const snowball = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'snowball',
    startDate,
  });

  // 4. Custom Priority (if user defined priorities)
  const custom = simulatePayoffSchedule({
    debts,
    monthlySurplus,
    strategy: 'custom',
    startDate,
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
    });

    windfallSnowball = simulatePayoffSchedule({
      debts,
      monthlySurplus,
      strategy: 'snowball',
      windfall,
      startDate,
    });

    // Identify recommended target debt: highest APR active debt
    const sortedForWindfall = sortDebtsByStrategy(debts.filter((d) => d.balance > 0), 'avalanche');
    const recommendedTarget = sortedForWindfall[0];

    const interestSaved = Math.max(0, avalanche.totalInterestPaid - windfallAvalanche.totalInterestPaid);
    const monthsSaved = Math.max(0, avalanche.totalMonths - windfallAvalanche.totalMonths);

    windfallImpact = {
      interestSaved: Number(interestSaved.toFixed(2)),
      monthsSaved,
      recommendedTargetDebtName: recommendedTarget?.name || 'Top APR Debt',
      recommendedTargetDebtId: recommendedTarget?.id || '',
      newDebtFreeDate: windfallAvalanche.debtFreeDate,
      originalDebtFreeDate: avalanche.debtFreeDate,
    };
  }

  const avalancheInterestSaved = Math.max(0, baselineMinimums.totalInterestPaid - avalanche.totalInterestPaid);
  const avalancheMonthsSaved = Math.max(0, baselineMinimums.totalMonths - avalanche.totalMonths);

  const snowballInterestSaved = Math.max(0, baselineMinimums.totalInterestPaid - snowball.totalInterestPaid);
  const snowballMonthsSaved = Math.max(0, baselineMinimums.totalMonths - snowball.totalMonths);

  const avalancheVsSnowballInterestSaved = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);

  return {
    baselineMinimums,
    avalanche,
    snowball,
    custom,
    windfallAvalanche,
    windfallSnowball,
    avalancheInterestSaved: Number(avalancheInterestSaved.toFixed(2)),
    avalancheMonthsSaved,
    snowballInterestSaved: Number(snowballInterestSaved.toFixed(2)),
    snowballMonthsSaved,
    avalancheVsSnowballInterestSaved: Number(avalancheVsSnowballInterestSaved.toFixed(2)),
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
