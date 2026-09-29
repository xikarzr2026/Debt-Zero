export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'MXN';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  CAD: { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)', locale: 'en-CA' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'AUD (A$)', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', label: 'JPY (¥)', locale: 'ja-JP' },
  MXN: { code: 'MXN', symbol: 'MX$', label: 'MXN (MX$)', locale: 'es-MX' },
};

export type PayFrequency = 'monthly' | 'bi-weekly' | 'semi-monthly' | 'weekly';

export type DebtCategory =
  | 'credit_card'
  | 'personal_loan'
  | 'auto_loan'
  | 'student_loan'
  | 'mortgage'
  | 'medical'
  | 'other';

export interface DebtItem {
  id: string;
  name: string;
  category: DebtCategory;
  balance: number;
  apr: number;
  minPayment: number;
  dueDate: number; // 1 - 31
  customPriority: number; // 1 is highest priority
  notes?: string;
  color?: string;
}

export interface ExpensesBreakdown {
  housing: number;
  utilities: number;
  groceries: number;
  transportation: number;
  insurance: number;
  subscriptions: number;
  other: number;
}

export interface UserFinancialProfile {
  name: string;
  currency: CurrencyCode;
  payFrequency: PayFrequency;
  incomePerPeriod: number;
  monthlyNetIncome: number;
  livingExpenses: number;
  expensesBreakdown: ExpensesBreakdown;
  manualExtraMonthlySurplus?: number; // Optional user override for surplus
}

export type OptimizationStrategy = 'avalanche' | 'snowball' | 'custom' | 'minimums_only';

export interface WindfallSimulation {
  amount: number;
  type: 'one_time' | 'monthly_extra';
  targetDebtId?: string | 'auto_optimal'; // 'auto_optimal' picks top debt by current strategy
}

export interface MonthlyAmortizationPayment {
  debtId: string;
  debtName: string;
  category: DebtCategory;
  startBalance: number;
  interestCharged: number;
  principalPaid: number;
  minPayment: number;
  extraPayment: number;
  totalPayment: number;
  endBalance: number;
  isPaidOffThisMonth: boolean;
}

export interface MonthlyAmortizationSnapshot {
  monthIndex: number; // 1-indexed (Month 1, Month 2, ...)
  dateFormatted: string; // "Nov 2026"
  year: number;
  monthNumber: number; // 0-11
  totalStartingBalance: number;
  totalInterestCharged: number;
  totalPrincipalPaid: number;
  totalPayment: number;
  totalEndingBalance: number;
  payments: MonthlyAmortizationPayment[];
  remainingDebtsCount: number;
  paidOffDebtsThisMonth: string[]; // names
}

export interface DebtMilestone {
  debtId: string;
  debtName: string;
  category: DebtCategory;
  originalBalance: number;
  paidOffMonth: number;
  paidOffDate: string;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

export interface PayoffStrategyResult {
  strategy: OptimizationStrategy;
  title: string;
  description: string;
  totalMonths: number;
  debtFreeDate: string; // "May 2028"
  debtFreeDateObj: Date;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalAmountPaid: number;
  monthlySurplusUsed: number;
  schedule: MonthlyAmortizationSnapshot[];
  milestones: DebtMilestone[];
  negativeAmortizationDebts: Array<{
    debtId: string;
    debtName: string;
    interestAccruing: number;
    minPayment: number;
    deficit: number;
  }>;
}

export interface EngineComparison {
  baselineMinimums: PayoffStrategyResult;
  avalanche: PayoffStrategyResult;
  snowball: PayoffStrategyResult;
  custom?: PayoffStrategyResult;
  windfallAvalanche?: PayoffStrategyResult;
  windfallSnowball?: PayoffStrategyResult;
  
  // Delta metrics between Avalanche and Minimums
  avalancheInterestSaved: number;
  avalancheMonthsSaved: number;
  
  // Delta metrics between Snowball and Minimums
  snowballInterestSaved: number;
  snowballMonthsSaved: number;
  
  // Avalanche vs Snowball delta
  avalancheVsSnowballInterestSaved: number;
  
  // Windfall metrics
  windfallImpact?: {
    interestSaved: number;
    monthsSaved: number;
    recommendedTargetDebtName: string;
    recommendedTargetDebtId: string;
    newDebtFreeDate: string;
    originalDebtFreeDate: string;
  };
}

export interface MonthChecklistItem {
  debtId: string;
  debtName: string;
  amount: number;
  dueDate: number;
  isExtraTarget: boolean;
  completed: boolean;
}
