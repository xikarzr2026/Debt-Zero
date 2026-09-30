import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMonthlyInterest,
  normalizeToMonthlyIncome,
  calculateFreeCashFlow,
  detectNegativeAmortization,
  sortDebtsByStrategy,
  simulatePayoffSchedule,
  runEngineComparison,
  generateMonthChecklist,
  formatCurrencyValue,
} from '../src/lib/debtEngine.ts';
import type { DebtItem } from '../src/types/debt.ts';

// Helper to create test debts
function createDebt(partial: Partial<DebtItem> & { id: string; name: string; balance: number; apr: number; minPayment: number }): DebtItem {
  return {
    category: 'credit_card',
    dueDate: 15,
    customPriority: 1,
    ...partial,
  };
}

test('1. calculateMonthlyInterest - formulas & precision', () => {
  // $10,000 at 24% APR -> $10,000 * 0.24 / 12 = $200.00
  assert.equal(calculateMonthlyInterest(10000, 24), 200.00);

  // $1,234.56 at 19.99% APR -> 1234.56 * 0.1999 / 12 = 20.565696... -> 20.57
  assert.equal(calculateMonthlyInterest(1234.56, 19.99), 20.57);

  // 0% interest loan -> $0.00
  assert.equal(calculateMonthlyInterest(5000, 0), 0);

  // Zero or negative balance -> $0.00
  assert.equal(calculateMonthlyInterest(0, 20), 0);
  assert.equal(calculateMonthlyInterest(-100, 20), 0);
  assert.equal(calculateMonthlyInterest(1000, -5), 0);
});

test('2. normalizeToMonthlyIncome - pay frequencies', () => {
  // Weekly: $1,000/wk * 52 / 12 = $4,333.33
  assert.equal(normalizeToMonthlyIncome(1000, 'weekly'), 4333.33);

  // Bi-weekly: $2,000/bi-weekly * 26 / 12 = $4,333.33
  assert.equal(normalizeToMonthlyIncome(2000, 'bi-weekly'), 4333.33);

  // Semi-monthly: $2,500 * 2 = $5,000.00
  assert.equal(normalizeToMonthlyIncome(2500, 'semi-monthly'), 5000.00);

  // Monthly: $6,000 = $6,000.00
  assert.equal(normalizeToMonthlyIncome(6000, 'monthly'), 6000.00);

  // Non-positive income guards
  assert.equal(normalizeToMonthlyIncome(0, 'monthly'), 0);
  assert.equal(normalizeToMonthlyIncome(-500, 'bi-weekly'), 0);
});

test('3. calculateFreeCashFlow & DTI ratio', () => {
  const debts: DebtItem[] = [
    createDebt({ id: '1', name: 'Card A', balance: 5000, apr: 22, minPayment: 150 }),
    createDebt({ id: '2', name: 'Loan B', balance: 10000, apr: 8, minPayment: 250 }),
    createDebt({ id: '3', name: 'Paid Off', balance: 0, apr: 15, minPayment: 50 }), // $0 balance should not count!
  ];

  const result = calculateFreeCashFlow(5000, 2000, debts);

  // Total min payments should be 150 + 250 = 400 (ignoring $0 balance debt)
  assert.equal(result.totalMinimumDebtPayments, 400.00);
  // Free Cash Flow = 5000 - 2000 - 400 = 2600.00
  assert.equal(result.freeCashFlow, 2600.00);
  assert.equal(result.isDeficit, false);
  // DTI = (400 / 5000) * 100 = 8.0%
  assert.equal(result.debtToIncomeRatio, 8.0);

  // Deficit scenario
  const deficitResult = calculateFreeCashFlow(2000, 1800, debts);
  assert.equal(deficitResult.freeCashFlow, -200.00);
  assert.equal(deficitResult.isDeficit, true);
});

