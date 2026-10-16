export const STORAGE_KEY = 'debtzero_userdata_v1';

/** A completed plan as DebtZero stores it, used to start component tests from a loaded dashboard. */
export const SAMPLE_PLAN = {
  onboardingComplete: true,
  profile: {
    name: 'Sam',
    currency: 'USD',
    payFrequency: 'bi-weekly',
    incomePerPeriod: 2600,
    monthlyNetIncome: 5633.33,
    livingExpenses: 3400,
    expensesBreakdown: {
      housing: 1650,
      utilities: 280,
      groceries: 650,
      transportation: 320,
      insurance: 220,
      subscriptions: 120,
      other: 160,
    },
  },
  debts: [
    { id: 'd1', name: 'Travel Card', category: 'credit_card', balance: 7850, apr: 28.49, minPayment: 215, dueDate: 12, customPriority: 1 },
    { id: 'd2', name: 'Cash Back Card', category: 'credit_card', balance: 4600, apr: 24.24, minPayment: 135, dueDate: 19, customPriority: 2 },
    { id: 'd3', name: 'Store Card', category: 'credit_card', balance: 2100, apr: 21.99, minPayment: 75, dueDate: 25, customPriority: 3 },
    { id: 'd4', name: 'Consolidation Loan', category: 'personal_loan', balance: 11500, apr: 12.5, minPayment: 310, dueDate: 5, customPriority: 4 },
  ],
  strategy: 'avalanche',
};

export function seedPlan(overrides: Record<string, unknown> = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...SAMPLE_PLAN, ...overrides }));
}

export function stored() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}
