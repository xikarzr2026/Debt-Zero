import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DebtProvider } from '@/context/DebtContext';
import HomePage from '@/app/page';
import { parseAmount } from '@/components/SetupWizard';
import { SAMPLE_PLAN, STORAGE_KEY, seedPlan, stored } from './fixtures';

function renderApp() {
  return render(
    <DebtProvider>
      <HomePage />
    </DebtProvider>
  );
}

const dialog = () => screen.getByRole('dialog');
const next = () => fireEvent.click(within(dialog()).getByRole('button', { name: /^Next/ }));
const type = (label: RegExp | string, value: string, index = 0) =>
  fireEvent.change(within(dialog()).getAllByLabelText(label)[index], { target: { value } });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('first run', () => {
  it('opens setup and shows no plan data until one exists', () => {
    renderApp();
    expect(within(dialog()).getByRole('heading', { level: 3, name: 'Welcome to DebtZero' })).toBeTruthy();
    expect(screen.getByText('No plan loaded yet')).toBeTruthy();
    expect(screen.queryByText(/Total Debt Owed/i)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('closing setup leaves the empty state, and its button reopens setup', () => {
    renderApp();
    fireEvent.click(within(dialog()).getByLabelText('Close setup'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Start Setup \/ Load Plan/ }));
    expect(within(dialog()).getByText('Start guided setup')).toBeTruthy();
  });
});

describe('guided setup', () => {
  it('validates each step and builds a saved plan', () => {
    renderApp();
    fireEvent.click(within(dialog()).getByText('Start guided setup'));

    // Step 1: income is required
    next();
    expect(within(dialog()).getByText('Enter your take-home pay per paycheck.')).toBeTruthy();
    type('First name', 'Robin');
    fireEvent.click(within(dialog()).getByRole('radio', { name: /Every two weeks/ }));
    type('Take-home pay per paycheck', '2,000');
    expect(within(dialog()).getByText(/About \$4,333\.33 a month/)).toBeTruthy();
    next();

    // Step 2: expenses are optional but must be numbers
    type('Housing', 'abc');
    next();
    expect(within(dialog()).getByText('Enter a positive number.')).toBeTruthy();
    type('Housing', '1500');
    type('Groceries & food', '400');
    next();

    // Step 3: at least one complete debt
    next();
    expect(within(dialog()).getByText('Add at least one debt to build a payoff plan.')).toBeTruthy();
    type('Name', 'Visa');
    type('Balance', '5000');
    type('Interest rate', '22.9');
    type('Minimum payment', '150');
    fireEvent.click(within(dialog()).getByRole('button', { name: /Add another debt/ }));
    type('Name', 'Car loan', 1);
    type('Balance', '12000', 1);
    type('Interest rate', '6.5', 1);
    type('Minimum payment', '320', 1);
    type('Due day', '40', 1);
    next();
    expect(within(dialog()).getByText('1 to 31')).toBeTruthy();
    type('Due day', '3', 1);
    next();

    // Step 4: cash flow summary and strategy
    // 4333.33 - 1900 - 470 = 1963.33 left over
    expect(within(dialog()).getByText(/Everything left over \(\$1,963\.33\/mo\)/)).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole('radio', { name: /Snowball/ }));
    fireEvent.click(within(dialog()).getByRole('button', { name: /Build my plan/ }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: "Robin's debt-free plan" })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Your payoff plan is ready');

    const saved = stored();
    expect(saved.onboardingComplete).toBe(true);
    expect(saved.strategy).toBe('snowball');
    expect(saved.profile.payFrequency).toBe('bi-weekly');
    expect(saved.profile.incomePerPeriod).toBe(2000);
    expect(saved.profile.livingExpenses).toBe(1900);
    expect(saved.profile.manualExtraMonthlySurplus).toBeUndefined();
    expect(saved.debts.map((d: { name: string; dueDate: number; customPriority: number }) => [d.name, d.dueDate, d.customPriority])).toEqual([
      ['Visa', 15, 1],
      ['Car loan', 3, 2],
    ]);
  });

  it('re-running setup from Settings starts from the current plan', () => {
    seedPlan();
    renderApp();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Settings/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Guided setup/ }));
    fireEvent.click(within(dialog()).getByText('Edit plan with guided setup'));
    expect((within(dialog()).getByLabelText('First name') as HTMLInputElement).value).toBe('Sam');
    expect((within(dialog()).getByLabelText('Take-home pay per paycheck') as HTMLInputElement).value).toBe('2600');
  });
});

describe('importing a backup', () => {
  it('loads a .json file from the setup screen', async () => {
    renderApp();
    const file = new File([JSON.stringify({ ...SAMPLE_PLAN, onboardingComplete: undefined })], 'my-plan.json', {
      type: 'application/json',
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('setup-import-input'), { target: { files: [file] } });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: "Sam's debt-free plan" })).toBeTruthy();
    expect(stored().debts).toHaveLength(4);
  });

  it('shows an error for a file that is not a backup', async () => {
    renderApp();
    const file = new File(['{"hello": 1}'], 'other.json', { type: 'application/json' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('setup-import-input'), { target: { files: [file] } });
    });
    expect(within(dialog()).getByRole('alert').textContent).toMatch(/Missing profile or debts/);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('Clear all data', () => {
  it('erases storage and returns to setup', () => {
    seedPlan();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Settings/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Clear all data/ }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(within(dialog()).getByRole('heading', { level: 3, name: 'Welcome to DebtZero' })).toBeTruthy();
    expect(screen.getByText('No plan loaded yet')).toBeTruthy();
  });
});

describe('parseAmount', () => {
  it('accepts common ways of typing numbers', () => {
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('$ 2,600')).toBe(2600);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('22.9%')).toBe(22.9);
    expect(parseAmount('CA$300')).toBe(300);
    expect(Number.isNaN(parseAmount('abc'))).toBe(true);
    expect(Number.isNaN(parseAmount('1.2.3'))).toBe(true);
    expect(Number.isNaN(parseAmount(''))).toBe(true);
  });
});
