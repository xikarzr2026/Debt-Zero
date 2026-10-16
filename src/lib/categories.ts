import type { DebtCategory } from '@/types/debt';

export const DEBT_CATEGORY_LABELS: Record<
  DebtCategory,
  { label: string; icon: string; defaultColor: string; typicalApr: number }
> = {
  credit_card: {
    label: 'Credit Card (Revolving)',
    icon: 'CreditCard',
    defaultColor: '#f43f5e',
    typicalApr: 24.99,
  },
  personal_loan: {
    label: 'Personal / Consolidation Loan',
    icon: 'Landmark',
    defaultColor: '#fb923c',
    typicalApr: 11.5,
  },
  auto_loan: {
    label: 'Auto Loan',
    icon: 'Car',
    defaultColor: '#38bdf8',
    typicalApr: 6.99,
  },
  student_loan: {
    label: 'Student Loan',
    icon: 'GraduationCap',
    defaultColor: '#818cf8',
    typicalApr: 5.8,
  },
  mortgage: {
    label: 'Mortgage / Real Estate',
    icon: 'Home',
    defaultColor: '#34d399',
    typicalApr: 6.75,
  },
  medical: {
    label: 'Medical Debt',
    icon: 'HeartPulse',
    defaultColor: '#f472b6',
    typicalApr: 18.0,
  },
  other: {
    label: 'Other Liability',
    icon: 'Coins',
    defaultColor: '#94a3b8',
    typicalApr: 10.0,
  },
};
