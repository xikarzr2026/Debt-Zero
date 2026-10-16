'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  Home,
  CreditCard,
  Target,
  Plus,
  Trash2,
  ShieldCheck,
  FileJson,
  AlertTriangle,
} from 'lucide-react';
import { useDebt } from '@/context/DebtContext';
import { ModalShell } from './ModalShell';
import { DEBT_CATEGORY_LABELS } from '@/lib/categories';
import {
  calculateFreeCashFlow,
  calculateMonthlyInterest,
  currencyDecimals,
  normalizeToMonthlyIncome,
} from '@/lib/debtEngine';
import {
  CurrencyCode,
  DebtCategory,
  DebtItem,
  ExpensesBreakdown,
  OptimizationStrategy,
  PayFrequency,
  SUPPORTED_CURRENCIES,
  UserFinancialProfile,
} from '@/types/debt';

/**
 * First-run setup wizard.
 *
 * Step 0 offers a guided setup or an import of an exported .json backup. The guided flow collects
 * income, household expenses, debts and the payoff approach in four steps, then hands a complete
 * plan to `completeSetup`. Everything stays editable afterwards from the dashboard.
 */

type Step = 0 | 1 | 2 | 3 | 4;
type ExtraMode = 'cash_flow' | 'custom';

interface DebtForm {
  id: string;
  name: string;
  category: DebtCategory;
  balance: string;
  apr: string;
  minPayment: string;
  dueDate: string;
  notes?: string;
}

interface WizardForm {
  name: string;
  currency: CurrencyCode;
  payFrequency: PayFrequency;
  incomePerPeriod: string;
  expenses: Record<keyof ExpensesBreakdown, string>;
  debts: DebtForm[];
  strategy: Exclude<OptimizationStrategy, 'minimums_only'>;
  extraMode: ExtraMode;
  extraAmount: string;
}

const MAX_IMPORT_BYTES = 1_000_000;

const PAY_FREQUENCIES: { id: PayFrequency; label: string; hint: string }[] = [
  { id: 'monthly', label: 'Monthly', hint: '12 paychecks a year' },
  { id: 'semi-monthly', label: 'Twice a month', hint: '24 paychecks a year' },
  { id: 'bi-weekly', label: 'Every two weeks', hint: '26 paychecks a year' },
  { id: 'weekly', label: 'Weekly', hint: '52 paychecks a year' },
];

const EXPENSE_FIELDS: { key: keyof ExpensesBreakdown; label: string; hint?: string }[] = [
  { key: 'housing', label: 'Housing', hint: 'Rent, or the mortgage if you are not adding it as a debt' },
  { key: 'utilities', label: 'Utilities', hint: 'Power, water, heat, internet' },
  { key: 'groceries', label: 'Groceries & food' },
  { key: 'transportation', label: 'Transportation', hint: 'Gas, transit, parking (not car loans)' },
  { key: 'insurance', label: 'Insurance', hint: 'Health, auto, home, life' },
  { key: 'subscriptions', label: 'Phone & subscriptions' },
  { key: 'other', label: 'Other essentials', hint: 'Childcare, medical, pets' },
];

const STRATEGIES: { id: WizardForm['strategy']; label: string; blurb: string }[] = [
  { id: 'avalanche', label: 'Avalanche', blurb: 'Highest interest rate first. Pays the least interest overall.' },
  { id: 'snowball', label: 'Snowball', blurb: 'Smallest balance first. Quick wins keep you motivated.' },
  { id: 'custom', label: 'My own order', blurb: 'Pay debts in the order you listed them. Reorder later on the Debts tab.' },
];

const STEPS: { title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { title: 'You & Income', icon: Wallet },
  { title: 'Expenses', icon: Home },
  { title: 'Debts', icon: CreditCard },
  { title: 'Payoff Plan', icon: Target },
];

// ---------------------------------------------------------------------------------------------
// Number parsing
// ---------------------------------------------------------------------------------------------

/**
 * Parses a typed amount. Accepts "1,234.50" (comma thousands) and "12,5" (comma decimal);
 * currency symbols and spaces are ignored. Returns NaN for anything else.
 */
