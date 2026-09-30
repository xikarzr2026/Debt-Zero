# 🏛️ DebtZero Architecture & Mathematical Specification

**Version:** 1.0.0  
**License:** MIT  
**Platform:** Next.js 16 (Turbopack, Static Export), React 19, TypeScript 5

---

## 1. High-Level System Overview

DebtZero is a client-first, privacy-first web application designed to compute accelerated debt payoff schedules, compare optimization algorithms, detect negative amortization traps, and track monthly execution.

### Architectural Tenets
1. **Local-First & Zero-Knowledge**: No user data is sent over the network. All state resides in React Context and persists to the user's browser `localStorage` (`debtzero_userdata_v1`).
2. **Mathematical Precision**: Amortization follows standard monthly compounding banking rules, maintaining strict accounting invariants:
   $$\text{Ending Balance}_m = \text{Starting Balance}_m + \text{Interest Charged}_m - \text{Total Payments}_m$$
3. **Stateless Financial Engine**: All simulation and sorting functions in `src/lib/debtEngine.ts` are pure functions, completely decoupled from React state and side-effects.

---

## 2. Core Mathematical Specifications

### 2.1 Monthly Compounding Interest
Monthly interest is calculated on the beginning-of-month principal balance:
$$\text{Monthly Interest} = \text{Round}_2\left(\text{Balance} \times \frac{\text{APR}}{100 \times 12}\right)$$
- If balance $\le 0$ or $\text{APR} \le 0$, interest is strictly $\$0.00$.
- Cents are rounded to 2 decimal places using half-up banking conventions.

### 2.2 Income Normalization
Users can enter income in arbitrary pay frequencies, normalized to a standard monthly baseline:
- **Weekly**: $\text{Monthly} = \text{Round}_2\left(\frac{\text{Amount} \times 52}{12}\right)$
- **Bi-Weekly**: $\text{Monthly} = \text{Round}_2\left(\frac{\text{Amount} \times 26}{12}\right)$
- **Semi-Monthly**: $\text{Monthly} = \text{Round}_2(\text{Amount} \times 2)$
- **Monthly**: $\text{Monthly} = \text{Amount}$

### 2.3 Free Cash Flow (FCF) & Debt-to-Income (DTI)
$$\text{Total Minimums} = \sum_{\text{active debts}} \text{minPayment}$$
$$\text{Free Cash Flow} = \text{Monthly Income} - \text{Living Expenses} - \text{Total Minimums}$$
$$\text{DTI Ratio} = \left(\frac{\text{Total Minimums}}{\text{Monthly Income}}\right) \times 100$$
*Note: Accounts with $\$0.00$ balance are excluded from minimum payment summation.*

### 2.4 Negative Amortization Detection
If contractual minimum payment $\le$ monthly accrued interest, the debt balance will never decrease. The system raises an alert and calculates a recommended safe minimum:
$$\text{Deficit} = \text{Monthly Interest} - \text{minPayment}$$
$$\text{Recommended Min} = \text{Monthly Interest} + \max(25, \text{Balance} \times 0.015)$$

---

## 3. Repayment Strategies

### 3.1 Debt Avalanche (Mathematically Optimal)
Prioritizes debts with the highest Annual Percentage Rate (APR).
- **Primary Sort**: APR descending (`b.apr - a.apr`).
- **Tie-Breaker**: Lowest current remaining balance (`a.currentBalance - b.currentBalance`).
- **Mathematical Property**: Minimizes total lifetime interest paid across all active liabilities.

### 3.2 Debt Snowball (Behavioral Momentum)
Prioritizes debts with the smallest current remaining balance.
- **Primary Sort**: Current remaining balance ascending (`a.currentBalance - b.currentBalance`).
- **Tie-Breaker**: Highest APR (`b.apr - a.apr`).
- **Mathematical Property**: Maximizes payoff velocity of individual debt accounts early on, freeing up baseline cash flow and building behavioral adherence.

### 3.3 Custom Priority
Allows users to assign manual priority rankings ($1, 2, 3, \dots$) to match personal, familial, or psychological goals.

### 3.4 Minimums-Only Baseline
Simulates paying only contractual minimum payments without applying discretionary surplus. Serves as the quantitative benchmark to measure interest and time saved.

---

## 4. The Exponential Rollover Multiplier

When an active debt reaches a balance of $\$0.00$:
1. Its contractual minimum payment is retired from that specific account.
2. Rather than being re-absorbed into living expenses, that minimum payment amount is added to `rolledOverMinPayments`.
3. In subsequent months, the total extra surplus pool is expanded:
   $$\text{Available Extra} = \text{Discretionary Surplus} + \text{Rolled-Over Minimums}$$
4. This creates a compounding, exponential payoff acceleration curve over time.

---

## 5. Windfall Simulation Engine

Allows users to model one-time lump-sum injections (tax returns, annual bonuses, asset sales) or recurring monthly boosts:
- **One-Time Windfall**: Applied in Month 1 to the prioritized target debt (`auto_optimal` targets the highest APR debt).
- **Recurring Monthly Extra**: Continuously injected on top of monthly free cash flow.
- Compares total months saved and interest spared against the baseline strategy.

---

## 6. Directory Structure

```
Debt-Zero/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # GitHub Pages automated build & deploy (v7 actions)
│       └── codeql.yml          # GitHub CodeQL security scanning (v4 actions)
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, layout.tsx)
│   ├── components/             # UI Components (Navbar, AmortizationTable, etc.)
│   ├── context/                # DebtContext state & local storage synchronization
│   ├── lib/
│   │   ├── debtEngine.ts       # Pure mathematical simulation engine
│   │   └── presets.ts          # Pre-configured scenario profiles
│   └── types/
│       └── debt.ts             # Domain TypeScript interfaces
├── test/
│   └── math.test.ts            # Automated mathematical verification test suite
├── package.json                # Dependencies, scripts (v1.0.0)
└── README.md                   # User guide & repository documentation
```

---

## 7. Testing & Verification

Run the automated mathematical test suite:
```bash
npm test
```
The test suite verifies:
- Monthly interest compounding precision
- Paycheck frequency normalizations
- Free Cash Flow & DTI calculations
- Negative amortization detection & recommendations
- Strategy sorting orders (Avalanche, Snowball, Custom)
- Month-by-month accounting identity invariants
- Multi-strategy comparative outcomes
- Windfall acceleration impact
