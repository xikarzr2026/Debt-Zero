# 🏛️ DebtZero Architecture & Mathematical Specification

**Version:** 1.3.0  
**License:** MIT  
**Platform:** Next.js 16 (Turbopack, Static Export, React Compiler), React 19, TypeScript 5, Node.js >= 22.6

---

## 1. High-Level System Overview

DebtZero is a client-first, privacy-first web application designed to compute accelerated debt payoff schedules, compare optimization algorithms, detect negative amortization traps, and track monthly execution.

### First-Run Flow
1. With no saved plan, the page shows a "No plan loaded yet" empty state and opens `SetupWizard` automatically. No sample or demo figures are ever rendered.
2. Step 0 offers **guided setup** or **import a backup** (`.json`, max 1 MB, validated by `parseDebtBackup`).
3. Guided setup has four validated steps: income (currency, pay frequency, take-home pay), monthly expenses (7 categories), debts (at least one), and the payoff plan (extra monthly payment = all free cash flow or a fixed amount; Avalanche, Snowball or the listed order). It calls `completeSetup()` in `DebtContext`.
4. `onboardingComplete` gates the dashboard and persistence: `localStorage` is only written once it is true, and it is saved with the plan. **Clear all data** removes storage, resets it to false and reopens setup.
5. Migration: data saved before v1.3 has no flag. It is kept only if the user had edited it (v1.2 set `currentPresetId` to `null` on any edit); an untouched demo preset is discarded.

The header has a single **Settings** menu: guided setup, income & budget, load/save plan file, currency, help, and clear all data. The dashboard shows a plan headline, four KPI cards and four tabs (Payoff Plan, Debts, Windfall, Schedule).

### Architectural Tenets
1. **Local-First & Zero-Knowledge**: No user data is sent over the network. All state resides in React Context and persists to the user's browser `localStorage` (`debtzero_userdata_v1`). Data read back from storage is validated with the same `parseDebtBackup` sanitiser used for imports.
2. **Mathematical Precision**: Amortization follows standard monthly compounding banking rules, maintaining strict accounting invariants:
   $$\text{Ending Balance}_m = \text{Starting Balance}_m + \text{Interest Charged}_m - \text{Total Payments}_m$$
3. **Stateless Financial Engine**: All simulation and sorting functions in `src/lib/debtEngine.ts` are pure functions, completely decoupled from React state and side-effects.

---

## 2. Core Mathematical Specifications

### 2.1 Monthly Compounding Interest
Monthly interest is calculated on the beginning-of-month principal balance:
$$\text{Monthly Interest} = \text{Round}_2\left(\text{Balance} \times \frac{\text{APR}}{100 \times 12}\right)$$
- If balance $\le 0$ or $\text{APR} \le 0$, interest is strictly $\$0.00$.
- Cents are rounded half-up (ties away from zero) with decimal arithmetic, not `Number.toFixed`. JPY uses 0 decimal places.

### 2.2 Income Normalization
Users can enter income in arbitrary pay frequencies, normalized to a standard monthly baseline:
- **Weekly**: $\text{Monthly} = \text{Round}_2\left(\frac{\text{Amount} \times 52}{12}\right)$
- **Bi-Weekly**: $\text{Monthly} = \text{Round}_2\left(\frac{\text{Amount} \times 26}{12}\right)$
- **Semi-Monthly**: $\text{Monthly} = \text{Round}_2(\text{Amount} \times 2)$
- **Monthly**: $\text{Monthly} = \text{Round}_2(\text{Amount})$

### 2.3 Free Cash Flow (FCF) & Debt-to-Income (DTI)
$$\text{Total Minimums} = \sum_{\text{active debts}} \text{minPayment}$$
$$\text{Free Cash Flow} = \text{Monthly Income} - \text{Living Expenses} - \text{Total Minimums}$$
$$\text{DTI Ratio} = \left(\frac{\text{Total Minimums}}{\text{Monthly Income}}\right) \times 100$$
*Note: Accounts with $\$0.00$ balance are excluded from minimum payment summation.*

### 2.4 Negative Amortization Detection
If contractual minimum payment $\le$ monthly accrued interest, the debt balance will never decrease. The system raises an alert and calculates a recommended safe minimum:
$$\text{Deficit} = \text{Monthly Interest} - \text{minPayment}$$
$$\text{Recommended Min} = \text{Monthly Interest} + \max(\text{Floor}, \text{Balance} \times 0.015)$$

The floor is in the profile currency's own units (25 for USD/CAD/EUR/GBP/AUD, 500 for MXN, 2,500 for JPY), and amounts round to that currency's decimals.

---

## 3. Repayment Strategies

### 3.1 Debt Avalanche (Mathematically Optimal)
Prioritizes debts with the highest Annual Percentage Rate (APR).
- **Primary Sort**: APR descending (`b.apr - a.apr`).
- **Tie-Breaker**: Lowest current remaining balance (`a.currentBalance - b.currentBalance`).
- **Mathematical Property**: Directing all extra cash to the highest rate minimizes interest for a fixed monthly budget. The test suite checks this against Snowball on sample portfolios; it is not a formal proof.

