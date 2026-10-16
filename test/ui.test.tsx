import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DebtProvider, useDebt } from '@/context/DebtContext';
import { CashFlowModal } from '@/components/CashFlowModal';
import { MonthlyChecklist } from '@/components/MonthlyChecklist';
import { DebtInventory } from '@/components/DebtInventory';
import { STORAGE_KEY, seedPlan, stored } from './fixtures';

beforeEach(() => {
  localStorage.clear();
  seedPlan();
});
afterEach(cleanup);

describe('CashFlowModal', () => {
  // Mirrors page.tsx: the parent consumes the context and passes a fresh inline onClose each render
  function Harness() {
    useDebt();
    return <CashFlowModal isOpen onClose={() => {}} />;
  }

  it('keeps focus in the input while typing', () => {
    render(
      <DebtProvider>
        <Harness />
      </DebtProvider>
    );
    const housing = screen.getByLabelText(/Housing/) as HTMLInputElement;
    act(() => housing.focus());
    fireEvent.change(housing, { target: { value: '1' } });
    fireEvent.change(housing, { target: { value: '12' } });
    fireEvent.change(housing, { target: { value: '120' } });
    expect(document.activeElement).toBe(housing);
    expect(housing.value).toBe('120');
  });

  it('lets the user edit the "other" expense category', () => {
    render(
      <DebtProvider>
        <Harness />
      </DebtProvider>
    );
    const other = screen.getByLabelText(/Other Essentials/) as HTMLInputElement;
    expect(other.value).toBe('160');
    fireEvent.change(other, { target: { value: '0' } });
    expect(stored().profile.expensesBreakdown.other).toBe(0);
  });
});

describe('MonthlyChecklist', () => {
  const checklistButtons = () =>
    screen.getAllByRole('button').filter((b) => b.textContent?.includes('Send to Creditor'));
  const struckCount = () => document.querySelectorAll('span.line-through').length;

  it('keeps checkmarks after a reload', () => {
    const first = render(
      <DebtProvider>
        <MonthlyChecklist />
      </DebtProvider>
    );
    fireEvent.click(checklistButtons()[0]);
    expect(struckCount()).toBe(1);
    first.unmount();

    render(
      <DebtProvider>
        <MonthlyChecklist />
      </DebtProvider>
    );
    expect(struckCount()).toBe(1);
  });
});

describe('DebtInventory custom priority', () => {
  function Harness() {
    const { setStrategy } = useDebt();
    return (
      <>
        <button type="button" onClick={() => setStrategy('custom')}>
          use custom
        </button>
        <DebtInventory />
      </>
    );
  }

  const rowNames = () =>
    within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1, -1)
      .map((row) => row.querySelector('td span:nth-child(2)')?.textContent);

  it('reorders rows and keeps consecutive moves', () => {
    render(
      <DebtProvider>
        <Harness />
      </DebtProvider>
    );
    fireEvent.click(screen.getByText('use custom'));
    const before = rowNames();
    const last = before[before.length - 1]!;

    fireEvent.click(screen.getByLabelText(`Move ${last} up in priority`));
    fireEvent.click(screen.getByLabelText(`Move ${last} up in priority`));

    const after = rowNames();
    expect(after[1]).toBe(last);
    const priorities = Object.fromEntries(
      stored().debts.map((d: { name: string; customPriority: number }) => [d.name, d.customPriority])
    );
    expect(priorities[last]).toBe(2);
    expect(Object.values(priorities).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('stored data', () => {
  function Probe() {
    const { debts, isLoaded, onboardingComplete } = useDebt();
    return (
      <div data-testid="probe">
        {isLoaded ? `${onboardingComplete ? 'plan' : 'setup'}:${debts.map((d) => d.name).join('|')}` : 'loading'}
      </div>
    );
  }

  it('ignores corrupt localStorage instead of crashing', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ onboardingComplete: true, profile: { name: 'x' }, debts: 'nope', strategy: 42 })
    );
    render(
      <DebtProvider>
        <Probe />
      </DebtProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('setup:');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('sanitizes bad debt rows in localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        onboardingComplete: true,
        profile: { name: 'x', currency: 'USD' },
        debts: [{}, { id: 'ok', name: 'Good', balance: '500', apr: 10, minPayment: 25 }],
      })
    );
    render(
      <DebtProvider>
        <Probe />
      </DebtProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('plan:Good');
  });

  it.each([
    ['an untouched demo plan', { onboardingComplete: undefined, currentPresetId: 'high_interest_cards' }],
    ['an edited demo plan', { onboardingComplete: undefined, currentPresetId: null }],
  ])('discards data saved before v1.3 (%s) and starts setup', (_label, overrides) => {
    seedPlan(overrides);
    render(
      <DebtProvider>
        <Probe />
      </DebtProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('setup:');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
