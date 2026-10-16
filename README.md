# 🚀 DebtZero: Intelligent Debt Elimination & Payoff Engine

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://xikarzr2026.github.io/Debt-Zero/)
[![Version](https://img.shields.io/badge/Version-1.3.0-emerald?style=for-the-badge)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **DebtZero** is a modern, privacy-focused financial web application that computes optimal debt repayment trajectories, simulates payoff strategies, and visualizes interest savings to help you become debt-free faster.

🔗 **Live Application URL**: [https://xikarzr2026.github.io/Debt-Zero/](https://xikarzr2026.github.io/Debt-Zero/)

---

## 📸 Key Features

### 0. 🧭 Guided Setup or Load a Backup
- On first visit DebtZero opens a setup screen instead of a dashboard full of sample numbers. Nothing is shown until you have a plan of your own.
- **Guided setup** (about 3 minutes, 4 steps): income and pay frequency, monthly expenses, your debts (with an instant warning when a minimum payment doesn't cover the interest), then how much extra to pay and which strategy to use.
- **Import a backup**: drop or choose a `.json` file saved earlier with **Settings → Save plan to file**.
- Close the setup screen and you get a short "No plan loaded yet" page with a single **Start Setup / Load Plan** button.
- Re-run guided setup at any time from **Settings → Guided setup…**; it starts from your current plan.

### 1. ⚡ Multi-Strategy Optimization Algorithms
- **Debt Avalanche (Mathematical Optimum)**: Prioritizes debts with the highest Annual Percentage Rate (APR). Minimizes total interest paid and saves the most money overall.
- **Debt Snowball (Psychological Momentum)**: Prioritizes debts with the smallest balances first to generate rapid milestone wins and build financial momentum.
- **Custom Priority**: Manually rank debts with the up/down arrows in the Debts Inventory (shown when Custom Priority is selected).
- **Minimums-Only Benchmark**: Automatically compares your accelerated strategy against standard minimum payments to highlight total interest and time saved. When minimums alone would never clear the debt, the app says so instead of quoting a misleading "savings" figure.

### 2. 📊 Interactive Payoff Timeline & Projection
- Dynamic multi-year trajectory visualization showing aggregate balance decline over time.
- Your active strategy plotted against the **Minimum Payments Only** baseline, plus per-account and cumulative-interest views. Strategy cards compare **Avalanche**, **Snowball**, **Custom**, and **Minimums Only** side by side.
- The chart shows up to 15 years; longer schedules are complete in the amortization table.
- Clear timeline metrics showing exact debt-free dates and lifetime interest accrued.

### 3. 💵 Cash Flow & Budget Engine
- Configurable net income engine supporting monthly, bi-weekly, semi-monthly, and weekly pay periods.
- Itemized essential living expenses breakdown (housing, utilities, groceries, transportation, insurance, subscriptions, other).
- Automatically calculates monthly discretionary surplus available for extra debt acceleration.

### 4. 🗓️ Monthly Payment Checklist & Due Date Tracker
- Payment checklist for the current month with individual debt due dates.
- Clear split between contractual minimum payments and allocated surplus extra principal.
- One-click paid/pending toggling. Checkmarks are saved in the browser and reset automatically when the month's payment plan changes.

### 5. 🔮 "What-If" Windfall & Acceleration Simulator
- Real-time simulation of one-time lump-sum windfalls (tax refunds, work bonuses, asset sales) or recurring monthly budget boosts.
- Send the windfall to a specific account (every month, for recurring boosts) or let the active strategy choose.
- Instant feedback showing exact months shaved off your payoff journey and total interest spared, measured against your active strategy.

### 6. 📋 Detailed Month-by-Month Amortization Schedule
- Complete granular ledger detailing starting balances, monthly interest accrued, principal reduction, and ending balances for every single debt.
- Searchable by debt name, paginated for performance, and structured for clarity.

### 7. 🌍 Multi-Currency & Locale Support
- Supports instant switching across major global currencies:
  - **USD** ($)
  - **EUR** (€)
  - **GBP** (£)
  - **CAD** (CA$)
  - **AUD** (A$)
  - **JPY** (¥)
  - **MXN** (MX$)

---

## 🔒 Data Storage & Privacy: Where Does Your Info Go?

> **Short Answer**: Nowhere. **100% of your data stays strictly on your personal device.**

- **Zero Remote Servers or Databases**: DebtZero does not operate any backend database, cloud sync, or external tracking servers. None of your debts, balances, interest rates, income, or personal numbers are ever transmitted over the network.
- **Client-Side `localStorage` Only**: All financial records, custom payoff settings, and checklists are saved exclusively in your browser's private `localStorage` sandbox (`debtzero_userdata_v1`).
- **No Accounts or Bank Linking**: You never have to sign up, enter an email, connect a bank account, or provide personal credentials.
- **Nothing Stored Until You Have a Plan**: The app saves only after you finish guided setup or load a backup. Before that, nothing is written to your browser.
- **Full Portability & Backups**: **Settings → Save plan to file** downloads your complete plan as `.json`; **Settings → Load plan from file…** (or the setup screen) restores it on any machine or browser.
- **Data Removal**: **Settings → Clear all data**, clearing your browser's site data, or closing a private/incognito window wipes everything stored on your device and returns DebtZero to the setup screen.
- **Validated Restores**: Imported backups and data read back from `localStorage` go through the same validation, so a corrupted or hand-edited file cannot crash the app.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Static HTML Export)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Tailwind CSS & Modern Glassmorphic Design System
- **CI/CD & Hosting**: [GitHub Actions](https://github.com/features/actions) + [GitHub Pages](https://pages.github.com/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.6 or newer (see `.nvmrc`; the engine tests use Node's built-in TypeScript support)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:xikarzr2026/Debt-Zero.git
   cd Debt-Zero
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Automated Mathematical Verification & Test Suite

DebtZero has two test suites:

```bash
npm test             # runs both suites
npm run test:engine  # financial engine (node:test)
npm run test:ui      # React components in jsdom (Vitest + Testing Library)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

### Verified Mathematical Modules:
- **Monthly Compounding Interest**: Exact precision rounding to the cent (`balance * (apr / 100 / 12)`).
- **Pay Frequency Normalization**: Accurate conversion across weekly, bi-weekly, semi-monthly, and monthly paychecks.
- **Free Cash Flow & DTI**: Accurate surplus determination excluding retired/zero-balance liabilities.
- **Negative Amortization Alerting**: Automatic warning when contractual minimums do not cover monthly interest accrual.
- **Accounting Invariant Identity**: Proves `Ending Balance = Starting Balance + Interest Charged - Total Payments` across every month.
- **Multi-Strategy Optimization**: Checks on sample portfolios that Debt Avalanche pays no more interest than Snowball and that each strategy retires debts in the expected order.
- **Windfall Acceleration**: Verifies interest and months saved under one-time and recurring lump-sum simulations, explicit targets, and minimums-only plans.
- **Import & Storage Hardening**: Duplicate IDs, non-finite numbers, flat expense totals, and corrupt saved data.
- **UI Behaviour**: Modal focus while typing, checklist persistence across reloads, custom-priority reordering.
- **Onboarding**: First-run setup screen, step-by-step validation, building a plan, importing a backup, Clear All Data, and migration of data saved by earlier versions.

---

## 📦 Production Build & Deployment

To create a static production build exported to the `/out` directory:

```bash
npm run build
```

The build is served from the domain root by default. To host it under a sub-path (as GitHub Pages does for project sites), set `NEXT_PUBLIC_BASE_PATH`:

```bash
NEXT_PUBLIC_BASE_PATH=/Debt-Zero npm run build
```

`npm start` does not apply to static exports; serve the `out/` folder with any static file server instead.

### GitHub Pages Deployment
This repository is pre-configured with automated GitHub Actions continuous deployment (`.github/workflows/deploy.yml`). Any push to the `main` branch automatically:
1. Installs clean dependencies (`npm ci`).
2. Runs the typecheck, lint, and both test suites; any failure stops the deploy.
3. Generates the static export bundle with the Pages base path (`npm run build`).
4. Uploads the build artifact and deploys directly to GitHub Pages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