test('4. detectNegativeAmortization - alerts & recommendations', () => {
  const healthyDebt = createDebt({ id: '1', name: 'Healthy', balance: 1000, apr: 12, minPayment: 50 }); // Interest is $10, min is $50
  const trapDebt = createDebt({ id: '2', name: 'Trap Card', balance: 10000, apr: 24, minPayment: 150 }); // Interest is $200, min is $150 (deficit: $50)
  const equalDebt = createDebt({ id: '3', name: 'Stagnant', balance: 6000, apr: 20, minPayment: 100 }); // Interest is $100, min is $100 (deficit: $0)

  const alerts = detectNegativeAmortization([healthyDebt, trapDebt, equalDebt]);

  assert.equal(alerts.length, 2);
  const trapAlert = alerts.find((a) => a.debtId === '2')!;
  assert.equal(trapAlert.interestAccruing, 200.00);
  assert.equal(trapAlert.deficit, 50.00);
  // Recommended = interest ($200) + max($25, $10000 * 0.015 = $150) = $350.00
  assert.equal(trapAlert.recommendedMinimum, 350.00);
});

test('5. sortDebtsByStrategy - Avalanche, Snowball, Custom', () => {
  const d1 = createDebt({ id: '1', name: 'Card 1', balance: 5000, apr: 25.0, minPayment: 150, customPriority: 3 });
  const d2 = createDebt({ id: '2', name: 'Card 2', balance: 1000, apr: 18.0, minPayment: 50, customPriority: 1 });
  const d3 = createDebt({ id: '3', name: 'Card 3', balance: 3000, apr: 25.0, minPayment: 100, customPriority: 2 });

  // Avalanche: Highest APR first. Ties broken by lowest balance (Card 3 before Card 1)
  const avalanche = sortDebtsByStrategy([d1, d2, d3], 'avalanche');
  assert.deepEqual(avalanche.map((d) => d.id), ['3', '1', '2']);

  // Snowball: Lowest balance first (Card 2: $1000, Card 3: $3000, Card 1: $5000)
  const snowball = sortDebtsByStrategy([d1, d2, d3], 'snowball');
  assert.deepEqual(snowball.map((d) => d.id), ['2', '3', '1']);

  // Custom priority: 1, 2, 3
  const custom = sortDebtsByStrategy([d1, d2, d3], 'custom');
  assert.deepEqual(custom.map((d) => d.id), ['2', '3', '1']);
});

test('6. simulatePayoffSchedule - Amortization Accounting Identity', () => {
  const debts: DebtItem[] = [
    createDebt({ id: '1', name: 'High APR Card', balance: 3000, apr: 24, minPayment: 100 }),
    createDebt({ id: '2', name: 'Small Balance Card', balance: 800, apr: 15, minPayment: 40 }),
  ];

  const result = simulatePayoffSchedule({
    debts,
    monthlySurplus: 200,
    strategy: 'avalanche',
    startDate: new Date('2026-10-01'),
  });

  assert.ok(result.totalMonths > 0);
  assert.ok(result.schedule.length === result.totalMonths);

  // Verify Accounting Identity in every month:
  // totalEndingBalance = totalStartingBalance + totalInterestCharged - totalPayment
  for (const snap of result.schedule) {
    const calculatedEnd = Number((snap.totalStartingBalance + snap.totalInterestCharged - snap.totalPayment).toFixed(2));
    assert.equal(
      snap.totalEndingBalance,
      calculatedEnd,
      `Month ${snap.monthIndex} accounting identity check failed`
    );

    // Sum of individual payment records should match monthly totals
    const sumPayments = Number(snap.payments.reduce((s, p) => s + p.totalPayment, 0).toFixed(2));
    assert.equal(snap.totalPayment, sumPayments, `Month ${snap.monthIndex} total payment mismatch`);

    const sumInterest = Number(snap.payments.reduce((s, p) => s + p.interestCharged, 0).toFixed(2));
    assert.equal(snap.totalInterestCharged, sumInterest, `Month ${snap.monthIndex} interest mismatch`);
  }

  // Final month ending balance must be 0
  assert.equal(result.schedule[result.schedule.length - 1].totalEndingBalance, 0);
});