export function parseAmount(raw: string): number {
  let s = String(raw).trim().replace(/[\s$€£¥%]|CA|MX|A(?=\$)/g, '');
  if (s === '') return NaN;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

const amount = (raw: string): number => {
  const n = parseAmount(raw);
  return Number.isNaN(n) || n < 0 ? 0 : n;
};

const str = (n: number | undefined): string =>
  n === undefined || !Number.isFinite(n) || n === 0 ? '' : String(Math.round(n * 100) / 100);

let idCounter = 0;
const newDebtId = () => `debt-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const blankDebt = (): DebtForm => ({
  id: newDebtId(),
  name: '',
  category: 'credit_card',
  balance: '',
  apr: '',
  minPayment: '',
  dueDate: '',
});

function formFromPlan(
  profile: UserFinancialProfile,
  debts: DebtItem[],
  strategy: OptimizationStrategy,
  prefill: boolean
): WizardForm {
  const emptyExpenses = Object.fromEntries(EXPENSE_FIELDS.map((f) => [f.key, ''])) as WizardForm['expenses'];
  if (!prefill) {
    return {
      name: '',
      currency: 'USD',
      payFrequency: 'monthly',
      incomePerPeriod: '',
      expenses: emptyExpenses,
      debts: [blankDebt()],
      strategy: 'avalanche',
      extraMode: 'cash_flow',
      extraAmount: '',
    };
  }
  const ordered = [...debts].sort((a, b) => (a.customPriority ?? 999) - (b.customPriority ?? 999));
  return {
    name: profile.name,
    currency: profile.currency,
    payFrequency: profile.payFrequency,
    incomePerPeriod: str(profile.incomePerPeriod),
    expenses: Object.fromEntries(
      EXPENSE_FIELDS.map((f) => [f.key, str(profile.expensesBreakdown?.[f.key])])
    ) as WizardForm['expenses'],
    debts: ordered.length
      ? ordered.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          balance: str(d.balance),
          apr: String(d.apr),
          minPayment: String(d.minPayment),
          dueDate: d.dueDate ? String(d.dueDate) : '',
          notes: d.notes,
        }))
      : [blankDebt()],
    strategy: strategy === 'minimums_only' ? 'avalanche' : strategy,
    extraMode: profile.manualExtraMonthlySurplus != null ? 'custom' : 'cash_flow',
    extraAmount: str(profile.manualExtraMonthlySurplus),
  };
}

/** Debts as the engine will see them. Blank rows are dropped. */
function debtsFromForm(f: WizardForm): DebtItem[] {
  return f.debts
    .filter((d) => d.name.trim() || d.balance.trim())
    .map((d, i) => {
      const due = Math.round(amount(d.dueDate));
      return {
        id: d.id,
        name: d.name.trim().slice(0, 120),
        category: d.category,
        balance: amount(d.balance),
        apr: amount(d.apr),
        minPayment: amount(d.minPayment),
        dueDate: due >= 1 && due <= 31 ? due : 15,
        customPriority: i + 1,
        notes: d.notes,
        color: DEBT_CATEGORY_LABELS[d.category].defaultColor,
      };
    });
}

function profileFromForm(f: WizardForm): UserFinancialProfile {
  const expensesBreakdown = Object.fromEntries(
    EXPENSE_FIELDS.map((field) => [field.key, amount(f.expenses[field.key])])
  ) as unknown as ExpensesBreakdown;
  const incomePerPeriod = amount(f.incomePerPeriod);
  return {
    name: f.name.trim().slice(0, 80),
    currency: f.currency,
    payFrequency: f.payFrequency,
    incomePerPeriod,
    monthlyNetIncome: normalizeToMonthlyIncome(incomePerPeriod, f.payFrequency),
    livingExpenses: Object.values(expensesBreakdown).reduce((s, v) => s + v, 0),
    expensesBreakdown,
    ...(f.extraMode === 'custom' ? { manualExtraMonthlySurplus: amount(f.extraAmount) } : {}),
  };
}

// ---------------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------------

type Errors = Record<string, string>;

const isBadAmount = (v: string) => v.trim() !== '' && (Number.isNaN(parseAmount(v)) || parseAmount(v) < 0);

function validate(step: Step, f: WizardForm): Errors {
  const e: Errors = {};
  if (step === 1) {
    const income = parseAmount(f.incomePerPeriod);
    if (Number.isNaN(income) || income <= 0) e.incomePerPeriod = 'Enter your take-home pay per paycheck.';
  }
  if (step === 2) {
    for (const { key } of EXPENSE_FIELDS) {
      if (isBadAmount(f.expenses[key])) e[`expense.${key}`] = 'Enter a positive number.';
    }
  }
  if (step === 3) {
    const filled = f.debts.filter((d) => d.name.trim() || d.balance.trim() || d.apr.trim() || d.minPayment.trim());
    if (filled.length === 0) e.debts = 'Add at least one debt to build a payoff plan.';
    f.debts.forEach((d, i) => {
      if (!(d.name.trim() || d.balance.trim() || d.apr.trim() || d.minPayment.trim())) return;
      if (!d.name.trim()) e[`debt${i}.name`] = 'Name it';
      const balance = parseAmount(d.balance);
      if (Number.isNaN(balance) || balance <= 0) e[`debt${i}.balance`] = 'Enter the balance';
      else if (balance > 1_000_000_000) e[`debt${i}.balance`] = 'Too large';
      const apr = parseAmount(d.apr);
      if (Number.isNaN(apr) || apr < 0 || apr > 100) e[`debt${i}.apr`] = '0 to 100%';
      const min = parseAmount(d.minPayment);
      if (Number.isNaN(min) || min < 0) e[`debt${i}.minPayment`] = 'Enter the minimum';
      if (d.dueDate.trim()) {
        const due = parseAmount(d.dueDate);
        if (Number.isNaN(due) || due < 1 || due > 31 || !Number.isInteger(due)) e[`debt${i}.dueDate`] = '1 to 31';
      }
    });
  }
  if (step === 4 && f.extraMode === 'custom') {
    const extra = parseAmount(f.extraAmount);
    if (Number.isNaN(extra) || extra < 0) e.extraAmount = 'Enter an amount (0 or more).';
  }
  return e;
}

// ---------------------------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------------------------

const inputClass = (error?: string) =>
  `w-full px-3 py-2 rounded-lg border text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 ${
    error ? 'border-rose-400 focus:border-rose-500' : 'border-amber-200 focus:border-emerald-600'
  }`;

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  type?: 'number' | 'text';
  autoFocus?: boolean;
  compact?: boolean;
}> = ({ label, value, onChange, error, prefix, suffix, hint, placeholder, type = 'number', autoFocus, compact }) => {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className={`block font-bold text-slate-800 mb-1 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={type === 'number' ? 'decimal' : undefined}
          autoComplete="off"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={inputClass(error)}
          style={{
            ...(prefix ? { paddingLeft: `${0.9 + prefix.length * 0.55}rem` } : {}),
            ...(suffix ? { paddingRight: `${0.9 + suffix.length * 0.45}rem` } : {}),
          }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mb-2">{children}</h4>
);

// ---------------------------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------------------------

interface SetupWizardProps {
  /** True when re-running setup over an existing plan: fields start from the current plan. */
  prefill: boolean;
  onClose: () => void;
  /** Called after a plan has been built or imported. */
  onDone: (message: string) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ prefill, onClose, onDone }) => {
  const { profile, debts, strategy, completeSetup, importDataJSON } = useDebt();

  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<WizardForm>(() => formFromPlan(profile, debts, strategy, prefill));
  const [showErrors, setShowErrors] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  const errors = useMemo(() => validate(step, form), [step, form]);
  const visibleErrors = showErrors ? errors : {};
  const currency = SUPPORTED_CURRENCIES[form.currency];
  const symbol = currency.symbol;
  const decimals = currencyDecimals(form.currency);
  const money = (n: number) =>
    `${n < 0 ? '-' : ''}${symbol}${Math.abs(n).toLocaleString(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })}`;

  const set = (patch: Partial<WizardForm>) => {
    touched.current = true;
    setForm((f) => ({ ...f, ...patch }));
  };
  const setExpense = (key: keyof ExpensesBreakdown, value: string) =>
    set({ expenses: { ...form.expenses, [key]: value } });
  const setDebt = (index: number, patch: Partial<DebtForm>) =>
    set({ debts: form.debts.map((d, i) => (i === index ? { ...d, ...patch } : d)) });

  const requestClose = () => {
    if (step > 0 && touched.current && !window.confirm('Close setup? The details you entered will be discarded.')) return;
    onClose();
  };

  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 });
  }, [step]);

  // Live numbers for the summary and hints
  const monthlyIncome = normalizeToMonthlyIncome(amount(form.incomePerPeriod), form.payFrequency);
  const expensesTotal = EXPENSE_FIELDS.reduce((s, f) => s + amount(form.expenses[f.key]), 0);
  const plannedDebts = debtsFromForm(form);
  const cashFlow = calculateFreeCashFlow(monthlyIncome, expensesTotal, plannedDebts);

  const goNext = () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step === 4) {
      if (prefill && !window.confirm('Replace your current plan with these details? Checklist progress and any windfall simulation will reset.')) {
        return;
      }
      completeSetup({ profile: profileFromForm(form), debts: plannedDebts, strategy: form.strategy });
      onDone('Your payoff plan is ready');
      return;
    }
    setStep((step + 1) as Step);
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((step - 1) as Step);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError('That file is too large to be a DebtZero backup (limit 1 MB).');
      return;
    }
    if (prefill && !window.confirm(`Replace your current plan with "${file.name}"?`)) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = importDataJSON(text);
      if (res.success) onDone(`Loaded plan from ${file.name}`);
      else setImportError(res.error || 'That file could not be read as a DebtZero backup.');
    } catch {
      setImportError('That file could not be read.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={requestClose}
      title={prefill ? 'Set up or load a plan' : 'Welcome to DebtZero'}
      bare
      panelClassName="sm:max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden"
    >
      {/* Header with progress */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-amber-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {step === 0 ? (prefill ? 'Set up or load a plan' : 'Welcome to DebtZero') : STEPS[step - 1].title}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {step === 0
                ? 'Build your payoff plan in four short steps, or load a backup you exported earlier.'
                : `Step ${step} of ${STEPS.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100"
            aria-label="Close setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step > 0 && (
          <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Setup progress">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              const Icon = s.icon;
              return (
                <li key={s.title} aria-current={current ? 'step' : undefined}>
                  <div className={`h-1.5 rounded-full ${done || current ? 'bg-emerald-600' : 'bg-amber-100'}`} />
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold ${
                      current ? 'text-emerald-800' : done ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.title}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="group text-left p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-900">{prefill ? 'Edit plan with guided setup' : 'Start guided setup'}</p>
              <p className="text-xs text-slate-600 mt-1">
                Enter your income, monthly expenses and debts, then pick how to pay them down. Takes about 3 minutes.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`p-5 rounded-2xl border-2 border-dashed transition ${
                dragOver ? 'border-sky-500 bg-sky-50' : 'border-amber-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                <FileJson className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-900">Import a backup (.json)</p>
              <p className="text-xs text-slate-600 mt-1">
                Load a plan you saved with “Save plan to file”. Drop the file here or choose it.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                data-testid="setup-import-input"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:border-sky-400 hover:bg-sky-50 text-xs font-bold text-slate-800 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                {importing ? 'Loading…' : 'Choose file'}
              </button>
              {importError && (
                <p role="alert" className="mt-3 text-[11px] font-semibold text-rose-700">
                  {importError}
                </p>
              )}
            </div>

            <p className="sm:col-span-2 flex items-start gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-px" />
              Everything stays in this browser. Nothing is uploaded to a server, and you can erase it any time from
              Settings → Clear all data.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="First name"
                type="text"
                value={form.name}
                onChange={(v) => set({ name: v })}
                placeholder="Optional"
                autoFocus
              />
              <div>
                <label htmlFor="setup-currency" className="block text-xs font-bold text-slate-800 mb-1">
                  Currency
                </label>
                <select
                  id="setup-currency"
                  value={form.currency}
                  onChange={(e) => set({ currency: e.target.value as CurrencyCode })}
                  className={inputClass()}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="pt-5 border-t border-amber-200 space-y-3">
              <SectionTitle>How often are you paid?</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Pay frequency">
                {PAY_FREQUENCIES.map((p) => {
                  const selected = form.payFrequency === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set({ payFrequency: p.id })}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selected
                          ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950'
                          : 'border-amber-200 bg-white hover:bg-amber-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">{p.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{p.hint}</span>
                    </button>
                  );
                })}
              </div>
              <div className="max-w-xs">
                <Field
                  label="Take-home pay per paycheck"
                  prefix={symbol}
                  value={form.incomePerPeriod}
                  onChange={(v) => set({ incomePerPeriod: v })}
                  error={visibleErrors.incomePerPeriod}
                  hint={
                    monthlyIncome > 0
                      ? `About ${money(monthlyIncome)} a month after tax.`
                      : 'After tax and deductions. Add a partner’s pay if you share bills.'
                  }
                />
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Your regular monthly costs, <strong>not including debt payments</strong> (you’ll add those next). Leave
              anything that doesn’t apply blank.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPENSE_FIELDS.map((f, i) => (
                <Field
                  key={f.key}
                  label={f.label}
                  prefix={symbol}
                  suffix="/mo"
                  value={form.expenses[f.key]}
                  onChange={(v) => setExpense(f.key, v)}
                  error={visibleErrors[`expense.${f.key}`]}
                  hint={f.hint}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-sm">
              <span className="font-semibold text-slate-700">Total monthly expenses</span>
              <span className="font-black text-slate-900">{money(expensesTotal)}</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Add each card, loan or balance you want to pay off. Your statement shows the balance, interest rate (APR) and
              minimum payment.
            </p>
            {visibleErrors.debts && (
              <p role="alert" className="text-xs font-semibold text-rose-700">
                {visibleErrors.debts}
              </p>
            )}
            <ul className="space-y-3">
              {form.debts.map((d, i) => {
                const err = (k: string) => visibleErrors[`debt${i}.${k}`];
                const balance = amount(d.balance);
                const interest = calculateMonthlyInterest(balance, amount(d.apr), decimals);
                const min = parseAmount(d.minPayment);
                const trap = balance > 0 && interest > 0 && !Number.isNaN(min) && min <= interest;
                return (
                  <li key={d.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field
                          label="Name"
                          type="text"
                          compact
                          value={d.name}
                          onChange={(v) => setDebt(i, { name: v })}
                          error={err('name')}
                          placeholder="e.g. Visa, Car loan"
                          autoFocus={i === form.debts.length - 1 && i > 0}
                        />
                        <div>
                          <label htmlFor={`setup-debt-type-${d.id}`} className="block text-[11px] font-bold text-slate-800 mb-1">
                            Type
                          </label>
                          <select
                            id={`setup-debt-type-${d.id}`}
                            value={d.category}
                            onChange={(e) => setDebt(i, { category: e.target.value as DebtCategory })}
                            className={inputClass()}
                          >
                            {(Object.keys(DEBT_CATEGORY_LABELS) as DebtCategory[]).map((c) => (
                              <option key={c} value={c}>
                                {DEBT_CATEGORY_LABELS[c].label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {form.debts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => set({ debts: form.debts.filter((_, j) => j !== i) })}
                          className="mb-0.5 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          aria-label={`Remove ${d.name || `debt ${i + 1}`}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Field
                        label="Balance"
                        compact
                        prefix={symbol}
                        value={d.balance}
                        onChange={(v) => setDebt(i, { balance: v })}
                        error={err('balance')}
                      />
                      <Field
                        label="Interest rate"
                        compact
                        suffix="% APR"
                        value={d.apr}
                        onChange={(v) => setDebt(i, { apr: v })}
                        error={err('apr')}
                        placeholder={String(DEBT_CATEGORY_LABELS[d.category].typicalApr)}
                      />
                      <Field
                        label="Minimum payment"
                        compact
                        prefix={symbol}
                        suffix="/mo"
                        value={d.minPayment}
                        onChange={(v) => setDebt(i, { minPayment: v })}
                        error={err('minPayment')}
                      />
                      <Field
                        label="Due day"
                        compact
                        value={d.dueDate}
                        onChange={(v) => setDebt(i, { dueDate: v })}
                        error={err('dueDate')}
                        placeholder="15"
                      />
                    </div>
                    {trap && (
                      <p className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                        This minimum doesn’t cover the {money(interest)} of monthly interest, so the balance would grow on
                        minimums alone.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => set({ debts: [...form.debts, blankDebt()] })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-emerald-600 text-emerald-800 text-xs font-bold hover:bg-emerald-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add another debt
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <section>
              <SectionTitle>Your monthly cash flow</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Take-home pay', value: money(cashFlow.monthlyIncome), tone: 'text-emerald-800' },
                  { label: 'Expenses', value: `-${money(cashFlow.livingExpenses)}`, tone: 'text-slate-800' },
                  { label: 'Debt minimums', value: `-${money(cashFlow.totalMinimumDebtPayments)}`, tone: 'text-slate-800' },
                  {
                    label: 'Left over',
                    value: money(cashFlow.freeCashFlow),
                    tone: cashFlow.isDeficit ? 'text-rose-700' : 'text-emerald-800',
                  },
                ].map((c) => (
                  <div key={c.label} className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">{c.label}</div>
                    <div className={`text-sm font-black ${c.tone}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              {cashFlow.isDeficit && (
                <p className="mt-2 text-[11px] font-semibold text-rose-700">
                  Your expenses and minimums are more than your take-home pay. The plan will use minimum payments only
                  unless you set an extra amount below.
                </p>
              )}
            </section>

            <section className="pt-5 border-t border-amber-200 space-y-3">
              <SectionTitle>Extra toward debt each month</SectionTitle>
              <div className="space-y-2" role="radiogroup" aria-label="Extra monthly payment">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="extra-mode"
                    checked={form.extraMode === 'cash_flow'}
                    onChange={() => set({ extraMode: 'cash_flow' })}
                    className="mt-0.5 w-4 h-4 accent-emerald-700"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Everything left over ({money(Math.max(0, cashFlow.freeCashFlow))}/mo)
                    </span>
                    <span className="block text-[11px] text-slate-500">Updates automatically when your budget changes.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="extra-mode"
                    checked={form.extraMode === 'custom'}
                    onChange={() => set({ extraMode: 'custom' })}
                    className="mt-0.5 w-4 h-4 accent-emerald-700"
                  />
                  <span className="block text-sm font-semibold text-slate-800">A set amount I choose</span>
                </label>
                {form.extraMode === 'custom' && (
                  <div className="pl-7 max-w-xs">
                    <Field
                      label="Extra payment"
                      prefix={symbol}
                      suffix="/mo"
                      value={form.extraAmount}
                      onChange={(v) => set({ extraAmount: v })}
                      error={visibleErrors.extraAmount}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="pt-5 border-t border-amber-200">
              <SectionTitle>Which debt gets the extra first?</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Payoff strategy">
                {STRATEGIES.map((s) => {
                  const selected = form.strategy === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set({ strategy: s.id })}
                      className={`p-3 rounded-xl border text-left transition ${
                        selected
                          ? 'border-2 border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/15'
                          : 'border-amber-200 bg-white hover:bg-amber-50'
                      }`}
                    >
                      <span className="block text-sm font-bold text-slate-900">{s.label}</span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">{s.blurb}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                You can switch strategies, add debts and fine-tune your budget at any time from the dashboard.
              </p>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      {step > 0 && (
        <div className="px-5 sm:px-6 py-4 border-t border-amber-200 bg-amber-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-amber-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            {showErrors && Object.keys(errors).length > 0 && (
              <span className="hidden sm:inline text-[11px] text-rose-600 font-semibold">
                Fix the highlighted fields to continue.
              </span>
            )}
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              {step === 4 ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Build my plan
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
};