### 3.2 Debt Snowball (Behavioral Momentum)
Prioritizes debts with the smallest current remaining balance.
- **Primary Sort**: Current remaining balance ascending (`a.currentBalance - b.currentBalance`).
- **Tie-Breaker**: Highest APR (`b.apr - a.apr`).
- **Mathematical Property**: Maximizes payoff velocity of individual debt accounts early on, freeing up baseline cash flow and building behavioral adherence.

### 3.3 Custom Priority
Allows users to assign manual priority rankings ($1, 2, 3, \dots$) to match personal, familial, or psychological goals. The Debts Inventory lists debts in this order and renumbers them consecutively whenever a debt is moved. New and duplicated debts go to the end of the list.

### 3.4 Minimums-Only Baseline
Simulates paying only contractual minimum payments without applying discretionary surplus. Serves as the quantitative benchmark to measure interest and time saved.

Savings figures (`planSavings`) are only reported when both the baseline and the compared plan pay off within the 600-month cap. If minimums never clear the debt, the baseline totals are a 50-year truncation rather than a real cost, so the UI states that minimums never pay off instead of quoting a dollar amount. Minimum payments are modelled as fixed amounts; real card minimums usually fall as the balance falls.

---

## 4. The Exponential Rollover Multiplier

When an active debt reaches a balance of $\$0.00$:
1. Its contractual minimum payment is retired from that specific account.
2. Rather than being re-absorbed into living expenses, that minimum payment amount is added to `rolledOverMinPayments`.
3. In subsequent months, the total extra surplus pool is expanded:
   $$\text{Available Extra} = \text{Discretionary Surplus} + \text{Rolled-Over Minimums}$$
4. In the payoff month itself, any part of the minimum not needed to clear the balance joins that month's extra pool.
5. This creates a compounding, exponential payoff acceleration curve over time.

---

## 5. Windfall Simulation Engine

Allows users to model one-time lump-sum injections (tax returns, annual bonuses, asset sales) or recurring monthly boosts:
- **One-Time Windfall**: Applied in Month 1.
- **Recurring Monthly Extra**: Applied every month on top of the monthly surplus.
- **Targeting**: With an explicit target, the windfall pays that debt first in every month it applies; anything left over joins the regular pool. With `auto_optimal`, the windfall follows the active strategy's order (highest APR for Avalanche and Minimums Only, smallest balance for Snowball, user ranking for Custom).
- **Minimums Only**: The windfall is still applied, highest APR first; the plan's own surplus stays at zero.
- Compares total months saved and interest spared against the same strategy without the windfall.

---

## 6. Directory Structure

```
Debt-Zero/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Typecheck, lint, test, then build & deploy to GitHub Pages
│       └── codeql.yml          # GitHub CodeQL security scanning (v4 actions)
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, layout.tsx)
│   ├── components/             # UI Components (Navbar, AmortizationTable, etc.)
│   ├── context/                # DebtContext state & local storage synchronization
│   ├── lib/
│   │   ├── debtEngine.ts       # Pure mathematical simulation engine + import sanitiser
│   │   ├── categories.ts       # Debt category labels, colours and typical APRs
│   │   ├── utils.ts            # Class names, ordinals, CSV cell escaping
│   │   └── version.ts          # App version shown in the UI and backups
│   └── types/
│       └── debt.ts             # Domain TypeScript interfaces
├── test/
│   ├── math.test.ts            # Engine test suite (node:test)
│   ├── ui.test.tsx             # Component tests (Vitest + Testing Library, jsdom)
│   ├── onboarding.test.tsx     # Setup wizard, backup import, Clear All Data, migration
│   ├── fixtures.ts             # Seeded sample plan for component tests
│   └── setup.ts                # jsdom shims (ResizeObserver)
├── vitest.config.ts            # UI test configuration
├── .nvmrc                      # Node version used by CI
├── package.json                # Dependencies, scripts (v1.3.0)
└── README.md                   # User guide & repository documentation
```

---

## 7. Testing & Verification

Run both test suites (CI runs these, plus `npm run typecheck` and `npm run lint`, before every deploy):
```bash
npm test
```
The engine suite verifies:
- Monthly interest compounding precision
- Paycheck frequency normalizations
- Free Cash Flow & DTI calculations
- Negative amortization detection & recommendations
- Strategy sorting orders (Avalanche, Snowball, Custom)
- Month-by-month accounting identity invariants
- Multi-strategy comparative outcomes
- Windfall acceleration impact (targets, recurring boosts, minimums-only)
- Import hardening (duplicate IDs, flat expense totals, empty debt lists)
- Savings comparability when a plan never pays off

The UI suites verify modal focus while typing, checklist persistence across reloads, custom-priority reordering, recovery from corrupt saved data, and the onboarding flow (first-run setup, step validation, building a plan, importing a backup, Clear All Data, and migration of v1.2 data).

## 8. Deployment

- `next.config.ts` reads `NEXT_PUBLIC_BASE_PATH` for sub-path hosting; the GitHub Pages workflow sets it from `actions/configure-pages`. Unset, the export works from a domain root.
- Production builds include a Content Security Policy meta tag (GitHub Pages cannot send headers).