test('7. simulatePayoffSchedule - Avalanche vs Snowball vs Minimums-Only', () => {
  const debts: DebtItem[] = [
    createDebt({ id: '1', name: 'Credit Card', balance: 8000, apr: 26.99, minPayment: 220 }),
    createDebt({ id: '2', name: 'Personal Loan', balance: 3500, apr: 11.5, minPayment: 120 }),
    createDebt({ id: '3', name: 'Auto Loan', balance: 12000, apr: 6.9, minPayment: 280 }),
  ];

  const comparison = runEngineComparison({
    debts,
    monthlySurplus: 350,
    startDate: new Date('2026-10-01'),
  });

  // 1. Avalanche must pay less or equal total interest than Snowball
  assert.ok(
    comparison.avalanche.totalInterestPaid <= comparison.snowball.totalInterestPaid,
    `Avalanche interest (${comparison.avalanche.totalInterestPaid}) should be <= Snowball (${comparison.snowball.totalInterestPaid})`
  );

  // 2. Both accelerated strategies must finish MUCH faster than baseline minimums
  assert.ok(
    comparison.avalanche.totalMonths < comparison.baselineMinimums.totalMonths,
    `Avalanche (${comparison.avalanche.totalMonths} mos) should finish earlier than minimums (${comparison.baselineMinimums.totalMonths} mos)`
  );

  // 3. Snowball knocks out the smallest balance debt first
  const snowballFirstPaid = comparison.snowball.milestones[0];
  assert.equal(snowballFirstPaid.debtName, 'Personal Loan', 'Snowball should eliminate lowest balance debt first');

  // 4. Avalanche knocks out highest APR first
  const avalancheFirstPaid = comparison.avalanche.milestones[0];
  assert.equal(avalancheFirstPaid.debtName, 'Credit Card', 'Avalanche should eliminate highest APR debt first');

  // 5. Interest saved metrics must be positive
  assert.ok(comparison.avalancheInterestSaved > 0);
  assert.ok(comparison.snowballInterestSaved > 0);
});

test('8. simulatePayoffSchedule - Windfall simulation impact', () => {
  const debts: DebtItem[] = [
    createDebt({ id: '1', name: 'Card A', balance: 5000, apr: 24, minPayment: 150 }),
    createDebt({ id: '2', name: 'Card B', balance: 3000, apr: 18, minPayment: 90 }),
  ];

  const comparison = runEngineComparison({
    debts,
    monthlySurplus: 150,
    windfall: {
      amount: 2000,
      type: 'one_time',
      targetDebtId: 'auto_optimal',
    },
    startDate: new Date('2026-10-01'),
  });

  assert.ok(comparison.windfallImpact);
  assert.ok(comparison.windfallImpact.interestSaved > 0, 'Windfall should save interest');
  assert.ok(comparison.windfallImpact.monthsSaved > 0, 'Windfall should save payoff months');
  assert.equal(comparison.windfallImpact.recommendedTargetDebtName, 'Card A', 'Auto optimal should target 24% APR card');
});

test('9. formatCurrencyValue - edge cases', () => {
  assert.equal(formatCurrencyValue(1234.56, '$', 2), '$1,234.56');
  assert.equal(formatCurrencyValue(-450, '$', 0), '-$450');
  assert.equal(formatCurrencyValue(0, '$', 0), '$0');
  assert.equal(formatCurrencyValue(NaN, '$', 0), '$0');
});

test('10. generateMonthChecklist - ordering & focus debt', () => {
  const debts: DebtItem[] = [
    createDebt({ id: '1', name: 'Card A', balance: 5000, apr: 24, minPayment: 150, dueDate: 25 }),
    createDebt({ id: '2', name: 'Card B', balance: 3000, apr: 18, minPayment: 90, dueDate: 5 }),
  ];

  const avalanche = simulatePayoffSchedule({
    debts,
    monthlySurplus: 200,
    strategy: 'avalanche',
  });

  const checklist = generateMonthChecklist(avalanche, debts);

  assert.equal(checklist.length, 2);
  // Should sort by dueDate: Card B (due 5th) before Card A (due 25th)
  assert.equal(checklist[0].debtName, 'Card B');
  assert.equal(checklist[1].debtName, 'Card A');
  // Card A has higher APR so it receives the extra payment
  assert.equal(checklist[1].isFocusDebt, true);
  assert.equal(checklist[1].extraPayment, 200);
});
